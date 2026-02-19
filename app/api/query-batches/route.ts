import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');

    if (!userId || !productId) {
      return NextResponse.json(
        { error: 'User ID and Product ID are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // 1. Fetch all used query texts from analysis tables
    // This is more reliable than the status flags in the queries table
    const [googleRes, perplexityRes] = await Promise.all([
      (supabaseAdmin as any)
        .from('product_analysis_google')
        .select('search_query')
        .eq('product_id', productId)
        .not('search_query', 'is', null),
      (supabaseAdmin as any)
        .from('product_analysis_perplexity')
        .select('optimization_prompt')
        .eq('product_id', productId)
        .not('optimization_prompt', 'is', null)
    ]);

    const googleData = googleRes.data || [];
    const perplexityData = perplexityRes.data || [];

    const usedQueriesSet = new Set<string>();

    googleData.forEach((row: any) => {
      if (row.search_query) usedQueriesSet.add(row.search_query.trim());
    });

    perplexityData.forEach((row: any) => {
      if (row.optimization_prompt) usedQueriesSet.add(row.optimization_prompt.trim());
    });

    // 2. Fetch batches with their queries
    const { data, error } = await (supabaseAdmin as any)
      .from('query_batches')
      .select(`
        *,
        batch_queries (
          queries (
            query_text
          )
        )
      `)
      .eq('user_id', userId)
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[QueryBatches] Error fetching:', error);
      }
      return NextResponse.json(
        { error: 'Failed to fetch batches', details: error.message },
        { status: 500 }
      );
    }

    // 3. Map batches and determine usage based on the Set
    const batches = (data || []).map((batch: any) => {
      const hasUsedQueries = (batch.batch_queries || []).some((bq: any) => {
        const q = bq.queries;
        if (!q || !q.query_text) return false;
        return usedQueriesSet.has(q.query_text.trim());
      });

      // Remove the detailed joined data to keep response clean
      const { batch_queries, ...rest } = batch;
      return {
        ...rest,
        has_used_queries: hasUsedQueries
      };
    });

    return NextResponse.json({ batches });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[QueryBatches] GET error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a batch if it has no used queries
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    if (!batchId) {
      return NextResponse.json(
        { error: 'Batch ID is required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // 1. Fetch queries linked to this batch to get their texts and product_id
    const { data: batchQueries, error: fetchError } = await (supabaseAdmin as any)
      .from('batch_queries')
      .select('query_id, queries(product_id, query_text)')
      .eq('batch_id', batchId);

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch batch queries', details: fetchError.message }, { status: 500 });
    }

    if (!batchQueries || batchQueries.length === 0) {
      // No queries, just delete the batch
      const { error: deleteBatchError } = await (supabaseAdmin as any)
        .from('query_batches')
        .delete()
        .eq('id', batchId);

      if (deleteBatchError) {
        return NextResponse.json({ error: 'Failed to delete batch', details: deleteBatchError.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // 2. Check for used queries against analysis tables
    const productIds = batchQueries.map((bq: any) => bq.queries?.product_id).filter(Boolean);
    const productId = productIds.length > 0 ? productIds[0] : null;

    const queryTexts = batchQueries
      .map((bq: any) => bq.queries?.query_text?.trim())
      .filter(Boolean);

    if (queryTexts.length > 0 && productId) {
      // Fetch relevant analyses for this product that match our query texts
      // Note: Supabase .in() filter works well for arrays of strings
      const [googleRes, perplexityRes] = await Promise.all([
        (supabaseAdmin as any)
          .from('product_analysis_google')
          .select('search_query', { count: 'exact', head: true })
          .eq('product_id', productId)
          .in('search_query', queryTexts),
        (supabaseAdmin as any)
          .from('product_analysis_perplexity')
          .select('optimization_prompt', { count: 'exact', head: true })
          .eq('product_id', productId)
          .in('optimization_prompt', queryTexts)
      ]);

      const googleCount = googleRes.count;
      const perplexityCount = perplexityRes.count;
      const isUsed = (googleCount || 0) > 0 || (perplexityCount || 0) > 0;

      if (isUsed) {
        return NextResponse.json(
          { error: 'Cannot delete batch because it contains queries that have been used in an analysis.' },
          { status: 400 }
        );
      }
    }

    // 3. Identify Orphan Queries
    const queryIds = batchQueries.map((bq: any) => bq.query_id);

    // Fetch all batch_queries entries for these query IDs
    const { data: allLinks, error: linksError } = await (supabaseAdmin as any)
      .from('batch_queries')
      .select('query_id, batch_id')
      .in('query_id', queryIds);

    if (linksError) {
      return NextResponse.json({ error: 'Failed to check query usage', details: linksError.message }, { status: 500 });
    }

    // Count usages per query
    const usageCount: Record<string, number> = {};
    (allLinks || []).forEach((link: any) => {
      usageCount[link.query_id] = (usageCount[link.query_id] || 0) + 1;
    });

    // Identify queries that are ONLY used in this batch (count === 1)
    const orphanQueryIds = queryIds.filter((id: string) => usageCount[id] === 1);

    // 4. Delete links in batch_queries
    const { error: deleteLinksError } = await (supabaseAdmin as any)
      .from('batch_queries')
      .delete()
      .eq('batch_id', batchId);

    if (deleteLinksError) {
      return NextResponse.json({ error: 'Failed to delete batch links', details: deleteLinksError.message }, { status: 500 });
    }

    // 5. Delete Orphan Queries
    if (orphanQueryIds.length > 0) {
      const { error: deleteQueriesError } = await (supabaseAdmin as any)
        .from('queries')
        .delete()
        .in('id', orphanQueryIds);

      if (deleteQueriesError) {
        console.error('Failed to delete orphan queries:', deleteQueriesError);
      }
    }

    // 6. Delete the batch record
    const { error: deleteBatchError } = await (supabaseAdmin as any)
      .from('query_batches')
      .delete()
      .eq('id', batchId);

    if (deleteBatchError) {
      return NextResponse.json({ error: 'Failed to delete batch', details: deleteBatchError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedQueries: orphanQueryIds.length });
  } catch (error: any) {
    console.error('[QueryBatches] DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
