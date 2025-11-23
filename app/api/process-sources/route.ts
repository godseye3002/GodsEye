import { getFaviconsForUrls } from "@/lib/favicon-fetcher";
import type { PipelineId } from "@/lib/pipelines";
import { addTokens } from "@/lib/token-usage";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from 'next/server';

export interface SourceLink {
  text: string;
  url: string;
  raw_url: string;
  highlight_fragment: string | null;
  related_claim: string;
  extraction_order: number;
}

export interface ProcessedSource {
  name: string;
  url: string;
  description: string;
  category?: string;
  Website_Icon_Url?: string | null;
}

export interface ProcessSourcesResponse {
  sources: ProcessedSource[];
  success: boolean;
}

// Social media and generic platforms to filter out
const EXCLUDED_DOMAINS = [
  'twitter.com',
  'x.com',
  'reddit.com',
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'quora.com',
  'youtube.com',
  'tiktok.com',
  'pinterest.com',
  'medium.com',
  'substack.com',
  'amazon.com',
  'flipkart.com',
  'walmart.com',
  'ebay.com',
  'alibaba.com',
];

function isThirdPartySite(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    // Check if it's in the excluded list
    return !EXCLUDED_DOMAINS.some(excluded => domain.includes(excluded));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const sourceLinks: SourceLink[] = payload.sourceLinks || [];
    const analysisId: string | undefined = typeof payload.analysisId === 'string' ? payload.analysisId : undefined;
    const allowed: readonly string[] = ['perplexity','google_overview','chatgpt','gemini'];
    const pipeline: PipelineId | undefined = allowed.includes(String(payload.pipeline)) ? (payload.pipeline as PipelineId) : undefined;

    const API_KEY: string = process.env.GEMINI_API_KEY || '';
    
    if (!API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not defined in the environment variables." },
        { status: 500 }
      );
    }

    // Filter to only third-party sites
    const thirdPartySources = sourceLinks.filter(link => isThirdPartySite(link.url));

    if (thirdPartySources.length === 0) {
      return NextResponse.json({
        sources: [],
        success: true,
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Process Sources] Filtered ${thirdPartySources.length} third-party sites from ${sourceLinks.length} total sources`);
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    });

//     const prompt = `You are an expert at analyzing websites and categorizing them for marketing and SEO purposes.

// You will be given a list of website source links that were cited by an AI search engine. Your task is to:

// 1. Filter and identify only legitimate third-party websites (exclude any remaining social media, e-commerce marketplaces, or generic platforms)
// 2. For each valid third-party website, provide:
//    - A clean, professional name (brand or publication name)
//    - The URL
//    - A brief, professional description (1-2 sentences) explaining what this website is and why it's relevant/trustworthy for AI search engines

// Focus on websites that are:
// - Industry publications
// - Professional blogs
// - Review sites
// - Industry-specific platforms
// - Authority websites in the domain
// - News or media outlets

// Here are the source links to process:

// ${JSON.stringify(thirdPartySources, null, 2)}

// Return your response as a JSON object with this exact structure:
// {
//   "sources": [
//     {
//       "name": "Professional name of the website/publication",
//       "url": "full URL",
//       "description": "Brief description of what this site is and why it matters",
//       "category": "One of: Industry Publication, Review Site, Professional Blog, Authority Website, News Outlet, Specialty Platform"
//     }
//   ]
// }

// Important:
// - Only include genuine third-party websites that would be valuable for product visibility
// - Exclude any social media, forums, or e-commerce marketplaces
// - Keep descriptions professional and concise
// - If a source is not valuable or relevant, exclude it from the output`;

    const prompt = `You are an expert at analyzing website sources for marketing and Answer Engine Optimization (AEO) purposes. Your goal is to identify independent, third-party publishers and review sites, while strictly filtering out all other types of websites.
You will be given a list of website source links that were cited by an AI search engine. Your task is to:
1. Analyze each source link to determine its primary purpose.
2. CRITICAL EXCLUSION RULE: You must exclude any website whose primary purpose is to sell its own specific brand's product or service, even if it's an "authority." These are considered "Competitor Sites" and must be filtered out.
  Example: In a search for "best running shoes," you must exclude nike.com, brooksrunning.com, and adidas.com (Competitor Sites).
  Example: In a search for "best CRM," you must exclude salesforce.com and hubspot.com (Competitor Sites).
3. OTHER EXCLUSIONS: You must also exclude all:

  E-commerce marketplaces (e.g., Amazon, Etsy, Walmart, Alibaba)
  Social media (e.g., Reddit, Twitter, Facebook, Pinterest, Instagram)
  Forums and Q&A sites (e.g., Quora)
  Generic platforms (e.g., YouTube, GitHub, LinkedIn)

4. INCLUSIONS: The only sites you should include are legitimate third-party content websites, such as:
  Industry publications (e.g., TechCrunch, Wired)
  Professional blogs
  Dedicated review sites (e.g., Wirecutter, G2, Rtings.com)
  News or media outlets (e.g., Forbes, Bloomberg, CNET)

5. For each valid and included website, provide:
  A clean, professional name (brand or publication name)
  The URL
  A brief, professional description (1-2 sentences) explaining what this website is (e.g., "A technology news publication") and why it's a trustworthy source (e.g., "Provides in-depth, unbiased reviews").

Here are the source links to process:

${JSON.stringify(thirdPartySources, null, 2)}

Return your response as a JSON object with this exact structure: 
  { 
      "sources": [ 
        { 
          "name": "Professional name of the website/publication", 
          "url": "full URL", 
          "description": "Brief description of what this site is and why it matters", 
          "category": "One of: Industry Publication, Review Site, Professional Blog, Authority Website, News Outlet, Specialty Platform"
        }
      ] 
  }

Note: Do not include Website_Icon_Url in your response - it will be fetched automatically.

Important:
  Your #1 priority is to filter out "Competitor Sites" (i.e., any brand that sells a product or service in the relevant category).
  It is perfectly acceptable and expected that if all sources are competitor sites, social media, or marketplaces, your output will be an empty list: {"sources": []}.
  Do not include a source just to fill the list. Be extremely strict in your filtering.`

    const result = await model.generateContent(prompt);
    const response = await result.response;

    // Log token usage
    try {
      const usage = response.usageMetadata;
      const input = usage?.promptTokenCount ?? usage?.totalTokenCount ?? 0;
      const output = usage?.candidatesTokenCount ?? 0;
      const total = usage?.totalTokenCount ?? input + output;
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Gemini][Process Sources]' + (analysisId ? ` [analysisId=${analysisId}]` : '') + (pipeline ? ` [pipeline=${pipeline}]` : ''),
          { inputTokens: input, outputTokens: output, totalTokens: total, sourcesProcessed: thirdPartySources.length });
      }
      addTokens(analysisId, pipeline, 'Process Sources', input, output, total);
    } catch {}

    const text = response.text();

    // Parse the JSON response
    let processedData: { sources: ProcessedSource[] };
    try {
      let cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      cleanText = cleanText.replace(/^[^{]*/, '');
      cleanText = cleanText.replace(/[^}]*$/, '');
      
      processedData = JSON.parse(cleanText);
      
      if (!processedData.sources || !Array.isArray(processedData.sources)) {
        throw new Error('Invalid response structure');
      }

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Process Sources] Successfully processed ${processedData.sources.length} sources`);
      }
      
      // Fetch favicons for all processed sources
      if (processedData.sources.length > 0) {
        try {
          const urls = processedData.sources.map(s => s.url);
          const faviconMap = await getFaviconsForUrls(urls, 5);
          
          // Add favicon URLs to sources
          processedData.sources = processedData.sources.map(source => ({
            ...source,
            Website_Icon_Url: faviconMap.get(source.url) || null,
          }));
          
          const foundCount = processedData.sources.filter(s => s.Website_Icon_Url).length;
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[Process Sources] Fetched favicons: ${foundCount}/${processedData.sources.length} found`);
          }
        } catch (faviconError) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[Process Sources] Error fetching favicons:', faviconError);
          }
          // Continue without favicons - set all to null
          processedData.sources = processedData.sources.map(source => ({
            ...source,
            Website_Icon_Url: null,
          }));
        }
      }
    } catch (parseError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Process Sources] Error parsing response:', parseError);
        console.error('[Process Sources] Raw response preview:', text.substring(0, 300));
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to process source links',
          sources: [],
          success: false
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sources: processedData.sources,
      success: true,
    });

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Process Sources] Error:', error);
    }
    return NextResponse.json(
      { 
        error: 'Failed to process source links',
        sources: [],
        success: false
      },
      { status: 500 }
    );
  }
}
