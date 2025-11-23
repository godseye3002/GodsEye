import type { PipelineId } from "@/lib/pipelines";
import { addTokens } from "@/lib/token-usage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from 'next/server';

export interface ProductContext {
  general_product_type: string;
  specific_product_type: string;
  targeted_market: string;
  problem_product_is_solving: string;
}

export interface GeneratedQuery {
  queries: string[];
  topQuery: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const analysisId = typeof payload.analysisId === 'string' ? payload.analysisId : undefined;
    const allowed: readonly string[] = ['perplexity','google_overview','chatgpt','gemini'];
    const pipeline: PipelineId | undefined = allowed.includes(String(payload.pipeline)) ? (payload.pipeline as PipelineId) : undefined;
    const productContext: ProductContext = {
      general_product_type: String(payload.general_product_type ?? ''),
      specific_product_type: String(payload.specific_product_type ?? ''),
      targeted_market: String(payload.targeted_market ?? ''),
      problem_product_is_solving: String(payload.problem_product_is_solving ?? ''),
    };
    
    const API_KEY: string = process.env.GEMINI_API_KEY || '';
    
    if (!API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not defined in the environment variables." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    let prompt: string;

    if (pipeline === 'google_overview') {
      prompt = `
Role: You are a digital marketing analyst specializing in Google Search behavior and Answer Engine Optimization (AEO).


Objective: Generate a list of the most common, high-intent search queries that a potential customer would type into **Google** when they are looking for a **product recommendation**. The queries must be **specifically designed to trigger a Google AI Overview** that would likely recommend products matching the provided \`productContext\`.


Product Context:
${JSON.stringify(productContext, null, 2)}

STRICT NOTE: the minimum number of words in the query should be 6.

Instructions:
1. Simulate Real Search Queries: The output must be natural language questions or complex phrases.
2. Focus on Product-Seeking Intent: The queries must reflect a user who is actively looking for a **product to buy** to solve their specific problem. The goal is to get a definitive product recommendation or a "best of" list from the AI Overview.
3. Query Type (AI Overview Focus): Focus on explicit questions, problem-based queries, and requests for recommendations. Use the \`productContext\` to fill in the placeholders, the query should be bit long, medium length.
* **Good (High Trigger Chance):** "what are the best [specific_product_type] for [problem]", "[specific_product_type] recommendations for [user_type_or_problem]", "best [general_product_type] for [people_with_specific_problem]", "[specific_product_type] for [people_who_dislike_X]"
* **Okay (Medium Trigger Chance):** "best [specific_product_type] for [benefit]", "top rated [general_product_type] for [desired_outcome]"
* **Bad (Low Trigger Chance):** "buy [specific_product_type]", "[product] sale", "what is [product]", "best [product] for [benefit] and [benefit 2]"
4. Use Context-Aware Modifiers: You must analyze the \`targeted_market\` and \`problem_product_is_solving\` in the \`productContext\`.
* **Problem/Solution Modifiers:** The queries MUST include modifiers related to the *problem* (e.g., 'for [problem]'), the *desired outcome* (e.g., 'for [desired_outcome]'), or the *user's specific situation* (e.g., 'for people who dislike swallowing pills').
* **Audience Modifiers:** If the \`targeted_market\` specifies a particular audience (e.g., "for men," "for sensitive skin"), use those modifiers.
* **Broad Audience Logic:** If the context indicates the product is for a *broad* audience (e.g., "all hair types," "both men and women"), you **must not** invent limiting modifiers.
5. Keep it General: Do not use any specific brand names.
6. Ranking: **This is the most important instruction.** You must rank the queries based on their likelihood of triggering an AI Overview.
* **Rank 1 (Top):** Explicit questions (e.g., "What are...", "Which...") and problem-based queries (e.g., "[product] for people who..."), in short which query triggers the AI overview.
* **Rank Lower:** Standard "best..." or "top rated..." queries.
* This fixes the failure from the previous attempt.
7. Output Format: A Python list containing exactly 5 search query strings. For example: ["query one", "query two", ...]
8. IMPORTANT NOTE 1: All instructions (especially the "Good" examples) are templates. You must replace the placeholders like [product], [problem], etc., with the specific details from the \`productContext\`.
9. IMPORTANT NOTE 2: Use simple, common English words that a typical consumer would use.
`;
    } else {
      prompt = `
Role: You are a digital marketing analyst specializing in consumer search behavior.


Objective: Generate a list of the most common and high-intent search queries that a potential customer would type into a search engine when they are actively looking to purchase a [Product Category] to solve a [Core Problem].


Product Context:
${JSON.stringify(productContext, null, 2)}


Instructions:
1.  Simulate Real Search Queries: The output must be keyword-driven phrases, not full conversational sentences.
2.  Focus on Purchase Intent: The queries must reflect a user who is ready to buy, not just research the problem.
3.  Query Type: Queries must be for general search. Do not focus on a specific product type. Instead, focus on the user's underlying problem or the desired solution.
4.  Incorporate Search Modifiers: Include common modifiers for quality (e.g., best, top), and desired features from the context.
5.  Keep it General: Do not use any specific brand names or gender (only if the product is gender-neutral or else you can).
6.  Ranking: Rank the queries with the highest commercial intent (most likely to lead to a purchase) at the top.
IMPORTENT NOTE: Use simple english and plain words, the ones which are largely used.
Output Format:
A Python list containing exactly 5 search query strings. For example: ["query one", "query two", ...]
`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;

    try {
      const usage = response.usageMetadata;
      const input = usage?.promptTokenCount ?? usage?.totalTokenCount ?? 0;
      const output = usage?.candidatesTokenCount ?? 0;
      const total = usage?.totalTokenCount ?? input + output;
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Gemini][Generate Search Queries]' + (analysisId ? ` [analysisId=${analysisId}]` : '') + (pipeline ? ` [pipeline=${pipeline}]` : ''),
          { inputTokens: input, outputTokens: output, totalTokens: total });
      }
      addTokens(analysisId, pipeline, 'Generate Search Queries', input, output, total);
    } catch {}
    const text = response.text();

    // Parse the response to extract the Python list
    let queries: string[] = [];
    try {
      // Extract list from text using regex
      const listMatch = text.match(/\[([^\]]+)\]/);
      if (listMatch) {
        const listContent = listMatch[1];
        queries = listContent.split(',').map(q => 
          q.replace(/['"]/g, '').trim()
        ).filter(q => q.length > 0);
      }
    } catch (parseError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Generate Queries] Error parsing response:', parseError);
      }
      // Fallback: split by newlines and clean up
      queries = text.split('\n')
        .map(line => line.replace(/^["'\-\*\d\.\s]+|["'\,\s]+$/g, '').trim())
        .filter(line => line.length > 0);
    }

    const generatedQuery: GeneratedQuery = {
      queries: queries.slice(0, 5), // Ensure we have exactly 5 queries
      topQuery: queries[0] || ''
    };

    return NextResponse.json(generatedQuery);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Generate Queries] Error:', error);
    }
    return NextResponse.json(
      { error: 'Failed to generate search queries' },
      { status: 500 }
    );
  }
}
