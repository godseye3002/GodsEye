import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

// GET - Fetch analysis queries for a product
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // Fetch Google analysis queries
    const { data: googleData, error: googleError } = await (supabaseAdmin as any)
      .from('product_analysis_google')
      .select('search_query')
      .eq('product_id', productId)
      .not('search_query', 'is', null);

    // Fetch Perplexity analysis queries
    const { data: perplexityData, error: perplexityError } = await (supabaseAdmin as any)
      .from('product_analysis_perplexity')
      .select('optimization_prompt')
      .eq('product_id', productId)
      .not('optimization_prompt', 'is', null);

    if (googleError) {
      console.error('[AnalysisQueries] Error fetching Google queries:', googleError);
    }

    if (perplexityError) {
      console.error('[AnalysisQueries] Error fetching Perplexity queries:', perplexityError);
    }

    // Extract and clean query strings
    const googleQueries = (googleData || [])
      .map((row: any) => row.search_query?.trim())
      .filter((query: string | undefined) => query && query.length > 0);

    const perplexityQueries = (perplexityData || [])
      .map((row: any) => row.optimization_prompt?.trim())
      .filter((query: string | undefined) => query && query.length > 0);

    return NextResponse.json({
      success: true,
      google: googleQueries,
      perplexity: perplexityQueries,
    });

  } catch (error: any) {
    console.error('[AnalysisQueries] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
