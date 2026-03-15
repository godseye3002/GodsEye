import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const text = await request.text();
    if (!text) {
      console.error('Update login API error: Request body is empty');
      return NextResponse.json(
        { error: 'Request body is empty' },
        { status: 400 }
      );
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (parseError) {
      console.error('Update login API error: Invalid JSON', { text });
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { userId } = body;

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
    console.error('Update login API unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
