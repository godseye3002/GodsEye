import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const engine = searchParams.get('engine');

        if (!productId || !engine) {
            return NextResponse.json(
                { error: 'productId and engine are required' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdminClient();

        // Fetch all snapshots for this product + engine to get dates
        const { data: snapshots, error: snapshotsError } = await (supabase as any)
            .from('sov_product_snapshots')
            .select('snapshot_id, analyzed_at')
            .eq('product_id', productId)
            .eq('engine', engine)
            .order('analyzed_at', { ascending: true });

        console.log('[Dashboard/BrandCoverageGraph] Snapshots query:', { productId, engine, count: snapshots?.length, error: snapshotsError });

        if (snapshotsError) {
            console.error('[Dashboard/BrandCoverageGraph] Snapshots error:', snapshotsError);
            return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
        }

        if (!snapshots || snapshots.length === 0) {
            console.log('[Dashboard/BrandCoverageGraph] No snapshots found');
            return NextResponse.json({ data: [] });
        }

        // 1. Snapshot date mapping
        const snapshotIds = snapshots.map((s: any) => s.snapshot_id);
        const snapshotDateMap = new Map<string, string | undefined>(snapshots.map((s: any) => [s.snapshot_id as string, s.analyzed_at?.split('T')[0] as string | undefined]));

        // 2. Fetch brand visibility tracking (X-axis: coverage/dominance)
        const { data: brandData, error: brandError } = await (supabase as any)
            .from('brand_visibility_tracking')
            .select('snapshot_id, brand_name, mention_count, is_client_brand')
            .in('snapshot_id', snapshotIds)
            .eq('engine', engine) as { data: any[] | null; error: any };

        if (brandError) {
            console.error('[Dashboard/BrandCoverageGraph] Brand data error:', brandError);
            return NextResponse.json({ error: 'Failed to fetch brand data' }, { status: 500 });
        }

        // 3. Fetch query insights (Y-axis: conversion probability)
        // Note: Joining on productId and engine as proxy for matching the snapshots' timeframe
        const { data: insightsData, error: insightsError } = await (supabase as any)
            .from('sov_query_insights')
            .select('winning_source, conversion_probability, created_at')
            .eq('product_id', productId)
            .eq('engine', engine) as { data: any[] | null; error: any };

        if (insightsError) {
            console.warn('[Dashboard/BrandCoverageGraph] Insights error (continuing with coverage only):', insightsError);
        }

        if (!brandData || brandData.length === 0) {
            return NextResponse.json({ data: [] });
        }

        // Get unique brand names
        const brandNames: string[] = [...new Set<string>(brandData.map((b: any) => b.brand_name as string))];

        // Group everything by date
        // date -> { brand_name -> { coverage, conversion, mentions, count } }
        const dateBrandMetrics = new Map<string, Map<string, { coverage: number, conversion: number, mentions: number, count: number }>>();

        // Process coverage from brandData
        const snapshotTotals = new Map<string, number>();
        for (const record of brandData) {
            const current = snapshotTotals.get(record.snapshot_id) || 0;
            snapshotTotals.set(record.snapshot_id, current + (record.mention_count || 0));
        }

        for (const record of brandData) {
            const date = snapshotDateMap.get(record.snapshot_id);
            if (!date) continue;

            if (!dateBrandMetrics.has(date)) {
                dateBrandMetrics.set(date, new Map());
            }

            const metricsMap = dateBrandMetrics.get(date)!;
            const brandName = record.brand_name || 'Unknown';
            if (!metricsMap.has(brandName)) {
                metricsMap.set(brandName, { coverage: 0, conversion: 0, mentions: 0, count: 0 });
            }

            const totalInSnapshot = snapshotTotals.get(record.snapshot_id) || 1;
            const m = metricsMap.get(brandName)!;
            m.mentions += record.mention_count || 0;
            m.coverage = Math.round(((m.mentions) / totalInSnapshot) * 10000) / 100;
        }

        // Process conversion from insightsData
        if (insightsData && insightsData.length > 0) {
            for (const record of insightsData) {
                const date = record.created_at?.split('T')[0];
                if (!date || !dateBrandMetrics.has(date)) continue;

                const brandName = record.winning_source;
                if (!brandName) continue;

                const metricsMap = dateBrandMetrics.get(date);
                if (metricsMap && metricsMap.has(brandName)) {
                    const m = metricsMap.get(brandName)!;
                    const val = parseFloat(record.conversion_probability);
                    if (!isNaN(val)) {
                        m.conversion = (m.conversion * m.count + val) / (m.count + 1);
                        m.count += 1;
                    }
                }
            }
        }

        // Transform to chart-friendly format
        // First, group brandNames by their normalized key to prevent duplicates
        const brandKeyToNameMap = new Map<string, string>();
        const brandKeyToIsClientMap = new Map<string, boolean>();
        brandNames.forEach(name => {
            const key = name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            if (!brandKeyToNameMap.has(key)) {
                brandKeyToNameMap.set(key, name);
                // Find if this brand is a client brand in the raw data
                const isClient = brandData.some(b => b.brand_name === name && b.is_client_brand === true);
                brandKeyToIsClientMap.set(key, isClient);
            }
        });

        const sortedDates = [...dateBrandMetrics.keys()].sort();
        const graphData = sortedDates.map(date => {
            const point: any = { date };
            const metricsMap = dateBrandMetrics.get(date);
            if (metricsMap) {
                // Keep track of metrics by key to aggregate if multiple brands map to same key
                const keyMetrics: Record<string, { coverage: number, conversion: number, count: number }> = {};

                for (const [brandName, metrics] of metricsMap) {
                    const key = brandName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
                    if (!keyMetrics[key]) {
                        keyMetrics[key] = { coverage: 0, conversion: 0, count: 0 };
                    }
                    const km = keyMetrics[key];
                    km.coverage = Math.max(km.coverage, metrics.coverage); // Use max coverage
                    if (metrics.count > 0) {
                        km.conversion = (km.conversion * km.count + metrics.conversion * metrics.count) / (km.count + metrics.count);
                        km.count += metrics.count;
                    }
                }

                for (const key in keyMetrics) {
                    const km = keyMetrics[key];
                    point[key] = km.coverage;
                    point[`${key}_coverage`] = km.coverage;
                    point[`${key}_conversion`] = km.count > 0 ? Math.round(km.conversion * 100) / 100 : 0;
                    point[`${key}_label`] = brandKeyToNameMap.get(key) || key;
                }
            }
            return point;
        });

        const uniqueBrands = Array.from(brandKeyToNameMap.entries()).map(([key, name]) => ({
            name,
            key,
            isClient: brandKeyToIsClientMap.get(key) || false
        }));

        return NextResponse.json({
            data: graphData,
            brands: uniqueBrands,
        });
    } catch (error: any) {
        console.error('[Dashboard/BrandCoverageGraph] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
