import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId, creditsRequired = 1 } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // Query user's current credits
    const { data: userData, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('credits')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user credits:', userError);
      return NextResponse.json(
        { error: 'Failed to fetch user credits', details: userError.message },
        { status: 500 }
      );
    }

    const creditsRow = (userData as { credits?: number | null } | null) ?? null;
    const currentCredits = typeof creditsRow?.credits === 'number' ? creditsRow.credits : creditsRow?.credits ?? 0;
    const hasEnoughCredits = currentCredits >= creditsRequired;

    return NextResponse.json({
      hasEnoughCredits,
      currentCredits,
      creditsRequired,
    });
  } catch (error: any) {
    console.error('Check credits API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
