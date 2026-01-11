import { NextResponse } from 'next/server';
// godseye-sov-production.up.railway.app
// godseye-sov.onrender.com
const DEFAULT_SOV_ANALYSIS_URL = 'https://godseye-sov-production.up.railway.app/analyze';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const product_id = body?.product_id;
    const engine = body?.engine;
    const debug = Boolean(body?.debug);

    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 });
    }

    if (!engine || !['google', 'perplexity'].includes(engine)) {
      return NextResponse.json({ error: 'Valid engine (google or perplexity) is required' }, { status: 400 });
    }

    const upstreamUrl = process.env.SOV_ANALYSIS_URL || DEFAULT_SOV_ANALYSIS_URL;

    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ product_id, engine, debug }),
    });

    const text = await upstreamResponse.text();
    let json: any = null;

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      return NextResponse.json(
        {
          error: 'Upstream returned non-JSON response',
          status: upstreamResponse.status,
          body: text,
        },
        { status: 502 }
      );
    }

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          error: json?.error || 'SOV analysis failed',
          status: upstreamResponse.status,
          details: json,
        },
        { status: upstreamResponse.status }
      );
    }

    return NextResponse.json(json);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
