import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // Update last_login timestamp
    const { error } = await (supabaseAdmin as any)
      .from('user_profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('Error updating last login:', error);
      return NextResponse.json(
        { error: 'Failed to update last login', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update login API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
