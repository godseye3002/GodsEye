import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

/**
 * POST /api/subscription/check
 * 
 * Calls the Supabase RPC `check_tier_limits` to gate operations
 * like 'create_product' or 'run_analysis'.
 * 
 * Also returns the user's current subscription profile for the
 * frontend to display tier badges, trial countdowns, etc.
 */
export async function POST(request: Request) {
  try {
    const { userId, operation } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!operation || !['create_product', 'run_analysis'].includes(operation)) {
      return NextResponse.json(
        { error: 'Operation must be "create_product" or "run_analysis"' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // 1. Call the RPC gate
    const { data: gateResult, error: gateError } = await (supabaseAdmin as any)
      .rpc('check_tier_limits', {
        p_user_id: userId,
        p_operation: operation,
      });

    if (gateError) {
      console.error('[Subscription Check] RPC error:', gateError);
      return NextResponse.json(
        { error: 'Failed to check tier limits', details: gateError.message },
        { status: 500 }
      );
    }

    // 2. Fetch the user's current subscription profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('credits, subscription_tier, interactions_used, trial_started_at, trial_expires_at, is_active')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[Subscription Check] Profile fetch error:', profileError);
      // Still return the gate result even if profile fails
      return NextResponse.json({
        ...(typeof gateResult === 'object' && gateResult !== null ? gateResult : { allowed: false, reason: 'unknown' }),
        profile: null,
      });
    }

    // 3. Fetch the plan details for displaying limits
    const { data: plan, error: planError } = await (supabaseAdmin as any)
      .from('subscription_plans')
      .select('*')
      .eq('tier', (profile as any).subscription_tier)
      .single();

    const planData = plan as any;

    return NextResponse.json({
      ...(gateResult as any),
      profile: {
        credits: (profile as any).credits,
        tier: (profile as any).subscription_tier,
        interactionsUsed: (profile as any).interactions_used,
        trialStartedAt: (profile as any).trial_started_at,
        trialExpiresAt: (profile as any).trial_expires_at,
        isActive: (profile as any).is_active,
      },
      plan: planError ? null : {
        displayName: planData.display_name,
        productLimit: planData.product_limit,
        interactionLimit: planData.interaction_limit,
        credits: planData.credits,
        features: planData.features,
        priceMonthly: planData.price_monthly,
      },
    });
  } catch (error: any) {
    console.error('[Subscription Check] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
