import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const snapshotId = searchParams.get('snapshotId');
        const engine = searchParams.get('engine');
        const productId = searchParams.get('productId');

        if (!snapshotId || !engine) {
            return NextResponse.json(
                { error: 'snapshotId and engine are required' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdminClient();

        let effectiveSnapshotId: string = snapshotId;

        const fetchClientCitationRows = async (sid: string) => {
            return await (supabase as any)
                .from('citation_analytics')
                .select('url, mention_count, text_snippet')
                .eq('snapshot_id', sid)
                .eq('engine', engine)
                .eq('is_client_url', true);
        }

        let { data: clientCitations, error } = await fetchClientCitationRows(effectiveSnapshotId);

        if (error) {
            console.error('[Dashboard/ClientCitations] Error:', error);
            return NextResponse.json({ error: 'Failed to fetch client citations' }, { status: 500 });
        }

        if (!clientCitations || clientCitations.length === 0) {
            // Fallback: if snapshot_id has no client citation rows, try latest snapshot_id in citation_analytics
            // for this product+engine where is_client_url=true.
            if (productId) {
                const { data: latestClientCitationRow, error: latestErr } = await (supabase as any)
                    .from('citation_analytics')
                    .select('snapshot_id')
                    .eq('product_id', productId)
                    .eq('engine', engine)
                    .eq('is_client_url', true)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (!latestErr && latestClientCitationRow?.snapshot_id && latestClientCitationRow.snapshot_id !== effectiveSnapshotId) {
                    effectiveSnapshotId = latestClientCitationRow.snapshot_id;
                    const retry = await fetchClientCitationRows(effectiveSnapshotId);
                    clientCitations = retry.data;
                    error = retry.error;
                }
            }

            if (!clientCitations || clientCitations.length === 0) {
                return NextResponse.json({ data: [] });
            }
        }

        // Group by URL
        const urlMap: Record<string, { mentions: number; snippets: string[] }> = {};
        for (const record of clientCitations) {
            const url = record.url || 'Unknown';
            if (!urlMap[url]) {
                urlMap[url] = { mentions: 0, snippets: [] };
            }
            urlMap[url].mentions += record.mention_count || 0;
            if (record.text_snippet) {
                urlMap[url].snippets.push(record.text_snippet);
            }
        }

        // Build ranking with best snippet (longest)
        const clientCitationBase = Object.entries(urlMap).map(([url, data]) => ({
            url,
            total_mentions: data.mentions,
            text_snippet: data.snippets.sort((a, b) => b.length - a.length)[0] || null,
        }));

        // Sort descending
        clientCitationBase.sort((a, b) => b.total_mentions - a.total_mentions);

        // Assign ranks
        clientCitationBase.forEach((item, index) => {
            (item as any).rank = index + 1;
        });

        // --- TREND CALCULATION ---
        let finalCitations: any[] = clientCitationBase;

        try {
            const { data: currentSnapMeta } = await (supabase as any)
                .from('analysis_snapshots')
                .select('product_id, started_at')
                .eq('id', effectiveSnapshotId)
                .single();

            if (currentSnapMeta) {
                const { data: prevSnap } = await (supabase as any)
                    .from('analysis_snapshots')
                    .select('id')
                    .eq('product_id', currentSnapMeta.product_id)
                    .lt('started_at', currentSnapMeta.started_at)
                    .order('started_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (prevSnap) {
                    const { data: prevCitations } = await fetchClientCitationRows(prevSnap.id);
                    if (prevCitations && prevCitations.length > 0) {
                        const prevUrlMap: Record<string, number> = {};
                        for (const r of prevCitations) {
                            prevUrlMap[r.url] = (prevUrlMap[r.url] || 0) + (r.mention_count || 0);
                        }

                        const prevRanking = Object.entries(prevUrlMap)
                            .map(([url, mentions]) => ({ url, mentions }))
                            .sort((a, b) => b.mentions - a.mentions);

                        const prevRankMap: Record<string, number> = {};
                        prevRanking.forEach((item, idx) => {
                            prevRankMap[item.url] = idx + 1;
                        });

                        finalCitations = clientCitationBase.map(item => {
                            const prevRank = prevRankMap[item.url];
                            if (!prevRank) return item;

                            return {
                                ...item,
                                rank_change: prevRank - (item as any).rank
                            };
                        });
                    }
                }
            }
        } catch (trendErr) {
            console.warn('[Dashboard/ClientCitations] Trend calc failed:', trendErr);
        }

        return NextResponse.json({ data: finalCitations });
    } catch (error: any) {
        console.error('[Dashboard/ClientCitations] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
