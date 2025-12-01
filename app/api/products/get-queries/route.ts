import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

// GET - Retrieve query data for a user's most recent product
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

    // Find the most recent product for this user
    const { data: recentProduct, error: fetchError } = await (supabaseAdmin as any)
      .from('products')
      .select('generated_query')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Get Queries] Database fetch error:', fetchError);
      }
      return NextResponse.json(
        { error: 'Failed to fetch queries', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!recentProduct) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Get Queries] No product found for user:', userId);
      }
      return NextResponse.json(
        { error: 'No product found for this user' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      queryData: recentProduct.generated_query 
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Get Queries] API error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
