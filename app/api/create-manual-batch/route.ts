import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const { userId, productId, batchName, queries } = await request.json();

        if (!userId || !productId || !Array.isArray(queries) || queries.length === 0) {
            return NextResponse.json(
                { error: 'User ID, Product ID, and a non-empty list of queries are required' },
                { status: 400 }
            );
        }

        // Validate ChatGPT pipeline access
        if (queries.some((q: any) => q.engine === 'chatgpt') && process.env.CHATGPT_PIPELINE !== 'true') {
            return NextResponse.json(
                { error: 'ChatGPT pipeline is currently disabled' },
                { status: 403 }
            );
        }

        const supabaseAdmin = getSupabaseAdminClient();

        // 1. Prepare query records
        // queries is expected to be an array of { text: string, engine: string }
        const queryRecords = queries.map((q: any) => ({
            user_id: userId,
            product_id: productId,
            query_text: q.text,
            priority: 1,
            google_status: q.engine === 'google' ? 'pending' : 'not_applicable',
            perplexity_status: q.engine === 'perplexity' ? 'pending' : 'not_applicable',
            chatgpt_status: q.engine === 'chatgpt' ? 'pending' : 'not_applicable',
            suggested_engine: q.engine,
        }));

        // 2. Save Queries to DB (upsert handle potential repeats)
        const { data: savedQueries, error: saveError } = await (supabaseAdmin as any)
            .from('queries')
            .upsert(queryRecords, { onConflict: 'product_id,query_text' })
            .select();

        if (saveError) {
            console.error("Error saving manual queries", saveError);
            return NextResponse.json({ error: 'Failed to save queries', details: saveError.message }, { status: 500 });
        }

        // 3. Create New Batch
        const finalBatchName = batchName || `Manual Batch - ${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC`;

        const { data: batch, error: batchError } = await (supabaseAdmin as any)
            .from('query_batches')
            .insert({
                user_id: userId,
                product_id: productId,
                name: finalBatchName
            })
            .select()
            .single();

        if (batchError) {
            return NextResponse.json({ error: 'Failed to create batch', details: batchError.message }, { status: 500 });
        }

        // 4. Link Queries to Batch in `batch_queries`
        const linkRecords = (savedQueries || []).map((q: any) => ({
            batch_id: batch.id,
            query_id: q.id
        }));

        const { error: linkError } = await (supabaseAdmin as any)
            .from('batch_queries')
            .insert(linkRecords);

        if (linkError) {
            return NextResponse.json({ error: 'Failed to link queries', details: linkError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            batch,
            queries: savedQueries
        });

    } catch (error: any) {
        console.error('[Create Manual Batch] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    }
}
