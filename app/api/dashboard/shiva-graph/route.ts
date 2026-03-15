import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const engine = searchParams.get('engine'); // 'perplexity', 'google', 'chatgpt'

        if (!productId || !engine) {
            return NextResponse.json(
                { error: 'productId and engine are required' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdminClient();

        // 1. Get the product name to identify the client brand
        const { data: productData, error: productError } = await (supabase as any)
            .from('products')
            .select('product_name')
            .eq('id', productId)
            .single();

        if (productError) {
            console.error('[Dashboard/ShivaGraph] Product fetch error:', productError);
            return NextResponse.json({ error: 'Failed to fetch product data' }, { status: 500 });
        }

        const clientName = productData?.product_name || 'Phodu Club'; // Fallback just in case

        // 2. Fetch all sov_query_insights for this product and engine
        // We removed the snapshot filtering because we want to see ALL global competitors 
        // that have ever challenged the client in this engine context.
        const { data: insights, error: insightsError } = await (supabase as any)
            .from('sov_query_insights')
            .select('winning_source, conversion_probability')
            .eq('product_id', productId)
            .eq('engine', engine);

        if (insightsError) {
            console.error('[Dashboard/ShivaGraph] Insights error:', insightsError);
            return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
        }

        if (!insights || insights.length === 0) {
            return NextResponse.json({ data: [] });
        }

        // 6. Aggregate data per winning_source
        // competitor -> { win_count, sum_steal }
        const competitorMap = new Map<string, { win_count: number, sum_steal: number }>();

        insights.forEach((insight: any) => {
            const source = insight.winning_source;
            if (!source || source === 'None') return;

            let rawConv = parseFloat(insight.conversion_probability);
            let convProb = isNaN(rawConv) ? 0 : rawConv * 100;
            if (convProb > 0 && convProb < 1) {
                convProb = convProb * 100;
            } else if (rawConv <= 100) {
                convProb = rawConv;
            }

            const stealPct = 100 - convProb;

            if (!competitorMap.has(source)) {
                competitorMap.set(source, { win_count: 0, sum_steal: 0 });
            }

            const stats = competitorMap.get(source)!;
            stats.win_count += 1;
            stats.sum_steal += stealPct;
        });

        // 7. Calculate Capture Score and prepare final data
        const graphData: any[] = [];
        let clientData = null;

        for (const [source, stats] of competitorMap.entries()) {
            const avg_steal_pct = stats.sum_steal / stats.win_count;
            const capture_score = stats.win_count * avg_steal_pct;

            const isClient = source.toLowerCase() === clientName.toLowerCase();

            const point = {
                competitor: source,
                win_count: stats.win_count,
                avg_steal_pct: Math.round(avg_steal_pct * 100) / 100,
                capture_score: Math.round(capture_score * 100) / 100,
                isClient
            };

            if (isClient) {
                clientData = point;
            } else {
                graphData.push(point);
            }
        }

        // Sort descending by capture score
        graphData.sort((a, b) => b.capture_score - a.capture_score);

        // Put client data first or append to the end. The scatter chart will render it according to the "isClient" flag anyway.
        if (clientData) {
            // Push client to end so it renders on top (z-index behavior in SVG)
            graphData.push(clientData);
        }

        return NextResponse.json({ data: graphData });

    } catch (error: any) {
        console.error('[Dashboard/ShivaGraph] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
