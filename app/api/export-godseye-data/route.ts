import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_KEY environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to enrich query insights exactly like the MCP
async function enrichQueryInsight(insight: any) {
    let enrichedData = { ...insight };

    try {
        if (insight.engine === 'google') {
            const { data } = await supabase
                .from("product_analysis_google")
                .select("search_query, google_overview_analysis, raw_serp_results")
                .eq("id", insight.analysis_id)
                .maybeSingle();

            if (data) {
                enrichedData.query_text = data.search_query;
                enrichedData.ai_narrative = data.google_overview_analysis;
                enrichedData.raw_serp = data.raw_serp_results;
            }
        } else if (insight.engine === 'perplexity') {
            const { data } = await supabase
                .from("product_analysis_perplexity")
                .select("optimization_prompt, citations, optimization_analysis, raw_serp_results")
                .eq("id", insight.analysis_id)
                .maybeSingle();

            if (data) {
                enrichedData.query_text = data.optimization_prompt;
                enrichedData.ai_narrative = data.optimization_analysis;
                enrichedData.raw_serp = data.raw_serp_results;
                enrichedData.citations = data.citations; // Always include citations for completeness
            }
        }

        if (!enrichedData.query_text) enrichedData.query_text = "[Query text unavailable]";
    } catch (err: any) {
        console.error(`Enrichment error for ${insight.id}:`, err.message);
    }

    return enrichedData;
}

export async function GET(request: Request) {
    try {
        // Extract productId from URL query parameters (e.g., /api/export-godseye-data?productId=123-abc)
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");

        if (!productId) {
            return NextResponse.json({ error: "Missing productId parameter" }, { status: 400 });
        }

        // 1. Fetch Product Metadata
        const { data: productData, error: productError } = await supabase
            .from("products")
            .select("*")
            .eq("id", productId)
            .maybeSingle();

        if (productError || !productData) {
            return NextResponse.json({ error: `Product ${productId} not found.` }, { status: 404 });
        }

        // 2. Fetch Strategist Data (Overall Performance)
        const { data: strategistData } = await supabase
            .from("sov_product_snapshots")
            .select("*")
            .eq("product_id", productId)
            .order("created_at", { ascending: false })
            .limit(1);

        // 4. Fetch Architect Data (DNA Blueprints)
        const [googleDna, perpDna, scrapedDna] = await Promise.all([
            supabase.from("product_analysis_dna_google").select("*").eq("product_id", productId).order("created_at", { ascending: false }).limit(1),
            supabase.from("product_analysis_dna_perplexity").select("*").eq("product_id", productId).order("created_at", { ascending: false }).limit(1),
            supabase.from("scraped_generative_dna").select("*").eq("product_id", productId).order("created_at", { ascending: false }).limit(1)
        ]);

        // 5. Fetch Query Bank (All queries used across engines)
        const [perpQueries, googleQueries, chatgptQueries] = await Promise.all([
            supabase.from("product_analysis_perplexity").select("optimization_prompt").eq("product_id", productId),
            supabase.from("product_analysis_google").select("search_query").eq("product_id", productId),
            supabase.from("product_analysis_chatgpt").select("optimization_prompt").eq("product_id", productId)
        ]);

        const queryBank = {
            perplexity: Array.from(new Set(perpQueries.data?.map(q => q.optimization_prompt) || [])),
            google: Array.from(new Set(googleQueries.data?.map(q => q.search_query) || [])),
            chatgpt: Array.from(new Set(chatgptQueries.data?.map(q => q.optimization_prompt) || []))
        };

        // 6. Fetch Detective Data (Query Insights + Enrichment)
        // Fetching up to 100 most recent queries to get a comprehensive view
        const { data: rawInsights } = await supabase
            .from("sov_query_insights")
            .select("*")
            .eq("product_id", productId)
            .order("created_at", { ascending: false })
            .limit(100);

        let enrichedInsights = [];
        if (rawInsights && rawInsights.length > 0) {
            enrichedInsights = await Promise.all(rawInsights.map(insight => enrichQueryInsight(insight)));
        }

        // 7. Construct the Contextual Markdown File for LLMs
        const dateStr = new Date().toISOString().split('T')[0];
        const markdownContent = `
# GodsEye Complete AEO Data Export
**Product:** ${productData.product_name}
**Product ID:** ${productId}
**Export Date:** ${dateStr}

> **System Instruction for AI:** This document contains raw, comprehensive Answer Engine Optimization (AEO) data fetched from the GodsEye database. It is divided into logical zones. Use this data as your absolute source of truth when providing recommendations, gap analysis, or content generation for this product.

---

## 1. STRATEGIST ZONE (Global Performance Snapshots)
**Significance:** This section contains the high-level executive summary, overall Share of Voice (SOV) scores, and broad strategic patterns. It represents how the product is performing holistically across AI search engines.

\`\`\`json
${JSON.stringify(strategistData?.[0] || {}, null, 2)}
\`\`\`

---

## 2. ARCHITECT ZONE (AEO DNA Blueprints)
**Significance:** This section contains the structural optimization plans ("DNA Blueprints"). These are essentially the rulebooks and technical/content recommendations generated for the product. Use this section to understand *how* the product should be structured to win in AEO.

### 2A. Google AI search
\`\`\`json
${JSON.stringify(googleDna.data?.[0] || {}, null, 2)}
\`\`\`

### 2B. Perplexity 
\`\`\`json
${JSON.stringify(perpDna.data?.[0] || {}, null, 2)}
\`\`\`

### 2C. Scraped Generative
\`\`\`json
${JSON.stringify(scrapedDna.data?.[0] || {}, null, 2)}
\`\`\`

---

## 3. DETECTIVE ZONE (Query-Level Insights & Enrichments)
**Significance:** This section contains granular, query-by-query performance data. It shows exactly which keywords were tested, whether the product "Won" or "Lost" the Share of Voice, the winning competitors, raw SERP data, and citations. Use this to find specific gaps in coverage or to analyze competitor dominance on specific phrases.

\`\`\`json
${JSON.stringify(enrichedInsights, null, 2)}
\`\`\`

---

## 4. QUERY BANK (Search Queries Used)
**Significance:** This section contains the full list of search queries and optimization prompts used to analyze your brand across different engines. These represent the specific search intent you are optimizing for.

### Perplexity Queries
${queryBank.perplexity.map(q => `- ${q}`).join('\n') || "_No Perplexity queries found_"}

### Google Search Queries
${queryBank.google.map(q => `- ${q}`).join('\n') || "_No Google queries found_"}

### ChatGPT Queries
${queryBank.chatgpt.map(q => `- ${q}`).join('\n') || "_No ChatGPT queries found_"}

---
*End of GodsEye AEO Export*
`.trim();

        // 8. Return as a downloadable Markdown file
        return new NextResponse(markdownContent, {
            status: 200,
            headers: {
                "Content-Type": "text/markdown",
                "Content-Disposition": `attachment; filename="godseye_aeo_export_${productData.product_name.replace(/\s+/g, '_')}_${dateStr}.md"`,
            },
        });

    } catch (error: any) {
        console.error("Error generating MD export:", error);
        return NextResponse.json(
            { error: "Failed to generate export", details: error.message },
            { status: 500 }
        );
    }
}