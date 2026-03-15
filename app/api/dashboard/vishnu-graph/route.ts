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

        // 2. Determine engine table and column
        let tableName: string;
        let queryColumn: string;

        switch (engine) {
            case 'perplexity':
                tableName = 'product_analysis_perplexity';
                queryColumn = 'optimization_prompt';
                break;
            case 'google':
            case 'google_overview':
                tableName = 'product_analysis_google';
                queryColumn = 'search_query';
                break;
            case 'chatgpt':
                tableName = 'product_analysis_chatgpt';
                queryColumn = 'optimization_prompt';
                break;
            default:
                tableName = 'product_analysis_google';
                queryColumn = 'search_query';
        }

        // 1. Find the latest 2 snapshot_ids that actually have analysis records for THIS engine.
        // analysis_snapshots has no engine column, so relying on "latest snapshots" can accidentally
        // select a snapshot created by a different engine (or an incomplete run), causing empty Fortress.
        // Additionally, ensure the "latest" snapshot actually has at least one winning position
        // (mention_count > 0). Otherwise we can end up selecting a newer snapshot where the brand
        // isn't mentioned at all, producing an empty Fortress even when older winning positions exist.
        const { data: winningInsights, error: winningInsightsError } = await (supabase as any)
            .from('sov_query_insights')
            .select('analysis_id')
            .eq('product_id', productId)
            .eq('engine', engine)
            .gt('mention_count', 0)
            .order('created_at', { ascending: false })
            .limit(500);

        if (winningInsightsError) {
            console.error('[Dashboard/VishnuGraph] Winning insights error:', winningInsightsError);
            return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
        }

        const winningAnalysisIds: string[] = Array.from(
            new Set((winningInsights || []).map((r: any) => r.analysis_id).filter(Boolean))
        );

        if (winningAnalysisIds.length === 0) {
            return NextResponse.json({ data: [] });
        }

        const { data: winningAnalysisRows, error: winningAnalysisRowsError } = await (supabase as any)
            .from(tableName)
            .select('snapshot_id')
            .eq('product_id', productId)
            .in('id', winningAnalysisIds)
            .not('snapshot_id', 'is', null);

        if (winningAnalysisRowsError) {
            console.error('[Dashboard/VishnuGraph] Winning analysis rows error:', winningAnalysisRowsError);
            return NextResponse.json({ error: 'Failed to fetch analysis records' }, { status: 500 });
        }

        const candidateSnapshotIds: string[] = Array.from(
            new Set((winningAnalysisRows || []).map((r: any) => r.snapshot_id).filter(Boolean))
        );

        if (candidateSnapshotIds.length === 0) {
            return NextResponse.json({ data: [] });
        }

        const { data: snapshots, error: snapshotsError } = await (supabase as any)
            .from('analysis_snapshots')
            .select('id, started_at')
            .eq('product_id', productId)
            .in('id', candidateSnapshotIds)
            .order('started_at', { ascending: false })
            .limit(2);

        if (snapshotsError) {
            console.error('[Dashboard/VishnuGraph] Snapshots error:', snapshotsError);
            return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
        }

        if (!snapshots || snapshots.length === 0) {
            return NextResponse.json({ data: [] });
        }

        const latestSnapshotId = snapshots[0].id;
        const previousSnapshotId = snapshots.length > 1 ? snapshots[1].id : null;

        // 3. Fetch analysis records for these snapshots to get analysis_ids and query texts
        const snapshotIdsToFetch = previousSnapshotId ? [latestSnapshotId, previousSnapshotId] : [latestSnapshotId];

        const { data: analysisRecords, error: analysisError } = await (supabase as any)
            .from(tableName)
            .select(`id, snapshot_id, ${queryColumn}`)
            .eq('product_id', productId)
            .in('snapshot_id', snapshotIdsToFetch);

        if (analysisError) {
            console.error('[Dashboard/VishnuGraph] Analysis fetch error:', analysisError);
            return NextResponse.json({ error: 'Failed to fetch analysis records' }, { status: 500 });
        }

        if (!analysisRecords || analysisRecords.length === 0) {
            return NextResponse.json({ data: [] });
        }

        const analysisIds = analysisRecords.map((r: any) => r.id);

        // 4. Fetch sov_query_insights for these analysis_ids
        const { data: insights, error: insightsError } = await (supabase as any)
            .from('sov_query_insights')
            .select('*')
            .eq('engine', engine)
            .in('analysis_id', analysisIds);

        if (insightsError) {
            console.error('[Dashboard/VishnuGraph] Insights error:', insightsError);
            return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
        }

        if (!insights || insights.length === 0) {
            return NextResponse.json({ data: [] });
        }

        // 5. Structure data for the graph
        // Target format: Array of objects where each object represents a query where mention_count > 0 in the LATEST snapshot.
        // We also need to map the query text, and compare dominance_rate with the PREVIOUS snapshot.

        // Map analysis_id -> query text & snapshot_id
        const analysisInfoMap = new Map<string, { queryText: string, snapshotId: string }>();
        analysisRecords.forEach((r: any) => {
            analysisInfoMap.set(r.id, { queryText: r[queryColumn], snapshotId: r.snapshot_id });
        });

        // Group insights by queryText, then by snapshot
        // We want to link the same query across snapshots (based on queryText)
        const queryDataMap = new Map<string, {
            queryText: string,
            latest: any,
            previous: any
        }>();

        insights.forEach((insight: any) => {
            const info = analysisInfoMap.get(insight.analysis_id);
            if (!info) return;

            const { queryText, snapshotId } = info;

            // Generate a short label for the query
            const shortLabel = queryText.length > 30 ? queryText.substring(0, 30) + '...' : queryText;

            if (!queryDataMap.has(queryText)) {
                queryDataMap.set(queryText, {
                    queryText: shortLabel,
                    latest: null,
                    previous: null
                });
            }

            const dataObj = queryDataMap.get(queryText)!;

            if (snapshotId === latestSnapshotId) {
                dataObj.latest = insight;
            } else if (snapshotId === previousSnapshotId) {
                dataObj.previous = insight;
            }
        });

        // "This graph shows every query where the client is already winning — so the client never loses those positions."
        // "only queries where mention_count > 0" in the latest snapshot
        const graphData: any[] = [];

        for (const [_, dataObj] of queryDataMap.entries()) {
            if (dataObj.latest && dataObj.latest.mention_count > 0) {
                const latestDomRaw = dataObj.latest.dominance_rate;
                const latestDomParsed = typeof latestDomRaw === 'number' ? latestDomRaw : parseFloat(latestDomRaw);
                const latestDom = Number.isFinite(latestDomParsed) ? latestDomParsed : 0;
                let prevDom = null;
                if (dataObj.previous) {
                    const prevDomRaw = dataObj.previous.dominance_rate;
                    const prevDomParsed = typeof prevDomRaw === 'number' ? prevDomRaw : parseFloat(prevDomRaw);
                    if (Number.isFinite(prevDomParsed)) {
                        prevDom = prevDomParsed;
                    }
                }

                // delta indicates change in dominance_rate
                let dominance_delta = 0;
                if (prevDom !== null) {
                    dominance_delta = latestDom - prevDom;
                }

                // sanitize conversion probability
                let rawConv = parseFloat(dataObj.latest.conversion_probability);
                let convProb = isNaN(rawConv) ? 0 : rawConv * 100; // Assuming it's 0-1 range. If it's already 0-100, no need to multiply.
                // Let's check typical conversion values. Some API endpoints multiply by 100 or assume it's already a percentage. 
                // Wait, in top-prompts it's mostly parsed directly.
                // In brand-coverage-graph it was parsed, but wait, let's keep it as is from db and check if > 1 it's already %, if < 1 multiply.
                if (convProb > 0 && convProb < 1) {
                    convProb = convProb * 100;
                } else if (rawConv <= 100) {
                    convProb = rawConv;
                }

                graphData.push({
                    queryText: dataObj.queryText, // X-Axis
                    dominance_rate: Math.round(latestDom * 100) / 100, // Y-Axis Left (Bar)
                    dominance_delta: Math.round(dominance_delta * 100) / 100, // For red delta arrow
                    conversion_probability: Math.round(convProb * 100) / 100, // Y-Axis Right (Line)
                    citation_status: dataObj.latest.citation_status || 'Mentioned', // Bar Color
                    sov_score: dataObj.latest.sov_score, // Tooltip
                    mention_count: dataObj.latest.mention_count, // Tooltip
                    text_snippet: dataObj.latest.text_snippet || 'No snippet available', // Tooltip
                });
            }
        }

        // Sort by dominance_rate descending
        graphData.sort((a, b) => b.dominance_rate - a.dominance_rate);

        return NextResponse.json({ data: graphData });

    } catch (error: any) {
        console.error('[Dashboard/VishnuGraph] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
