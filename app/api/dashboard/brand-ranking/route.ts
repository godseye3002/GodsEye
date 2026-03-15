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

        const fetchBrandRows = async (sid: string) => {
            return await (supabase as any)
                .from('brand_visibility_tracking')
                .select('*')
                .eq('snapshot_id', sid)
                .eq('engine', engine);
        }

        let { data: brandData, error } = await fetchBrandRows(effectiveSnapshotId);

        console.log('[Dashboard/BrandRanking] Query:', { snapshotId, engine, count: brandData?.length, error });

        if (error) {
            console.error('[Dashboard/BrandRanking] Error:', error);
            return NextResponse.json({ error: 'Failed to fetch brand ranking' }, { status: 500 });
        }

        if (!brandData || brandData.length === 0) {
            // Fallback: if snapshot_id has no tracking rows (common if tracking is written asynchronously),
            // try the most recent snapshot_id present in brand_visibility_tracking for this product+engine.
            if (productId) {
                const { data: latestTrackingRow, error: latestErr } = await (supabase as any)
                    .from('brand_visibility_tracking')
                    .select('snapshot_id')
                    .eq('product_id', productId)
                    .eq('engine', engine)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (!latestErr && latestTrackingRow?.snapshot_id && latestTrackingRow.snapshot_id !== effectiveSnapshotId) {
                    effectiveSnapshotId = latestTrackingRow.snapshot_id;
                    const retry = await fetchBrandRows(effectiveSnapshotId);
                    brandData = retry.data;
                    error = retry.error;
                }
            }

            if (!brandData || brandData.length === 0) {
                console.log('[Dashboard/BrandRanking] No brand data found');
                return NextResponse.json({ data: [] });
            }
        }

        // Calculate totals
        const totalMentionsAll = brandData.reduce((sum: number, r: any) => sum + (r.mention_count || 0), 0);
        const uniqueQueryIds = new Set(brandData.map((r: any) => r.query_analysis_id));
        const totalQueriesAnalyzed = uniqueQueryIds.size || 1;

        // Group by brand
        const brandMap: Record<string, { mentions: number; queriesWithMentions: Set<string> }> = {};
        for (const record of brandData) {
            const brand = record.brand_name || 'Unknown';
            if (!brandMap[brand]) {
                brandMap[brand] = { mentions: 0, queriesWithMentions: new Set() };
            }
            brandMap[brand].mentions += record.mention_count || 0;
            if (record.mention_count > 0) {
                brandMap[brand].queriesWithMentions.add(record.query_analysis_id);
            }
        }

        // Build ranking
        const brandRankingBase = Object.entries(brandMap).map(([brandName, data]) => ({
            brand_name: brandName,
            total_mentions: data.mentions,
            sov_percentage: totalMentionsAll > 0 ? Math.round((data.mentions / totalMentionsAll) * 10000) / 100 : 0,
            brand_coverage: Math.round((data.queriesWithMentions.size / totalQueriesAnalyzed) * 10000) / 100,
        }));

        // --- TREND CALCULATION ---
        let brandRankingWithTrends = brandRankingBase;

        try {
            // Find the previous snapshot for this product + engine
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
                    const { data: prevBrandData } = await fetchBrandRows(prevSnap.id);
                    if (prevBrandData && prevBrandData.length > 0) {
                        const prevTotalMentions = prevBrandData.reduce((sum: number, r: any) => sum + (r.mention_count || 0), 0);
                        const prevUniqueQueries = new Set(prevBrandData.map((r: any) => r.query_analysis_id)).size || 1;

                        const prevBrandMap: Record<string, { mentions: number, qCount: number }> = {};
                        for (const r of prevBrandData) {
                            const b = r.brand_name || 'Unknown';
                            if (!prevBrandMap[b]) prevBrandMap[b] = { mentions: 0, qCount: 0 };
                            prevBrandMap[b].mentions += (r.mention_count || 0);
                            if (r.mention_count > 0) prevBrandMap[b].qCount++;
                        }

                        brandRankingWithTrends = brandRankingBase.map(item => {
                            const prev = prevBrandMap[item.brand_name];
                            if (!prev) return item;

                            const prevSov = prevTotalMentions > 0 ? (prev.mentions / prevTotalMentions) * 100 : 0;
                            const prevCov = (prev.qCount / prevUniqueQueries) * 100;

                            return {
                                ...item,
                                mentions_trend: item.total_mentions - prev.mentions,
                                sov_trend: Math.round((item.sov_percentage - prevSov) * 100) / 100,
                                coverage_trend: Math.round((item.brand_coverage - prevCov) * 100) / 100,
                            };
                        });
                    }
                }
            }
        } catch (trendErr) {
            console.warn('[Dashboard/BrandRanking] Trend calc failed (non-critical):', trendErr);
        }

        // Sort descending by mentions
        brandRankingWithTrends.sort((a, b) => b.total_mentions - a.total_mentions);

        return NextResponse.json({ data: brandRankingWithTrends });
    } catch (error: any) {
        console.error('[Dashboard/BrandRanking] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
