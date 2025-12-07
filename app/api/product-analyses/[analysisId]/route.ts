import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { analysisId: string } }
) {
  try {
    const { analysisId } = params;

    if (!analysisId) {
      return NextResponse.json(
        { error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // 1) Try Perplexity analysis table first
    const { data: perplexity, error: perplexityError } = await (supabaseAdmin as any)
      .from('product_analysis_perplexity')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (perplexity) {
      const normalized = {
        id: perplexity.id,
        product_id: perplexity.product_id,
        optimization_query: perplexity.optimization_prompt,
        optimization_analysis: perplexity.optimization_analysis,
        google_search_query: null,
        google_overview_analysis: null,
        combined_analysis: null,
        source_links: perplexity.citations ?? [],
        processed_sources: [],
        created_at: perplexity.created_at,
        type: 'perplexity' as const,
      };
      return NextResponse.json({ analysis: normalized });
    }

    // 2) If not found in Perplexity, try Google analysis table
    const { data: google, error: googleError } = await (supabaseAdmin as any)
      .from('product_analysis_google')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (google) {
      const normalized = {
        id: google.id,
        product_id: google.product_id,
        optimization_query: null,
        optimization_analysis: null,
        google_search_query: google.search_query,
        google_overview_analysis: google.google_overview_analysis,
        combined_analysis: null,
        source_links: [],
        processed_sources: [],
        created_at: google.created_at,
        type: 'google_overview' as const,
      };
      return NextResponse.json({ analysis: normalized });
    }

    // If both lookups failed, surface a not found error
    const detail = perplexityError?.message ?? googleError?.message ?? 'Analysis not found';
    console.error('Error fetching analysis by ID:', { perplexityError, googleError });
    return NextResponse.json(
      { error: 'Analysis not found', details: detail },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Get analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
