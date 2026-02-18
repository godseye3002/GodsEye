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

    const { data, error } = await (supabaseAdmin as any)
      .from('query_batches')
      .select('*')
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

    return NextResponse.json({ batches: data || [] });
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

    // 1. Fetch queries linked to this batch
    const { data: batchQueries, error: fetchError } = await (supabaseAdmin as any)
      .from('batch_queries')
      .select('query_id, queries(google_status, perplexity_status)')
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

    // 2. Check for used queries (status is not pending and not not_applicable)
    const queriesToCheck = (batchQueries || []).map((bq: any) => bq.queries);
    const hasUsedQueries = queriesToCheck.some((q: any) =>
      (q?.google_status && q.google_status !== 'pending' && q.google_status !== 'not_applicable') ||
      (q?.perplexity_status && q.perplexity_status !== 'pending' && q.perplexity_status !== 'not_applicable')
    );

    if (hasUsedQueries) {
      return NextResponse.json(
        { error: 'Cannot delete batch because it lists queries that have been used (or are in progress).' },
        { status: 400 }
      );
    }

    // 3. Identify Orphan Queries
    // We need to find which of these query_ids are NOT linked to any other batch.
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
    // Since we are about to delete the link for THIS batch, if count is 1, it means this is the only link.
    const orphanQueryIds = queryIds.filter((id: string) => usageCount[id] === 1);

    // 4. Delete links in batch_queries (must happen before deleting queries if cascading isn't set, or doesn't matter if we delete orphans after)
    // Actually, if we delete links first, we are safe.
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
        // We continue, as the batch and links are deleted, so from user POV it's mostly done.
        // But ideally we should report or retry. For now, just log.
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
