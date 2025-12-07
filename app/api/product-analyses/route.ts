import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      product_id,
      optimization_query,
      google_search_query,
      optimization_analysis,
      google_overview_analysis,
      combined_analysis,
      source_links,
      processed_sources,
    } = body || {};

    if (!product_id) {
      return NextResponse.json(
        { error: 'product_id is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    let googleAnalysis: any = null;
    let perplexityAnalysis: any = null;

    // 1) Insert Google analysis when provided
    if (google_search_query && google_overview_analysis) {
      const { data, error } = await (supabaseAdmin as any)
        .from('product_analysis_google')
        .insert({
          product_id,
          search_query: google_search_query,
          google_overview_analysis,
        })
        .select()
        .single();

      if (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[ProductAnalysisGoogle] Error creating:', error);
        }
        return NextResponse.json(
          { error: 'Failed to create Google analysis', details: error.message },
          { status: 500 }
        );
      }

      googleAnalysis = data;
    }

    // 2) Insert Perplexity analysis when provided
    if (optimization_query && optimization_analysis) {
      const { data, error } = await (supabaseAdmin as any)
        .from('product_analysis_perplexity')
        .insert({
          product_id,
          optimization_prompt: optimization_query,
          optimization_analysis,
          citations: source_links ?? [],
          related_google_analysis_id: googleAnalysis?.id ?? null,
        })
        .select()
        .single();

      if (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[ProductAnalysisPerplexity] Error creating:', error);
        }
        return NextResponse.json(
          { error: 'Failed to create Perplexity analysis', details: error.message },
          { status: 500 }
        );
      }

      perplexityAnalysis = data;
    }

    // 3) Optionally echo combined shape for callers expecting old contract
    const combined = {
      product_id,
      optimization_query: optimization_query ?? null,
      google_search_query: google_search_query ?? null,
      optimization_analysis: optimization_analysis ?? null,
      google_overview_analysis: google_overview_analysis ?? null,
      combined_analysis: combined_analysis ?? null,
      source_links: source_links ?? [],
      processed_sources: processed_sources ?? [],
      google_analysis_id: googleAnalysis?.id ?? null,
      perplexity_analysis_id: perplexityAnalysis?.id ?? null,
    };

    return NextResponse.json({
      analysis: combined,
      googleAnalysis,
      perplexityAnalysis,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ProductAnalyses] POST error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
