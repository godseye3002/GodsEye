import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

// GET - Fetch all products for a user
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    const { data, error } = await (supabaseAdmin as any)
      .from('products')
      // Also fetch related analyses from the new split tables
      .select('*, product_analysis_google(*), product_analysis_perplexity(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Products] Error fetching:', error);
      }
      return NextResponse.json(
        { error: 'Failed to fetch products', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ products: data || [] });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Products] GET error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create a new product
export async function POST(request: Request) {
  try {
    const productData = await request.json();

    if (!productData.user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    const { data, error } = await (supabaseAdmin as any)
      .from('products')
      .insert({
        user_id: productData.user_id,
        product_name: productData.product_name,
        product_url: productData.product_url,
        description: productData.description,
        specifications: productData.specifications,
        features: productData.features,
        targeted_market: productData.targeted_market,
        problem_product_is_solving: productData.problem_product_is_solving,
        general_product_type: productData.general_product_type,
        specific_product_type: productData.specific_product_type,
        generated_query: productData.generated_query,
        optimization_analysis: productData.optimization_analysis,
        google_overview_analysis: productData.google_overview_analysis,
        combined_analysis: productData.combined_analysis,
        source_links: productData.source_links || [],
        processed_sources: productData.processed_sources || [],
      })
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Products] Error creating:', error);
      }
      return NextResponse.json(
        { error: 'Failed to create product', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ product: data });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Products] POST error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update an existing product
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { product_id, user_id, ...updates } = body || {};

    if (!product_id || !user_id) {
      return NextResponse.json(
        { error: 'Product ID and User ID are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // Verify ownership
    const { data: product, error: fetchError } = await (supabaseAdmin as any)
      .from('products')
      .select('user_id')
      .eq('id', product_id)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.user_id !== user_id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { data: updated, error: updateError } = await (supabaseAdmin as any)
      .from('products')
      .update({
        product_name: updates.product_name,
        product_url: updates.product_url,
        description: updates.description,
        specifications: updates.specifications,
        features: updates.features,
        targeted_market: updates.targeted_market,
        problem_product_is_solving: updates.problem_product_is_solving,
        general_product_type: updates.general_product_type,
        specific_product_type: updates.specific_product_type,
        generated_query: updates.generated_query,
        optimization_analysis: updates.optimization_analysis,
        google_overview_analysis: updates.google_overview_analysis,
        combined_analysis: updates.combined_analysis,
        source_links: updates.source_links ?? [],
        processed_sources: updates.processed_sources ?? [],
      })
      .eq('id', product_id)
      .select()
      .single();

    if (updateError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Products] Error updating:', updateError);
      }
      return NextResponse.json(
        { error: 'Failed to update product', details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ product: updated });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Products] PUT error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a product
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const userId = searchParams.get('userId');

    if (!productId || !userId) {
      return NextResponse.json(
        { error: 'Product ID and User ID are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // Verify ownership before deleting
    const { data: product, error: fetchError } = await (supabaseAdmin as any)
      .from('products')
      .select('user_id')
      .eq('id', productId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (product.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { error: deleteError } = await (supabaseAdmin as any)
      .from('products')
      .delete()
      .eq('id', productId);

    if (deleteError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Products] Error deleting:', deleteError);
      }
      return NextResponse.json(
        { error: 'Failed to delete product', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Products] DELETE error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
