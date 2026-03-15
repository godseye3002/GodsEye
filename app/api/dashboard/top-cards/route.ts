import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

interface TrendData {
    brand_coverage_trend: number | null;
    total_mentions_trend: number | null;
    visibility_rate_trend: number | null;
    global_sov_score_trend: number | null;
    citation_score_trend: number | null;
    avg_dominance_rate_trend: number | null;
    avg_conversion_probability_trend: number | null;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const snapshotId = searchParams.get('snapshotId');
        const engine = searchParams.get('engine');

        if (!snapshotId || !engine) {
            return NextResponse.json(
                { error: 'snapshotId and engine are required' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdminClient();

        // Fetch current snapshot data with product_id
        const { data: currentSnapshot, error: currentError } = await (supabase as any)
            .from('sov_product_snapshots')
            .select('id, product_id, brand_coverage, total_mentions, visibility_rate, global_sov_score, citation_score, avg_dominance_rate, avg_conversion_probability, analyzed_at')
            .eq('id', snapshotId)
            .eq('engine', engine)
            .single();

        if (currentError) {
            if (currentError.code === 'PGRST116') {
                return NextResponse.json({ data: null });
            }
            console.error('[Dashboard/TopCards] Error:', currentError);
            return NextResponse.json({ error: 'Failed to fetch top cards' }, { status: 500 });
        }

        if (!currentSnapshot) {
            return NextResponse.json({ data: null });
        }

        // Fetch previous snapshot for the same product + engine (before current analyzed_at)
        const { data: previousSnapshot } = await (supabase as any)
            .from('sov_product_snapshots')
            .select('brand_coverage, total_mentions, visibility_rate, global_sov_score, citation_score, avg_dominance_rate, avg_conversion_probability')
            .eq('product_id', currentSnapshot.product_id)
            .eq('engine', engine)
            .lt('analyzed_at', currentSnapshot.analyzed_at)
            .order('analyzed_at', { ascending: false })
            .limit(1)
            .single();

        // Calculate trends (percentage change)
        const calculateTrend = (current: number | null, previous: number | null): number | null => {
            if (current === null || previous === null || previous === 0) {
                return null;
            }
            return Math.round(((current - previous) / previous) * 10000) / 100;
        };

        const trends: TrendData = {
            brand_coverage_trend: calculateTrend(currentSnapshot.brand_coverage, previousSnapshot?.brand_coverage),
            total_mentions_trend: calculateTrend(currentSnapshot.total_mentions, previousSnapshot?.total_mentions),
            visibility_rate_trend: calculateTrend(currentSnapshot.visibility_rate, previousSnapshot?.visibility_rate),
            global_sov_score_trend: calculateTrend(currentSnapshot.global_sov_score, previousSnapshot?.global_sov_score),
            citation_score_trend: calculateTrend(currentSnapshot.citation_score, previousSnapshot?.citation_score),
            avg_dominance_rate_trend: calculateTrend(currentSnapshot.avg_dominance_rate, previousSnapshot?.avg_dominance_rate),
            avg_conversion_probability_trend: calculateTrend(currentSnapshot.avg_conversion_probability, previousSnapshot?.avg_conversion_probability),
        };

        // Fetch all snapshots for this product + engine to calculate Best of All Time (ATH)
        const { data: allSnapshots, error: allSnapshotsError } = await (supabase as any)
            .from('sov_product_snapshots')
            .select('brand_coverage, total_mentions, visibility_rate, global_sov_score, citation_score, avg_dominance_rate, avg_conversion_probability')
            .eq('product_id', currentSnapshot.product_id)
            .eq('engine', engine);

        if (allSnapshotsError) {
            console.error('[Dashboard/TopCards] Error fetching all snapshots for ATH:', allSnapshotsError);
        }

        const getBest = (key: string) => {
            if (!allSnapshots || allSnapshots.length === 0) return null;
            const values = allSnapshots
                .map((s: any) => s[key])
                .filter((v: any) => typeof v === 'number');
            return values.length > 0 ? Math.max(...values) : null;
        };

        const responseData = {
            ...currentSnapshot,
            ...trends,
            prev_brand_coverage: previousSnapshot?.brand_coverage ?? null,
            prev_total_mentions: previousSnapshot?.total_mentions ?? null,
            prev_visibility_rate: previousSnapshot?.visibility_rate ?? null,
            prev_global_sov_score: previousSnapshot?.global_sov_score ?? null,
            prev_citation_score: previousSnapshot?.citation_score ?? null,
            prev_avg_dominance_rate: previousSnapshot?.avg_dominance_rate ?? null,
            prev_avg_conversion_probability: previousSnapshot?.avg_conversion_probability ?? null,
            best_brand_coverage: getBest('brand_coverage'),
            best_total_mentions: getBest('total_mentions'),
            best_visibility_rate: getBest('visibility_rate'),
            best_global_sov_score: getBest('global_sov_score'),
            best_citation_score: getBest('citation_score'),
            best_avg_dominance_rate: getBest('avg_dominance_rate'),
            best_avg_conversion_probability: getBest('avg_conversion_probability'),
        };

        console.log('[Dashboard/TopCards] ATH Stats calculated for:', { productId: currentSnapshot.product_id, engine });

        return NextResponse.json({ data: responseData });
    } catch (error: any) {
        console.error('[Dashboard/TopCards] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
