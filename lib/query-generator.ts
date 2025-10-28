import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Type Definitions ---
export interface GeneratedQuery {
  queries: string[];
  topQuery: string;
}

export interface ProductContext {
  general_product_type: string;
  specific_product_type: string;
  targeted_market: string;
  problem_product_is_solving: string;
}

/**
 * Main function to generate high-intent search queries using the Gemini API.
 */
export async function generateSearchQueries(productContext: ProductContext): Promise<GeneratedQuery | null> {
  const API_KEY: string = process.env.GEMINI_API_KEY3 || '';
  
  if (!API_KEY) {
    console.error("GEMINI_API_KEY3 is not defined in the environment variables.");
    return null;
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = `
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

  console.log("🚀 Sending prompt to the Gemini API for query generation...");
  
  try {
    const result = await model.generateContentStream(prompt);

    let fullResponse = '';
    for await (const chunk of result.stream) {
      fullResponse += chunk.text();
    }
    
    const listMatch = fullResponse.match(/\[([\s\S]*?)\]/);

    if (listMatch && listMatch[1]) {
      const listContent = listMatch[1];
      const queries = listContent.match(/"(.*)"/g);
      
      if (queries) {
        const cleanedQueries = queries.map(q => q.slice(1, -1).trim());
        const uniqueQueries = [...new Set(cleanedQueries)];
        const finalQueries = uniqueQueries.slice(0, 5);

        console.log("\n--- Generated Search Queries ---");
        console.log(finalQueries);

        // Check if the array is not empty before selecting the first element
        if (finalQueries.length > 0) {
          // Select the first (top-ranked) query
          const topQuery = finalQueries[0];

          console.log("\n--- ✅ Top-Ranked Query for API Call ---");
          console.log(topQuery);

          return {
            queries: finalQueries,
            topQuery: topQuery
          };

        } else {
          console.log("\nNo valid queries were generated.");
          return null;
        }

      } else {
        console.log("Could not extract any queries from the model's response.");
        return null;
      }
    } else {
      console.log("Could not find a Python-style list in the model's response.");
      return null;
    }

  } catch (error) {
    console.error("An error occurred while generating content:", error);
    return null;
  }
}
