import { NextResponse } from 'next/server';

const BASE_URL = process.env.DEEP_ANALYSIS_BASE_URL;

export async function POST(request: Request) {
  try {
    if (!BASE_URL) {
      return NextResponse.json(
        { error: 'Missing DEEP_ANALYSIS_BASE_URL environment variable' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { product_id } = body || {};

    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    const upstream = await fetch(`${BASE_URL}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id }),
    });

    const data = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: 'Failed to fetch deep analysis status',
          details: data,
          status: upstream.status,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}
