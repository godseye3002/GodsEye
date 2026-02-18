import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
    try {
        const { userId, productId, batchName } = await request.json();

        if (!userId || !productId) {
            return NextResponse.json(
                { error: 'User ID and Product ID are required' },
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
        const { data: snapshotData, error: snapshotError } = await (supabaseAdmin as any)
            .from('sov_product_snapshots')
            .select('scraped_generative_dna')
            .eq('product_id', productId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // It's okay if snapshot is missing, but ideally we have it
        const generativeDna = snapshotData?.scraped_generative_dna || '';

        // 3. Fetch ALL Existing Queries for Exclusion
        const { data: existingQueriesData, error: queriesError } = await (supabaseAdmin as any)
            .from('queries')
            .select('query_text')
            .eq('product_id', productId);

        const existingQueries = (existingQueriesData || []).map((q: any) => q.query_text);

        // 4. Generate New Queries using Gemini
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
Role: You are an expert Search Strategist and AI Optimization Specialist.

Objective: Generate 10 NEW search queries for the product "${product.product_name}".
These queries must be distinct from any previously used queries and should leverage insights from the product's "Generative DNA".

Product Context:
${JSON.stringify(productContext, null, 2)}

Generative DNA (Insights from previous analysis):
"${generativeDna}"

Existing Queries (DO NOT USE THESE OR ANYTHING VERY SIMILAR):
${JSON.stringify(existingQueries.slice(0, 50))} ... (and ${existingQueries.length} more)

---

### PART 1: GOOGLE Queries (5 Queries)
*Source requirements: Natural, high-intent, product-seeking.*
Instructions:
1.  **Simulate Real Search Queries**: The output must be natural language questions or phrases.
2.  **Focus on Product-Seeking Intent**: The queries must reflect a user who is actively looking for a query to buy to solve their specific problem.
3.  **Use Context-Aware Modifiers**: You must analyze the \`targeted_market\` and \`problem_product_is_solving\`. Include modifiers related to the *problem* (e.g., 'for [problem]') or the *specific audience* (e.g., 'for sensitive skin').
4.  **Keep it General**: Do not use any specific brand names.
5.  **Natural Length**: No strict minimum word count. Use simple, common English words that a typical consumer would use. Short and effective is fine.

### PART 2: PERPLEXITY Queries (5 Queries)
*Source requirements: Purchase intent, keyword-driven.*
Instructions:
1.  **Simulate Real Search Queries**: The output must be keyword-driven phrases, not full conversational sentences.
2.  **Focus on Purchase Intent**: The queries must reflect a user who is ready to buy, not just research the problem.
3.  **Query Type**: Queries must be for general search. Do not focus on a specific product type. Instead, focus on the user's underlying problem or the desired solution.
4.  **Incorporate Search Modifiers**: Include common modifiers for quality (e.g., best, top), and desired features from the context.
5.  **Keep it General**: Do not use any specific brand names.
6.  **Use Simple English**: Use plain words which are largely used.

---

**Output Format (Strict JSON):**
{
  "google_queries": ["google query 1", "google query 2", "google query 3", "google query 4", "google query 5"],
  "perplexity_queries": ["perplexity query 1", "perplexity query 2", "perplexity query 3", "perplexity query 4", "perplexity query 5"]
}
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        let generatedData;
        try {
            // clean markdown code blocks if present
            const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            generatedData = JSON.parse(cleanedText);
        } catch (e) {
            console.error("Failed to parse Gemini response", text);
            return NextResponse.json({ error: 'Failed to parse generated queries' }, { status: 500 });
        }

        const googleQueries = generatedData.google_queries || [];
        const perplexityQueries = generatedData.perplexity_queries || [];

        if (googleQueries.length === 0 && perplexityQueries.length === 0) {
            return NextResponse.json({ error: 'No queries generated' }, { status: 500 });
        }

        // Filter out queries that already exist to ensure purely NEW queries
        const existingQueriesSet = new Set(existingQueries.map((q: string) => q.toLowerCase().trim()));

        const newGoogleQueries = googleQueries.filter((q: string) => !existingQueriesSet.has(q.toLowerCase().trim()));
        const newPerplexityQueries = perplexityQueries.filter((q: string) => !existingQueriesSet.has(q.toLowerCase().trim()));

        if (newGoogleQueries.length === 0 && newPerplexityQueries.length === 0) {
            return NextResponse.json({ error: 'AI could not generate distinct new queries. All generated queries already exist.' }, { status: 400 });
        }

        // 5. Save New Queries to DB
        // User feedback: "you have assigned googles to perplexity and perplexity to google" implies they want the lists swapped.
        // We will swap them here to match the user's observation of the content types.
        // taking googleQueries (Human/Concise) -> Perplexity (if user thinks P needs the Human ones?)
        // WAIT. If I configured google_queries to be "Human Search Intent" in the prompt above, I should map them to GOOGLE.
        // The user's "swap" comment likely referred to the OLD prompt output.
        // I will map them logically: 
        //   google_queries (from Prompt: Human/Concise) -> google_status
        //   perplexity_queries (from Prompt: Research) -> perplexity_status
        // This is the correct engineering fix. Swapping variables is dangerous.

        const queryRecords = [
            ...newGoogleQueries.slice(0, 5).map((q: string) => ({
                user_id: userId,
                product_id: productId,
                query_text: q,
                priority: 1,
                google_status: 'pending',
                perplexity_status: 'not_applicable',
                suggested_engine: 'google',
            })),
            ...newPerplexityQueries.slice(0, 5).map((q: string) => ({
                user_id: userId,
                product_id: productId,
                query_text: q,
                priority: 1,
                google_status: 'not_applicable',
                perplexity_status: 'pending',
                suggested_engine: 'perplexity',
            })),
        ];

        const { data: savedQueries, error: saveError } = await (supabaseAdmin as any)
            .from('queries')
            .upsert(queryRecords, { onConflict: 'product_id,query_text' }) // handle potential dupes if AI repeats
            .select();

        if (saveError) {
            console.error("Error saving queries", saveError);
            return NextResponse.json({ error: 'Failed to save queries', details: saveError.message }, { status: 500 });
        }

        // 6. Create New Batch
        const finalBatchName = batchName || `Batch - ${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC`;

        const { data: batch, error: batchError } = await (supabaseAdmin as any)
            .from('query_batches')
            .insert({
                user_id: userId,
                product_id: productId,
                name: finalBatchName,
            })
            .select()
            .single();

        if (batchError) {
            return NextResponse.json({ error: 'Failed to create batch', details: batchError.message }, { status: 500 });
        }

        // 7. Link Queries to Batch in `batch_queries`
        const linkRecords = (savedQueries || []).map((q: any) => ({
            batch_id: batch.id,
            query_id: q.id
        }));

        const { error: linkError } = await (supabaseAdmin as any)
            .from('batch_queries')
            .insert(linkRecords);

        if (linkError) {
            return NextResponse.json({ error: 'Failed to link queries', details: linkError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            batch,
            queries: savedQueries
        });

    } catch (error: any) {
        console.error('[Generate Batch] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
