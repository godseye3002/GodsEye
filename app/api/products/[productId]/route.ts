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

    // Fetch product with its analyses
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        product_analyses (
          id,
          user_id,
          optimization_query,
          optimization_analysis,
          google_search_query,
          google_overview_analysis,
          citations,
          raw_serp_results,
          created_at,
          updated_at
        )
      `)
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

    // Normalize the analyses data
    const normalizedProduct = {
      ...product,
      analyses: product.product_analyses || [],
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
