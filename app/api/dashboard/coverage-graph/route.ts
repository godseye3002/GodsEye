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

        const { data, error } = await (supabase as any)
            .from('sov_product_snapshots')
            .select('analyzed_at, brand_coverage, avg_dominance_rate, avg_conversion_probability, visibility_rate, citation_score, category_relevance')
            .eq('product_id', productId)
            .eq('engine', engine)
            .order('analyzed_at', { ascending: true });

        if (error) {
            console.error('[Dashboard/CoverageGraph] Error:', error);
            return NextResponse.json({ error: 'Failed to fetch coverage graph data' }, { status: 500 });
        }

        // Map to chart-friendly format
        const graphData = (data || []).map((record: any) => ({
            date: record.analyzed_at ? record.analyzed_at.split('T')[0] : '',
            brand_coverage: record.brand_coverage,
            avg_dominance_rate: record.avg_dominance_rate,
            avg_conversion_probability: record.avg_conversion_probability,
            visibility_rate: record.visibility_rate,
            citation_score: record.citation_score,
            category_relevance: record.category_relevance,
        }));

        return NextResponse.json({ data: graphData });
    } catch (error: any) {
        console.error('[Dashboard/CoverageGraph] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
