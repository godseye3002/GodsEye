import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * POST /api/generate-batch-chatgpt
 * Generates ChatGPT-only queries for an existing batch that was created before
 * the ChatGPT pipeline was introduced.
 */
export async function POST(request: Request) {
    try {
        const { userId, productId, batchId } = await request.json();

        if (!userId || !productId || !batchId) {
            return NextResponse.json(
                { error: 'User ID, Product ID, and Batch ID are required' },
                { status: 400 }
            );
        }

        const supabaseAdmin = getSupabaseAdminClient();

        // 1. Fetch Product Data
        const { data: product, error: productError } = await (supabaseAdmin as any)
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

        if (productError || !product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // 2. Fetch Latest Scraped Generative DNA
        const { data: snapshotData } = await (supabaseAdmin as any)
            .from('sov_product_snapshots')
            .select('scraped_generative_dna')
            .eq('product_id', productId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const generativeDna = snapshotData?.scraped_generative_dna || '';

        // 3. Fetch ALL Existing Queries for Exclusion
        const { data: existingQueriesData } = await (supabaseAdmin as any)
            .from('queries')
            .select('query_text')
            .eq('product_id', productId);

        const existingQueries = (existingQueriesData || []).map((q: any) => q.query_text);

        // 4. Generate ChatGPT Queries using Gemini
        const API_KEY: string = process.env.GEMINI_API_KEY || '';
        if (!API_KEY) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not defined" }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

        const productContext = {
            product_name: product.product_name,
            description: product.description,
            targeted_market: product.targeted_market,
            problem_product_is_solving: product.problem_product_is_solving,
            general_product_type: product.general_product_type,
            specific_product_type: product.specific_product_type,
        };

        const prompt = `
Role: You are a digital marketing analyst specializing in conversational AI platforms like ChatGPT, Claude, and similar LLM-based assistants.

Objective: Generate 5 NEW conversational prompts for the product "${product.product_name}".
These prompts must be distinct from any previously used queries and should leverage insights from the product's "Generative DNA".

Product Context:
${JSON.stringify(productContext, null, 2)}

Generative DNA (Insights from previous analysis):
"${generativeDna}"

Existing Queries (DO NOT USE THESE OR ANYTHING VERY SIMILAR):
${JSON.stringify(existingQueries.slice(0, 50))} ... (and ${existingQueries.length} more)

---

Instructions:
1.  **Simulate Real ChatGPT Prompts**: The output must be natural, keyword-driven phrases or short questions.
2.  **Focus on Purchase Intent**: The queries must reflect a user who is ready to buy, not just research the problem.
3.  **Query Type**: Queries must be for general search or recommendation. Do not focus on a specific product type. Instead, focus on the user's underlying problem or the desired solution.
4.  **Incorporate Search Modifiers**: Include common modifiers for quality (e.g., best, top), and desired features from the context.
5.  **Keep it General**: Do not use any specific brand names.
6.  **Use Simple English**: Use plain words which are largely used.

**Output Format (Strict JSON):**
{
  "chatgpt_queries": ["query 1", "query 2", "query 3", "query 4", "query 5"]
}
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        let generatedData;
        try {
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            generatedData = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Failed to parse Gemini response", text);
            return NextResponse.json({ error: 'Failed to parse generated queries' }, { status: 500 });
        }

        const chatgptQueries = generatedData.chatgpt_queries || [];

        if (chatgptQueries.length === 0) {
            return NextResponse.json({ error: 'No ChatGPT queries generated' }, { status: 500 });
        }

        // Filter out queries that already exist
        const existingQueriesSet = new Set(existingQueries.map((q: string) => q.toLowerCase().trim()));
        const newChatgptQueries = chatgptQueries.filter((q: string) => !existingQueriesSet.has(q.toLowerCase().trim()));

        if (newChatgptQueries.length === 0) {
            return NextResponse.json({ error: 'AI could not generate distinct new ChatGPT queries.' }, { status: 400 });
        }

        // 5. Save New ChatGPT Queries to DB
        const queryRecords = newChatgptQueries.slice(0, 5).map((q: string) => ({
            user_id: userId,
            product_id: productId,
            query_text: q,
            priority: 1,
            google_status: 'not_applicable',
            perplexity_status: 'not_applicable',
            chatgpt_status: 'pending',
            suggested_engine: 'chatgpt',
        }));

        const { data: savedQueries, error: saveError } = await (supabaseAdmin as any)
            .from('queries')
            .upsert(queryRecords, { onConflict: 'product_id,query_text' })
            .select();

        if (saveError) {
            console.error("Error saving ChatGPT queries", saveError);
            return NextResponse.json({ error: 'Failed to save queries', details: saveError.message }, { status: 500 });
        }

        // 6. Link New Queries to the Existing Batch
        const linkRecords = (savedQueries || []).map((q: any) => ({
            batch_id: batchId,
            query_id: q.id
        }));

        const { error: linkError } = await (supabaseAdmin as any)
            .from('batch_queries')
            .insert(linkRecords);

        if (linkError) {
            return NextResponse.json({ error: 'Failed to link queries to batch', details: linkError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            queries: savedQueries,
            count: savedQueries?.length || 0,
        });

    } catch (error: any) {
        console.error('[Generate Batch ChatGPT] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
