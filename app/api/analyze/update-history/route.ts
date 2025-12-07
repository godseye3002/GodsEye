import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId, productId, googleAnalysisId, perplexityAnalysisId } = await request.json();

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'User ID and Product ID are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // Update the most recent analysis_history entry for this user with the product_id
    // and any available analysis IDs from the new split tables
    const updateData: any = { product_id: productId };

    if (googleAnalysisId) {
      updateData.google_analysis_id = googleAnalysisId;
    }

    if (perplexityAnalysisId) {
      updateData.perplexity_analysis_id = perplexityAnalysisId;
    }

    const { error } = await (supabaseAdmin as any)
      .from('analysis_history')
      .update(updateData)
      .eq('user_id', userId)
      .is('product_id', null)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error updating analysis history:', error);
      return NextResponse.json(
        { error: 'Failed to update analysis history', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update history API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
