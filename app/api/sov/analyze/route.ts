import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
// godseye-sov-production.up.railway.app
// godseye-sov.onrender.com
// const DEFAULT_SOV_ANALYSIS_URL = 'https://godseye-sov-production.up.railway.app/analyze';
// const DEFAULT_SOV_ANALYSIS_URL = 'http://127.0.0.1:5000/calculate-sov'

const DEFAULT_SOV_ANALYSIS_URL = 'https://godseye-sov-2-production.up.railway.app/calculate-sov'

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

    // Fetch the most recent snapshot_id for this product from analysis_snapshot table
    let snapshot_id: string | null = null;
    try {
      const supabaseAdmin = getSupabaseAdminClient();
      const { data: snapshotData, error: snapshotError } = await supabaseAdmin
        .from('analysis_snapshots')
        .select('id')
        .eq('product_id', product_id)
        .order('started_at', { ascending: false })
        .limit(1)
        .single() as { data: { id: string } | null; error: any };

      if (!snapshotError && snapshotData) {
        snapshot_id = snapshotData.id;
        if (process.env.NODE_ENV !== 'production') {
          console.log('[SOVAnalyze] Found snapshot_id:', snapshot_id);
        }
      } else if (snapshotError && snapshotError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is acceptable
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[SOVAnalyze] Error fetching snapshot_id:', snapshotError);
        }
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[SOVAnalyze] Failed to fetch snapshot_id:', error);
      }
    }

    const upstreamUrl = process.env.SOV_ANALYSIS_URL || DEFAULT_SOV_ANALYSIS_URL;

    // Include snapshot_id in the request body
    const requestBody = { 
      product_id, 
      engine, 
      debug,
      ...(snapshot_id && { snapshot_id }) // Only include snapshot_id if it exists
    };

    const upstreamResponse = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const text = await upstreamResponse.text();
    let json: unknown = null;

    // Log the full response for debugging
    if (process.env.NODE_ENV !== 'production') {
      console.log('[SOVAnalyze] Upstream Response:', {
        url: upstreamUrl,
        method: 'POST',
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: Object.fromEntries(upstreamResponse.headers.entries()),
        requestBody,
        responseText: text.slice(0, 500), // First 500 chars
        timestamp: new Date().toISOString()
      });
    }

    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[SOVAnalyze] Failed to parse response JSON:', {
          text: text.slice(0, 200),
          status: upstreamResponse.status,
          timestamp: new Date().toISOString()
        });
      }
      return NextResponse.json(
        { error: 'Server returned an invalid response. Please try again.' },
        { status: 500 }
      );
    }

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          error: (json && typeof json === 'object' && 'error' in json) ? (json as any).error : 'SOV analysis failed',
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
