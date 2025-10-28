import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { addTokens, getBreakdown } from "@/lib/token-usage";
import type { PipelineId } from "@/lib/pipelines";

export interface StrategicAnalysisRequest {
  aiSearchJson: any;
  clientProductJson: any;
}

export interface StrategicAnalysisResult {
  executive_summary?: {
    title: string;
    status_overview: string;
    strategic_analogy: string;
  };
  client_product_visibility?: {
    status: string;
    details: string;
  };
  ai_answer_deconstruction?: any;
  competitive_landscape_analysis?: any[];
  strategic_gap_and_opportunity_analysis?: any;
  actionable_recommendations?: any[];
  // Legacy fields for backward compatibility
  ai_engine_priorities?: string;
  the_ais_narrative?: string;
  the_winning_formula?: string;
  compitators?: string;
  the_gap_analysis?: string;
  strategic_analogy?: string;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const aiSearchJson = payload.aiSearchJson;
    const clientProductJson = payload.clientProductJson;
    const analysisId = typeof payload.analysisId === 'string' ? payload.analysisId : undefined;
    const allowed: readonly string[] = ['perplexity','google_overview','chatgpt','gemini'];
    const pipeline: PipelineId | undefined = allowed.includes(String(payload.pipeline)) ? (payload.pipeline as PipelineId) : undefined;
    
    const API_KEY: string = process.env.GEMINI_API_KEY || '';
    
