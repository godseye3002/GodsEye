import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'User ID and Product ID are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    const { data, error } = await (supabaseAdmin as any)
      .from('query_batches')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[QueryBatches] Error fetching:', error);
      }
      return NextResponse.json(
        { error: 'Failed to fetch batches', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ batches: data || [] });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[QueryBatches] GET error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
