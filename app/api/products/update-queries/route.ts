import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

// POST - Update query data for a user's current product
export async function POST(request: Request) {
  try {
    const { userId, productId, queryData } = await request.json();

    if (!userId || !queryData) {
      return NextResponse.json(
        { error: 'User ID and query data are required' },
        { status: 400 }
      );
    }

    const normalizedQueryData = typeof queryData === 'string' ? queryData : JSON.stringify(queryData);

    const supabaseAdmin = getSupabaseAdminClient();

    let targetProductId: string | null = typeof productId === 'string' && productId.length > 0 ? productId : null;

    if (!targetProductId) {
      // Backward compatibility: fall back to most recent product for this user
      const { data: recentProduct, error: fetchError } = await (supabaseAdmin as any)
        .from('products')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !recentProduct) {
        // If no product exists, we can't update queries
        return NextResponse.json(
          { error: 'No product found for this user' },
          { status: 404 }
        );
      }

      targetProductId = recentProduct.id;
    }

    // Update the product's generated_query field with the new query data
    const { data, error } = await (supabaseAdmin as any)
      .from('products')
      .update({
        generated_query: normalizedQueryData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetProductId)
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
