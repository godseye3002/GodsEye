import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

// GET - Fetch queries for a user and product
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const productId = searchParams.get('productId');
    const batchId = searchParams.get('batchId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Queries] Fetching with:', { userId, productId, batchId });
    }

    const supabaseAdmin = getSupabaseAdminClient();

    let query = supabaseAdmin
      .from('queries')
      .select('*')
      .eq('user_id', userId);

    if (productId) {
      query = query.eq('product_id', productId);
    }

    if (batchId) {
      if (!productId) {
        return NextResponse.json(
          { error: 'Product ID is required when filtering by batch' },
          { status: 400 }
        );
      }

      const { data: batchLinks, error: batchError } = await (supabaseAdmin as any)
        .from('batch_queries')
        .select('query_id')
        .eq('batch_id', batchId);

      if (process.env.NODE_ENV !== 'production') {
        console.log('[Queries] Batch links fetched:', { 
          batchId, 
          batchLinksCount: batchLinks?.length || 0,
          batchLinks: batchLinks?.slice(0, 3) 
        });
      }

      if (batchError) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[Queries] Error fetching batch links:', batchError);
        }
        return NextResponse.json(
          { error: 'Failed to fetch batch queries', details: batchError.message },
          { status: 500 }
        );
      }

      const queryIds = (batchLinks || []).map((row: any) => row.query_id).filter(Boolean);
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Queries] Query IDs extracted:', { 
          queryIdsCount: queryIds.length,
          queryIds: queryIds.slice(0, 5) 
        });
      }
      
      if (queryIds.length === 0) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Queries] No query IDs found, returning empty array');
        }
        return NextResponse.json({ queries: [] });
      }

      query = query.in('id', queryIds);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Queries] Result:', { 
        error: error?.message, 
        dataCount: data?.length || 0,
        sampleData: data?.slice(0, 2),
        suggestedEngines: data?.map((q: any) => q.suggested_engine).slice(0, 10)
      });
    }

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Queries] Error fetching:', error);
      }
      return NextResponse.json(
        { error: 'Failed to fetch queries', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ queries: data || [] });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Queries] GET error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Save generated queries
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, productId, queries } = body;

    if (!userId || !productId || !queries || !Array.isArray(queries)) {
      return NextResponse.json(
        { error: 'User ID, Product ID, and queries array are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // Group queries by similar length
    const queryLengths = queries.map((query: string) => ({
      text: query,
      wordCount: query.trim().split(/\s+/).length
    }));

    // Sort by word count to find natural grouping
    queryLengths.sort((a, b) => b.wordCount - a.wordCount);

    // Find the natural split point for similar length grouping
    let splitIndex = 0;
    const maxWordCount = queryLengths[0]?.wordCount || 0;
    
    // Find the largest gap in word counts to determine grouping
    let largestGap = 0;
    for (let i = 0; i < queryLengths.length - 1; i++) {
      const gap = queryLengths[i].wordCount - queryLengths[i + 1].wordCount;
      if (gap > largestGap) {
        largestGap = gap;
        splitIndex = i + 1;
      }
    }

    // If no significant gap found, use median as split point
    if (largestGap < 2) {
      splitIndex = Math.floor(queryLengths.length / 2);
    }

    // Group into long queries (similar length) and rest
    const longQueries = queryLengths.slice(0, splitIndex).map(q => q.text);
    const restQueries = queryLengths.slice(splitIndex).map(q => q.text);

    // Ensure exactly 5 queries per category
    const finalGoogleQueries = longQueries.slice(0, 5);
    const finalPerplexityQueries = restQueries.slice(0, 5);

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Queries] POST received:', { 
        userId, 
        productId, 
        totalInputQueries: queries.length,
        googleQueries: finalGoogleQueries.length,
        perplexityQueries: finalPerplexityQueries.length,
        sampleQueries: {
          google: finalGoogleQueries.slice(0, 2),
          perplexity: finalPerplexityQueries.slice(0, 2)
        }
      });
    }

    // Prepare query records
    const queryRecords = [
      ...finalGoogleQueries.map((queryText) => ({
        user_id: userId,
        product_id: productId,
        query_text: queryText,
        priority: 1,
        google_status: 'pending',
        perplexity_status: 'not_applicable',
        suggested_engine: 'google',
      })),
      ...finalPerplexityQueries.map((queryText) => ({
        user_id: userId,
        product_id: productId,
        query_text: queryText,
        priority: 1,
        google_status: 'not_applicable',
        perplexity_status: 'pending',
        suggested_engine: 'perplexity',
      })),
    ];

    // Insert queries using proper typing
    const { data, error } = await (supabaseAdmin as any)
      .from('queries')
      .upsert(queryRecords, { onConflict: 'product_id,query_text' })
      .select();

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Queries] Error saving:', error);
      }
      return NextResponse.json(
        { error: 'Failed to save queries', details: error.message },
        { status: 500 }
      );
    }

    const now = new Date();
    const batchName = `Batch - ${now.toISOString().replace('T', ' ').slice(0, 16)} UTC`;

    const { data: batch, error: batchCreateError } = await (supabaseAdmin as any)
      .from('query_batches')
      .insert({
        user_id: userId,
        product_id: productId,
        name: batchName,
      })
      .select()
      .single();

    if (batchCreateError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Queries] Error creating batch:', batchCreateError);
      }
      return NextResponse.json(
        { error: 'Failed to create batch', details: batchCreateError.message },
        { status: 500 }
      );
    }

    const linkRecords = (data || []).map((row: any) => ({
      batch_id: batch.id,
      query_id: row.id,
    }));

    const { error: linkError } = await (supabaseAdmin as any)
      .from('batch_queries')
      .insert(linkRecords);

    if (linkError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Queries] Error linking queries to batch:', linkError);
      }
      return NextResponse.json(
        { error: 'Failed to link queries to batch', details: linkError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      batch,
      batchId: batch.id,
      queries: data,
      googleCount: finalGoogleQueries.length,
      perplexityCount: finalPerplexityQueries.length,
    });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Queries] POST error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update a specific query text
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, productId, oldQueryText, newQueryText } = body;

    if (!userId || !productId || !oldQueryText || !newQueryText) {
      return NextResponse.json(
        { error: 'User ID, Product ID, old query text, and new query text are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // Find and update the query by matching the old text
    const { data, error } = await (supabaseAdmin as any)
      .from('queries')
      .update({ query_text: newQueryText })
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('query_text', oldQueryText)
      .select();

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Queries] Error updating:', error);
      }
      return NextResponse.json(
        { error: 'Failed to update query', details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Query not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, query: data[0] });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Queries] PUT error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete queries for a product
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const userId = searchParams.get('userId');

    if (!productId || !userId) {
      return NextResponse.json(
        { error: 'Product ID and User ID are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    const { error } = await supabaseAdmin
      .from('queries')
      .delete()
      .eq('product_id', productId)
      .eq('user_id', userId);

    if (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Queries] Error deleting:', error);
      }
      return NextResponse.json(
        { error: 'Failed to delete queries', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Queries] DELETE error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
