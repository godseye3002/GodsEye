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

        const fetchCitationRows = async (sid: string) => {
            return await (supabase as any)
                .from('citation_analytics')
                .select('url, mention_count')
                .eq('snapshot_id', sid)
                .eq('engine', engine);
        }

        let { data: citations, error } = await fetchCitationRows(effectiveSnapshotId);

        if (error) {
            console.error('[Dashboard/CitationRanking] Error:', error);
            return NextResponse.json({ error: 'Failed to fetch citation ranking' }, { status: 500 });
        }

        if (!citations || citations.length === 0) {
            // Fallback: if snapshot_id has no citation rows, try latest snapshot_id in citation_analytics for this product+engine.
            if (productId) {
                const { data: latestCitationRow, error: latestErr } = await (supabase as any)
                    .from('citation_analytics')
                    .select('snapshot_id')
                    .eq('product_id', productId)
                    .eq('engine', engine)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (!latestErr && latestCitationRow?.snapshot_id && latestCitationRow.snapshot_id !== effectiveSnapshotId) {
                    effectiveSnapshotId = latestCitationRow.snapshot_id;
                    const retry = await fetchCitationRows(effectiveSnapshotId);
                    citations = retry.data;
                    error = retry.error;
                }
            }

            if (!citations || citations.length === 0) {
                return NextResponse.json({ data: [] });
            }
        }

        // Total citations across all URLs
        const totalCitationsAll = citations.reduce((sum: number, r: any) => sum + (r.mention_count || 0), 0);

        // Group by URL
        const urlMap: Record<string, number> = {};
        for (const record of citations) {
            const url = record.url || 'Unknown';
            urlMap[url] = (urlMap[url] || 0) + (record.mention_count || 0);
        }

        // Build ranking
        const citationRankingBase = Object.entries(urlMap).map(([url, totalMentions]) => ({
            url,
            total_mentions: totalMentions,
            citation_share: totalCitationsAll > 0 ? Math.round((totalMentions / totalCitationsAll) * 10000) / 100 : 0,
        }));

        // Sort descending
        citationRankingBase.sort((a, b) => b.total_mentions - a.total_mentions);

        // Assign current ranks
        citationRankingBase.forEach((item, index) => {
            (item as any).rank = index + 1;
        });

        // --- TREND CALCULATION ---
        let finalRanking: any[] = citationRankingBase;

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
                    const { data: prevCitations } = await fetchCitationRows(prevSnap.id);
                    if (prevCitations && prevCitations.length > 0) {
                        const prevUrlMap: Record<string, number> = {};
                        for (const r of prevCitations) {
                            prevUrlMap[r.url] = (prevUrlMap[r.url] || 0) + (r.mention_count || 0);
                        }

                        const prevRanking = Object.entries(prevUrlMap)
                            .map(([url, mentions]) => ({ url, mentions }))
                            .sort((a, b) => b.mentions - a.mentions);

                        const prevRankMap: Record<string, { rank: number; mentions: number }> = {};
                        prevRanking.forEach((item, idx) => {
                            prevRankMap[item.url] = { rank: idx + 1, mentions: item.mentions };
                        });

                        finalRanking = citationRankingBase.map(item => {
                            const prev = prevRankMap[item.url];
                            if (!prev) return item;

                            return {
                                ...item,
                                rank_change: prev.rank - (item as any).rank,
                                mentions_trend: item.total_mentions - prev.mentions
                            };
                        });
                    }
                }
            }
        } catch (trendErr) {
            console.warn('[Dashboard/CitationRanking] Trend calc failed:', trendErr);
        }

        return NextResponse.json({ data: finalRanking });
    } catch (error: any) {
        console.error('[Dashboard/CitationRanking] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
