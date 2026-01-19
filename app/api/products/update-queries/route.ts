import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

// POST - Update query data for a specific product
export async function POST(request: Request) {
  try {
    // 1. Destructure productId from the request body
    const { userId, productId, queryData } = await request.json();

    if (!userId || !productId || !queryData) {
      return NextResponse.json(
        { error: 'User ID, Product ID and query data are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // Update the specific product using productId (no "latest" fallback)
    const { data, error } = await (supabaseAdmin as any)
      .from('products')
      .update({
        generated_query: queryData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Update Queries] Error updating:', error);
      }
      return NextResponse.json(
        { error: 'Failed to update queries', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      product: data,
      message: 'Queries updated successfully'
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Update Queries] POST error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
