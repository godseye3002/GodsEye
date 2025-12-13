import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    const { analysisId } = await params;

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
      .select(`
        *,
        product:products(
          product_name,
          description,
          specifications,
          features,
          targeted_market,
          problem_product_is_solving,
          general_product_type,
          specific_product_type
        )
      `)
      .eq('id', analysisId)
      .single();

    if (perplexity) {
      const productData = perplexity.product || {};
      const formattedProductData = {
        product_name: productData.product_name || '',
        url: '', // Removed since column doesn't exist
        description: productData.description || '',
        specifications: productData.specifications || {},
        features: productData.features || [],
        targeted_market: productData.targeted_market || '',
        problem_product_is_solving: productData.problem_product_is_solving || '',
        general_product_type: productData.general_product_type || '',
        specific_product_type: productData.specific_product_type || '',
      };

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
        updated_at: perplexity.updated_at,
        type: 'perplexity' as const,
      };
      return NextResponse.json({ analysis: normalized, productData: formattedProductData });
    }

    // 2) If not found in Perplexity, try Google analysis table
    const { data: google, error: googleError } = await (supabaseAdmin as any)
      .from('product_analysis_google')
      .select(`
        *,
        product:products(
          product_name,
          description,
          specifications,
          features,
          targeted_market,
          problem_product_is_solving,
          general_product_type,
          specific_product_type
        )
      `)
      .eq('id', analysisId)
      .single();

    if (google) {
      const productData = google.product || {};
      const formattedProductData = {
        product_name: productData.product_name || '',
        url: '', // Removed since column doesn't exist
        description: productData.description || '',
        specifications: productData.specifications || {},
        features: productData.features || [],
        targeted_market: productData.targeted_market || '',
        problem_product_is_solving: productData.problem_product_is_solving || '',
        general_product_type: productData.general_product_type || '',
        specific_product_type: productData.specific_product_type || '',
      };

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
        updated_at: google.updated_at,
        type: 'google_overview' as const,
      };
      return NextResponse.json({ analysis: normalized, productData: formattedProductData });
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
