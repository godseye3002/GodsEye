import { NextRequest, NextResponse } from 'next/server';
import { scrapeAndExtractProductInfo, processTextWithGemini, ProductInfo } from '@/lib/scraping-service';
import { addTokens } from '@/lib/token-usage';
import type { PipelineId } from '@/lib/pipelines';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const url = payload.url;
    const text = payload.text;
    const searchQuery = payload.searchQuery;
    const analysisId: string | undefined = typeof payload.analysisId === 'string' ? payload.analysisId : undefined;
    const allowed: readonly string[] = ['perplexity','google_overview','chatgpt','gemini'];
    const pipeline: PipelineId | undefined = allowed.includes(String(payload.pipeline)) ? (payload.pipeline as PipelineId) : undefined;

    // Validate input: either URL or text must be provided
    if (!url && !text) {
      return NextResponse.json(
        { error: 'Either URL or text is required' },
        { status: 400 }
      );
    }

    // Validate URL if provided
    if (url) {
      // Basic URL validation
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    // Validate text if provided
    if (text) {
      if (text.trim().length < 50) {
        return NextResponse.json(
          { error: 'Text must be at least 50 characters long' },
          { status: 400 }
        );
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      if (url) {
        console.log(`[Scrape] Starting process for URL: ${url}`);
      } else {
        console.log(`[Scrape] Starting process for text input (${text.length} chars)`);
      }
      if (searchQuery) {
        console.log(`[Scrape] Using search query context: ${searchQuery}`);
      }
    }
    
    const result = url 
      ? await scrapeAndExtractProductInfo(url, searchQuery)
      : await processTextWithGemini(text, searchQuery);

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to scrape and extract product information. Please check if GEMINI_API_KEY is set in your environment variables.' },
        { status: 500 }
      );
    }

    // Log token usage per analysis for observability
    try {
      const usage = result.tokenUsage;
      if (usage) {
        const input = usage.inputTokens ?? 0;
        const output = usage.outputTokens ?? 0;
        const total = usage.totalTokens ?? input + output;
        console.log('[Gemini][Extract Product Info]' + (analysisId ? ` [analysisId=${analysisId}]` : '') + (pipeline ? ` [pipeline=${pipeline}]` : ''),
          { inputTokens: input, outputTokens: output, totalTokens: total, context: searchQuery ? 'with-search-query' : 'no-search-query' });
        addTokens(analysisId, pipeline, 'Extract Product Info', input, output, total);
      }
    } catch {}

    // Return the extracted product data
    return NextResponse.json({
      success: true,
      data: result.jsonData,
      tokenUsage: result.tokenUsage,
      missingFields: result.missingFields,
      extractionMethod: result.extractionMethod
    });

  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Error in scrape API route:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Scraping API endpoint. Send a POST request with a URL to scrape product information.',
    usage: {
      method: 'POST',
      body: {
        url: 'https://example.com/product-page'
      }
    }
  });
}
