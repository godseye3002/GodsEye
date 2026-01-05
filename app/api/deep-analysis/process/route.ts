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
    const { product_id, source } = body || {};

    if (!product_id || !source) {
      return NextResponse.json(
        { error: 'product_id and source are required' },
        { status: 400 }
      );
    }

    if (source !== 'google' && source !== 'perplexity') {
      return NextResponse.json(
        { error: "source must be 'google' or 'perplexity'" },
        { status: 400 }
      );
    }

    const upstream = await fetch(`${BASE_URL}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id, source }),
    });

    const data = await upstream.json().catch(() => null);

    if (!upstream.ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[DeepAnalysis] Upstream error', {
          url: `${BASE_URL}/process`,
          status: upstream.status,
          statusText: upstream.statusText,
          body: data,
        });
      }
      return NextResponse.json(
        {
          error: 'Failed to start deep analysis',
          details: data,
          status: upstream.status,
        },
        { status: 502 }
      );
    }

    if (process.env.NODE_ENV !== 'production') {
        console.log('[DeepAnalysis] Upstream success', { url: `${BASE_URL}/process`, data });
      }
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message },
      { status: 500 }
    );
  }
}
