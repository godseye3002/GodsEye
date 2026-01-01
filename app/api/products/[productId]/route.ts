import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Fetch product with its analyses from both tables
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Error fetching product:', productError);
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Fetch analyses from both Google and Perplexity tables
    const [googleAnalyses, perplexityAnalyses] = await Promise.all([
      supabase
        .from('product_analysis_google')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false }),
      
      supabase
        .from('product_analysis_perplexity')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
    ]);

    // Combine and normalize analyses data
    const allAnalyses = [
      ...(googleAnalyses.data || []).map(analysis => ({
        id: analysis.id,
        user_id: analysis.user_id,
        optimization_query: analysis.search_query,
        optimization_analysis: analysis.google_overview_analysis,
        google_search_query: analysis.search_query,
        google_overview_analysis: analysis.google_overview_analysis,
        citations: null,
        raw_serp_results: analysis.raw_serp_results,
        created_at: analysis.created_at,
        updated_at: analysis.updated_at,
        pipeline: 'google_overview'
      })),
      ...(perplexityAnalyses.data || []).map(analysis => ({
        id: analysis.id,
        user_id: analysis.user_id,
        optimization_query: analysis.optimization_prompt,
        optimization_analysis: analysis.optimization_analysis,
        google_search_query: null,
        google_overview_analysis: null,
        citations: analysis.citations,
        raw_serp_results: analysis.raw_serp_results,
        created_at: analysis.created_at,
        updated_at: analysis.updated_at,
        pipeline: 'perplexity'
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Normalize the analyses data
    const normalizedProduct = {
      ...product,
      analyses: allAnalyses,
      query_text: product.query_text || { all: { perplexity: [], google: [] }, used: { perplexity: [], google: [] } }
    };

    return NextResponse.json(normalizedProduct);

  } catch (error) {
    console.error('Error in product API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
