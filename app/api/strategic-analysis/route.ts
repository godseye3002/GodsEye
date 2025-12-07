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
  sources_ai_used?: Array<{
    source_snippet: string;
    reason_for_inclusion: string;
    source_of_mention: string;
  }>;
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
    //   ... (legacy prompt omitted for brevity)
    // `;

    const basePrompt = `Act as a world-class AEO (Answer Engine Optimization) Strategist and Competitive Analyst who analyzes the response of Perplexity AI (The AI Search Engine). Your expertise is in deconstructing AI-generated search responses to provide clients with a decisive competitive advantage.

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

            6. **Source Links:** You MUST represent all source_links from the [AI_SEARCH_JSON] in the structured output, without inventing new URLs or sources.

   - **competitive_landscape_analysis**: Summarizes competitors that appear in the AI answer, and links them to the MOST relevant source URL from source_links.
   - **sources_ai_used**: A complete list where there is EXACTLY ONE entry for EACH item in source_links.

   For sources_ai_used:
   - The number of items in sources_ai_used MUST equal the number of items in source_links.
   - Each item must correspond directly to one source_links entry.
   - Use only information that actually appears in ai_overview_text or source_links. If you cannot find enough detail for a snippet or reason, say so explicitly (e.g., 'Snippet not clearly available in provided text.').
   - Do NOT invent URLs, brands, or claims that are not grounded in the provided JSON.

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
                  "competitor_name": "Name of the competitor product or brand as mentioned in the AI's answer.",
                  "reason_for_inclusion": "Explain, using only evidence from the AI's overview text and source_links, why this competitor appears in the answer.",
                  "source_of_mention": "Provide the URL from source_links that this competitor is most directly associated with. If multiple could apply, pick the single best matching URL. Do not invent or modify URLs."
                }
              ],
              "sources_ai_used": [
                {
                  "source_snippet": "Extract a short snippet from this source or from the AI overview that reflects how this source was used. If no clear snippet is available, state 'Snippet not clearly available in provided text.'",
                  "reason_for_inclusion": "In one or two sentences, explain why this source matters for the AI's reasoning, based only on information actually present in ai_overview_text or source_links.",
                  "source_of_mention": "Provide the exact URL from source_links. Do not invent or alter URLs."
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
                }
                
                CRITICAL REQUIREMENTS:
                1. You MUST populate the other_sources_ai_used array with ALL non-competitor sources from source_links
                2. Every source from source_links must appear in either competitive_landscape_analysis OR other_sources_ai_used
                3. Do not leave other_sources_ai_used empty unless there are truly no other sources
                4. Ensure all URLs are valid and accessible
                `;

    const prompt =
      pipeline === 'google_overview'
        ? basePrompt.replace(
            'Perplexity AI (The AI Search Engine)',
            'Google AI Overview (The AI Search Engine)'
          )
        : basePrompt;

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
      // 1) Remove any text before the first opening brace
      const firstBraceIndex = cleanText.indexOf('{');
      if (firstBraceIndex > 0) {
        cleanText = cleanText.slice(firstBraceIndex);
      }

      // 2) Remove any trailing junk after the last closing brace OR bracket.
      //    Using only '}' here can accidentally cut off a final ']' and break arrays.
      const lastBraceIndex = cleanText.lastIndexOf('}');
      const lastBracketIndex = cleanText.lastIndexOf(']');
      const lastCloseIndex = Math.max(lastBraceIndex, lastBracketIndex);
      if (lastCloseIndex !== -1 && lastCloseIndex < cleanText.length - 1) {
        cleanText = cleanText.slice(0, lastCloseIndex + 1);
      }

      // First parse attempt
      try {
        analysisResult = JSON.parse(cleanText);
      } catch (innerError) {
        // Repair common JSON issues such as trailing commas before } or ]
        let repairedText = cleanText
          // Remove trailing commas before closing object/array
          .replace(/,\s*([}\]])/g, '$1');

        if (process.env.NODE_ENV !== 'production') {
          console.warn('Initial JSON.parse failed, attempting repair:', innerError);
        }

        analysisResult = JSON.parse(repairedText);
        cleanText = repairedText;
      }
      
      // Validate required structure
      if (!analysisResult.executive_summary || !analysisResult.client_product_visibility) {
        throw new Error('Invalid analysis structure: missing required fields');
      }
      
      // DEBUG: Log the final parsed result to verify sources_ai_used presence
      if (process.env.NODE_ENV !== 'production') {
        console.log('Strategic analysis parsed successfully');
        console.log(`[DEBUG] Final analysis result for ${pipeline || 'unknown'}:`, {
          hasExecutiveSummary: !!analysisResult.executive_summary,
          hasClientProductVisibility: !!analysisResult.client_product_visibility,
          hasCompetitiveLandscape: !!analysisResult.competitive_landscape_analysis,
          competitiveLandscapeCount: Array.isArray(analysisResult.competitive_landscape_analysis) ? analysisResult.competitive_landscape_analysis.length : 0,
          hasSourcesUsed: !!analysisResult.sources_ai_used,
          sourcesUsedCount: Array.isArray(analysisResult.sources_ai_used) ? analysisResult.sources_ai_used.length : 0,
          sourcesUsedPreview: Array.isArray(analysisResult.sources_ai_used) ? analysisResult.sources_ai_used.slice(0, 2) : null,
          fullAnalysisKeys: Object.keys(analysisResult),
          // Log the full object in development for deep inspection
          fullAnalysisResult: analysisResult
        });
      }
    } catch (parseError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Error parsing strategic analysis response:', parseError);
        console.error('Raw response (first 500 chars):', text.substring(0, 500));
        const cleanedPreview = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        console.error('Cleaned text (first 500 chars):', cleanedPreview.substring(0, 500));
      }

      // Fallback: construct a minimal but valid StrategicAnalysisResult
      const aiSearchAny = aiSearchJson as any;
      const fallbackSources: StrategicAnalysisResult["sources_ai_used"] =
        Array.isArray(aiSearchAny?.source_links)
          ? aiSearchAny.source_links.map((src: any) => ({
              source_snippet:
                typeof src === 'string'
                  ? src.slice(0, 200)
                  : 'Snippet not clearly available in provided text.',
              reason_for_inclusion:
                'Source was included in the AI search JSON but the structured analysis could not be fully parsed.',
              source_of_mention:
                (typeof src === 'string' ? src : src.url) || 'Unknown source',
            }))
          : [];

      const fallback: StrategicAnalysisResult = {
        executive_summary: {
          title: 'AEO Competitive Analysis (Fallback)',
          status_overview:
            'The AI analysis service returned an unexpected format. This is an automatically generated fallback summary.',
          strategic_analogy:
            'Think of this as receiving raw research notes without a clean report. The data is there, but the structure had to be approximated.',
        },
        client_product_visibility: {
          status: 'Not Featured',
          details:
            'The detailed structured visibility analysis could not be parsed from the AI response. Please rerun the analysis later or contact support if this persists.',
        },
        ai_answer_deconstruction: {
          dominant_narrative: 'The AI response could not be properly parsed to extract the dominant narrative. This may be due to formatting issues in the AI output.',
          key_decision_factors: [
            'AI response parsing failed - unable to extract decision factors',
            'Consider rerunning the analysis for complete results',
            'Raw response data has been preserved for reference'
          ],
          trusted_source_analysis: 'Due to parsing difficulties, trusted source analysis could not be extracted. Please refer to the source links provided below for raw information.',
          raw_response_preview: text.substring(0, 500),
        },
        competitive_landscape_analysis: [],
        sources_ai_used: fallbackSources,
        strategic_gap_and_opportunity_analysis: {
          analysis_summary:
            'Due to a formatting issue in the AI output, a full gap and opportunity analysis could not be generated. However, the source links have been preserved for manual review.',
        },
        actionable_recommendations: [],
      } as any;

      return NextResponse.json(fallback);
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