    if (!API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not defined in the environment variables." },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    // const prompt = `
    //   Act as a world-class Marketing Strategist, a 'Marketing Genius' who masterfully simplifies complex market data into a structured, machine-readable format.

    //   You will be given two JSON objects:

    //   [AI_SEARCH_JSON]: The output from an AI search engine. This data represents the AI's summarized understanding of a topic or its proposed solution to a problem.

    //   [CLIENT_PRODUCT_JSON]: The detailed description, features, and specifications for our client's product.

    //   Your mission is to perform a strategic gap analysis. Assuming our client's product is NOT featured in the [AI_SEARCH_JSON], you will use both data sets to explain why.

    //   Your entire output must be a single, clean JSON object. Use the following keys for your analysis:

    //   "ai_engine_priorities": Analyze the structure and content of [AI_SEARCH_JSON]. What does this AI engine value most when creating its summary? Deduce its core priorities (e.g., does it prioritize clinical data, a diversity of solutions, natural ingredients, user warnings, or scientific terminology?). Explain this like you're briefing an engineer on the AI's ranking algorithm.

    //   "the_ais_narrative": What is the dominant story or narrative that the AI engine is telling about this problem space? What kind of solution does it seem to be promoting or describing? Describe the narrative in detail.

    //   "the_winning_formula": Based on your analysis, what is the "winning formula" that this AI engine appears to reward? If you wanted to create content or a product that would be featured prominently in this AI's summary, what specific elements, structure, or approach would you need to include?

    //   "compitators": List the compitators to the client's product and why the AI search chose them over the client's product if the clients product is not mentioned and if it is mentioned then explain why the AI search chose the client's product over the compitators and explain what will make the client's product better than the compitators (how to stand out). 

    //   "the_gap_analysis": This is the core of your analysis. Directly compare [CLIENT_PRODUCT_JSON] against the "winning formula" you just identified. Where does the client's product align with the AI's priorities, and where does it fall short? Be specific and detailed about the gaps.

    //   "strategic_analogy": Create a powerful, memorable analogy that summarizes the strategic situation. For example: "It's like bringing a knife to a gunfight" or "It's like showing up to a potluck with a gourmet meal when everyone else brought chips." The analogy should instantly clarify the strategic positioning.

    //   Here is the [AI_SEARCH_JSON]:
    //   ---
    //   ${JSON.stringify(aiSearchJson, null, 2)}
    //   ---

    //   Here is the [CLIENT_PRODUCT_JSON]:
    //   ---
    //   ${JSON.stringify(clientProductJson, null, 2)}
    //   ---

    //   Remember: Your entire output must be a single, valid JSON object with exactly the five keys specified above. Do not include any markdown formatting, explanations, or additional text.
    //   Note: Write in second person (‘you’, ‘your’), not third person (‘the client’).
    // `;

    const prompt = `Act as a world-class AEO (Answer Engine Optimization) Strategist and Competitive Analyst who analyzes the response of Perplexity AI (The AI Search Engine). Your expertise is in deconstructing AI-generated search responses to provide clients with a decisive competitive advantage.

            You will be provided with two JSON objects:

            [AI_SEARCH_JSON]: The scraped data from an AI search engine's answer for a specific query.

            [CLIENT_PRODUCT_JSON]: The data for your client's product.

            Your mission is to perform a deep, competitive analysis and deliver your findings in a structured, machine-readable format. Your analysis must be objective, data-driven, and provide clear, actionable recommendations.

            **Your Internal Thought Process Before Generating the Output:**

            1.  **Identify Presence:** First, meticulously scan the [AI_SEARCH_JSON]. Is your client's product (identified from [CLIENT_PRODUCT_JSON]) mentioned by name or brand in the ai_overview_text or source_links? This is the most critical first step and will determine the entire direction of your analysis.

            2.  **Deconstruct the AI's Logic:** Analyze the AI's response as a whole. What is the narrative? What types of features, claims, and sources does it consistently highlight? Ask yourself: "What are the common threads connecting the recommended products?"

            3.  **Profile the Winners:** For each competitor product mentioned, identify *why* it was included. What specific claim did the AI extract? Which source URL was cited for that claim? This reverse-engineers the "winning formula."

            4.  **Compare and Contrast:**

                * If your product IS mentioned: How is it framed compared to competitors? Is it positioned as a premium option, a budget choice, or a specialized solution? Are its best features being highlighted?

                * If your product IS NOT mentioned: What key attributes from the "winning formula" are missing from your product's data or likely from its online presence? Are competitors winning on specific ingredients, clinical proof, source authority, or better-structured content?

            5.  **Formulate Strategy:** Based on the gap analysis, what are the most impactful actions your client can take to either improve their position or get included in the first place?

            Your entire output must be a **single, clean JSON object**. Use the detailed structure provided below.

            Here is the [AI_SEARCH_JSON]:

            ${JSON.stringify(aiSearchJson, null, 2)}

            Here is the [CLIENT_PRODUCT_JSON]:

            ${JSON.stringify(clientProductJson, null, 2)}

            The JSON Structure for the Output:
            {

              "executive_summary": {
                "title": "Your AEO Competitive Analysis for [Client Product Name]",
                "status_overview": "A one-sentence summary stating if your product was featured and its overall competitive position (e.g., 'Your product was not featured, as the AI currently prioritizes competitors with clinically-backed claims and mentions on high-authority health publications.') or ('Your product was featured, but it is being positioned as a natural alternative, while competitors are highlighted for their scientific formulations.')",
                "strategic_analogy": "A powerful, memorable analogy summarizing the strategic situation. (e.g., 'This is like arriving at a science fair with a beautiful painting. The judges are rewarding data and evidence, and while your product has artistic merit, it's not speaking the language of the competition.')"
              },

              "client_product_visibility": {
                "status": "Featured | Not Featured",
                "details": "If 'Featured', describe exactly how and where it was mentioned (e.g., 'Mentioned by name in the main recommendation list and cited directly from your brand website.'). If 'Not Featured', state this clearly."
              },

              "ai_answer_deconstruction": {
                "dominant_narrative": "Describe the 'story' the AI is telling. What kind of solution is it promoting for the user's query? (e.g., 'The AI is building a narrative around solving hair fall with scientifically-validated ingredients and expert-approved formulas, while also acknowledging natural alternatives.')",
                "key_decision_factors": [
                  "List the specific attributes the AI is using to select and rank products. Examples: 'Specific, named ingredients (e.g., keratin, adenosine, onion)', 'Presence of scientific terms (e.g., clinically proven, nutrilock actives)', 'Source authority (e.g., direct brand sites, health publications, major e-commerce platforms)', 'Key product features (e.g., sulphate-free)', 'Solutions for a specific sub-problem (e.g., strengthening roots, reducing breakage)'."
                ],
                "trusted_source_analysis": "Analyze the source_links. What types of websites is the AI citing and trusting? (e.g., 'The AI demonstrates high trust in a mix of direct-to-consumer brand websites, major e-commerce category pages, and authoritative third-party content sites like health magazines.')"
              },
              "competitive_landscape_analysis": [
                {
                  "competitor_name": "Example: Mamaearth Onion Shampoo",
                  "reason_for_inclusion": "Explain precisely why this competitor was chosen, based on the AI's extracted text. (e.g., 'The AI specifically highlighted its key natural ingredients (onion, plant keratin) and a clear benefit (reducing hair fall), which aligns with its value for specific, named ingredients.')",
                  "source_of_mention": "Provide the URL from the source_links that the AI associated with this competitor. (e.g., '[https://mamaearth.in/product-category/hair-shampoo](https://mamaearth.in/product-category/hair-shampoo)')"
                }
              ],

              "strategic_gap_and_opportunity_analysis": {
                "analysis_summary": "This is the core of your report. Provide a detailed explanation based on your product's visibility status.",
                "if_featured": {
                  "current_positioning": "How does the AI's description of your product compare to competitors? What are its perceived strengths and weaknesses? (e.g., 'Your product is positioned effectively as a premium, science-backed solution due to the mention of 'adenosine' and 'procapil'. However, competitors like Dove are framed as being better for 'smoother hair', indicating a potential gap in highlighting secondary benefits.')",
                  "opportunities_for_improvement": "How can you enhance your positioning? (e.g., 'Update your product page to also emphasize moisturizing and smoothing properties to compete with Dove's narrative. Seek mentions on pharmacy or health blogs to match the source diversity of competitors.')"
                },

                "if_not_featured": {
                        competitive_landscape_analysis, what are the specific reasons your product was excluded? Be direct. (e.g., 'Your product was not mentioned primarily because your online content does not explicitly name the key active ingredients that the AI is looking for, such as 'keratin' or 'biotin'. Competitors are being rewarded for this specificity.')",
                        uct featured? (e.g., 'Revise your product page to include a 'Key Ingredients' section that clearly lists active components and their benefits. Pursue a product feature on a major e-commerce platform like Nykaa or a content site like Health.com, as the AI trusts these third-party sources.')"

                    }
                  },

                  "actionable_recommendations": [
                          {
                            "recommendation": "Content Structure Enhancement",
                            "action": "On your primary product page, implement a clear, scannable structure using H2/H3 tags for 'Key Benefits', 'Active Ingredients', and 'How It Works'. Use bullet points to list features, making the information easily parsable for AI crawlers."
                          },
                          {
                            "recommendation": "Keyword and Claim Alignment",
                            "action": "Ensure the exact phrases and claims rewarded by the AI (e.g., 'reduces breakage', 'clinically proven', 'sulphate-free') are present and prominent in your product descriptions and marketing copy."
                          },
                          {
                            "recommendation": "Third-Party Validation Strategy",
                            "action": "Develop a strategy to get your product listed or reviewed on the types of authoritative domains the AI is citing (e.g., health blogs, online pharmacies, respected e-commerce sites). This builds the external trust the AI is looking for."
                          }
                      ]
                }`

    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log(aiSearchJson);
    try {
      const usage = response.usageMetadata;
      const input = usage?.promptTokenCount ?? usage?.totalTokenCount ?? 0;
      const output = usage?.candidatesTokenCount ?? 0;
      const total = usage?.totalTokenCount ?? input + output;
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Gemini][Strategic Analysis]' + (analysisId ? ` [analysisId=${analysisId}]` : '') + (pipeline ? ` [pipeline=${pipeline}]` : ''),
          { inputTokens: input, outputTokens: output, totalTokens: total });
      }
      addTokens(analysisId, pipeline, 'Strategic Analysis', input, output, total);
      const breakdown = getBreakdown(analysisId);
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Gemini][Totals]' + (analysisId ? ` [analysisId=${analysisId}]` : ''), {
          totalTokens: breakdown.total,
          byPurpose: breakdown.byPurpose,
          byPipeline: breakdown.byPipeline,
        });
      }
    } catch {}
    const text = response.text();

    // Parse the JSON response with enhanced error handling
    let analysisResult: StrategicAnalysisResult;
    try {
      // Clean the response text to ensure it's valid JSON
      let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Additional cleaning for common formatting issues
      cleanText = cleanText.replace(/^[^{]*/, ''); // Remove any text before first {
      cleanText = cleanText.replace(/[^}]*$/, ''); // Remove any text after last }
      
      // Attempt to parse
      analysisResult = JSON.parse(cleanText);
      
      // Validate required structure
      if (!analysisResult.executive_summary || !analysisResult.client_product_visibility) {
        throw new Error('Invalid analysis structure: missing required fields');
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('Strategic analysis parsed successfully');
      }
    } catch (parseError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error parsing strategic analysis response:', parseError);
        console.error('Raw response (first 500 chars):', text.substring(0, 500));
        console.error('Cleaned text (first 500 chars):', text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim().substring(0, 500));
      }
      
      // Return a user-friendly error with partial data if possible
      return NextResponse.json(
        { 
          error: 'The AI analysis service returned an unexpected format. Our team has been notified and is working on a fix. Please try again in a few moments.',
          technicalDetails: parseError instanceof Error ? parseError.message : 'Unknown parsing error',
          rawResponsePreview: text.substring(0, 200)
        },
        { status: 500 }
      );
    }

    return NextResponse.json(analysisResult);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Strategic Analysis] Error:', error);
    }
    return NextResponse.json(
      { error: 'Failed to perform strategic analysis' },
      { status: 500 }
    );
  }
}
