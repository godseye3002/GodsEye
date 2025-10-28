import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId, productId, creditsRequired = 1 } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const rpcParams = {
      p_user_id: userId,
      p_credits_amount: creditsRequired,
      p_product_id: productId || null,
      p_analysis_type: 'full_optimization',
    };

    // Deduct credits using the database function
    const { data, error } = await (supabaseAdmin as any).rpc('deduct_credits', rpcParams);
    const success = Boolean(data);

    if (error) {
      console.error('Error deducting credits:', error);
      return NextResponse.json(
        { error: 'Failed to deduct credits', details: error.message },
        { status: 500 }
      );
    }

    // data will be truthy if successful, falsy if insufficient credits
    if (!success) {
      return NextResponse.json(
        { error: 'Insufficient credits', success: false },
        { status: 402 }
      );
    }

    // Credits deducted successfully
    return NextResponse.json({
      success: true,
      message: 'Credits deducted successfully',
    });
  } catch (error: any) {
    console.error('Analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
