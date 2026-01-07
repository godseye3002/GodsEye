import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

interface SOVSnapshot {
  id: string;
  product_id: string;
  global_sov_score: number;
  citation_score: number;
  category_relevance: number;
  total_queries_analyzed: number;
  narrative_summary: string;
  engine: 'google' | 'perplexity';
  analyzed_at: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const engine = searchParams.get('engine');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!engine || !['google', 'perplexity'].includes(engine)) {
      return NextResponse.json(
        { error: 'Valid engine (google or perplexity) is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // Fetch the most recent snapshot for this product and engine
    const { data: snapshotData, error: snapshotError } = await supabase
      .from('sov_product_snapshots')
      .select('*')
      .eq('product_id', productId)
      .eq('engine', engine)
      .order('analyzed_at', { ascending: false })
      .limit(1)
      .single() as { data: SOVSnapshot | null; error: any };

    if (snapshotError || !snapshotData) {
      if (snapshotError?.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'No Share of Voice data available for this product.' },
          { status: 404 }
        );
      }
      console.error('Snapshot fetch error:', snapshotError);
      return NextResponse.json(
        { error: 'Failed to load Share of Voice data.' },
        { status: 500 }
      );
    }

    // Fetch insights for this product and engine (separate fetch, no join)
    const insightsLimit = snapshotData.total_queries_analyzed || 20;
    const { data: insightsData, error: insightsError } = await supabase
      .from('sov_query_insights')
      .select('*')
      .eq('product_id', productId)
      .eq('engine', engine)
      .order('created_at', { ascending: false })
      .limit(insightsLimit);

    if (insightsError) {
      console.error('Insights fetch error:', insightsError);
      // Continue without insights if there's an error
    }

    return NextResponse.json({
      snapshot: snapshotData,
      insights: insightsData || []
    });

  } catch (error: any) {
    console.error('SOV API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
