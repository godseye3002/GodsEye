import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const engine = searchParams.get('engine');
        const snapshotId = searchParams.get('snapshotId');

        if (!productId || !engine) {
            return NextResponse.json(
                { error: 'productId and engine are required' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdminClient();

        // Build query for sov_query_insights
        let query = (supabase as any)
            .from('sov_query_insights')
            .select('*')
            .eq('product_id', productId)
            .eq('engine', engine);

        // Note: `sov_query_insights` in this project does NOT have `snapshot_id`.
        // We keep reading `snapshotId` from the URL for future compatibility, but
        // we cannot filter by it here.

        const { data: insights, error } = await query;

        if (error) {
            console.error('[Dashboard/TopPrompts] Error fetching insights:', error);
            // Important: do not 500 the whole dashboard for a missing column / RLS mismatch.
            // Return empty data and let other widgets render.
            return NextResponse.json({ data: [] }, { status: 200 });
        }

        console.log('[Dashboard/TopPrompts] Fetched insights:', { count: insights?.length, productId, engine, snapshotId });

        if (!insights || insights.length === 0) {
            return NextResponse.json({ data: [] });
        }

        // Fetch query text from engine-specific tables based on engine
        const analysisIds = [...new Set(insights.map((i: any) => i.analysis_id).filter(Boolean))];
        let queryTextMap: Record<string, string> = {};

        if (analysisIds.length > 0) {
            try {
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

                const { data: queryRecords, error: queryError } = await (supabase as any)
                    .from(tableName)
                    .select(`id, ${queryColumn}`)
                    .in('id', analysisIds);

                if (!queryError && queryRecords) {
                    for (const qr of queryRecords) {
                        if (qr.id && qr[queryColumn]) {
                            queryTextMap[qr.id] = qr[queryColumn];
                        }
                    }
                }
            } catch (lookupError) {
                console.error('[Dashboard/TopPrompts] Failed to lookup query text:', lookupError);
            }
        }

        // Group insights by resolved query text
        const groupedInsights: Record<string, any[]> = {};
        insights.forEach((insight: any) => {
            const queryText = queryTextMap[insight.analysis_id] || insight.query_text || insight.analysis_id || "Unknown Query";
            if (!groupedInsights[queryText]) {
                groupedInsights[queryText] = [];
            }
            groupedInsights[queryText].push(insight);
        });

        // Aggregating prompts: Most recent data + run count + trends
        const aggregatedPrompts = Object.entries(groupedInsights).map(([query, group]) => {
            // Sort by created_at DESC (newest first)
            const sortedGroup = group.sort((a, b) => {
                const dateA = new Date(a.created_at || 0).getTime();
                const dateB = new Date(b.created_at || 0).getTime();
                return dateB - dateA;
            });

            const latest = sortedGroup[0];
            const previous = sortedGroup[1] || null;

            return {
                query,
                run_count: sortedGroup.length,
                dominance_rate: latest.dominance_rate ?? 0,
                visibility_occurrence_rate: latest.mention_count ?? 0,
                text_snippet: latest.text_snippet || null,
                conversion_probability: latest.conversion_probability ?? null,
                conversion_reasoning: latest.conversion_reasoning || null,
                dominance_trend: previous ? (latest.dominance_rate ?? 0) - (previous.dominance_rate ?? 0) : 0,
                conversion_trend: previous ? (latest.conversion_probability ?? 0) - (previous.conversion_probability ?? 0) : 0,
            };
        });

        // Final sort by dominance_rate and slice
        const topPrompts = aggregatedPrompts
            .sort((a, b) => b.dominance_rate - a.dominance_rate)
            .slice(0, 50)
            .map((p, index) => ({
                ...p,
                rank: index + 1,
            }));

        return NextResponse.json({ data: topPrompts });
    } catch (error: any) {
        console.error('[Dashboard/TopPrompts] Unexpected error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
