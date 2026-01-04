import { createHash } from 'crypto';
import { getSupabaseAdminClient } from '@/lib/supabase';

export type AnalysisSource = 'google' | 'perplexity';

const SOURCE_CONFIG: Record<
  AnalysisSource,
  { table: 'product_analysis_google' | 'product_analysis_perplexity'; hashColumn: 'deep_analysis_google_hash' | 'deep_analysis_perplexity_hash' }
> = {
  google: {
    table: 'product_analysis_google',
    hashColumn: 'deep_analysis_google_hash',
  },
  perplexity: {
    table: 'product_analysis_perplexity',
    hashColumn: 'deep_analysis_perplexity_hash',
  },
};

export interface AnalysisHashStatus {
  upToDate: boolean;
  computedHash: string | null;
  storedHash: string | null;
  hasSourceRows: boolean;
}

export function computeAnalysisHashFromIds(ids: (string | number)[]): string | null {
  if (!ids || ids.length === 0) {
    return null;
  }

  const sorted = ids.map((id) => String(id)).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const payload = sorted.join(',');

  return createHash('sha256').update(payload).digest('hex');
}

export async function isAnalysisUpToDate(productId: string, source: AnalysisSource): Promise<AnalysisHashStatus> {
  const supabaseAdmin = getSupabaseAdminClient();
  const { table, hashColumn } = SOURCE_CONFIG[source];

  try {
    const { data: sourceRows, error: sourceError } = await (supabaseAdmin as any)
      .from(table)
      .select('id')
      .eq('product_id', productId);

    if (sourceError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[AnalysisHash] Failed to load ${table} rows for product ${productId}:`, sourceError);
      }
      return { upToDate: false, computedHash: null, storedHash: null, hasSourceRows: false };
    }

    const ids = Array.isArray(sourceRows) ? sourceRows.map((row: any) => row.id) : [];
    const computedHash = computeAnalysisHashFromIds(ids);

    if (!computedHash) {
      return { upToDate: false, computedHash: null, storedHash: null, hasSourceRows: false };
    }

    const { data: productRow, error: productError } = await (supabaseAdmin as any)
      .from('products')
      .select(hashColumn)
      .eq('id', productId)
      .single();

    if (productError) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[AnalysisHash] Failed to load product ${productId}:`, productError);
      }
      return { upToDate: false, computedHash, storedHash: null, hasSourceRows: ids.length > 0 };
    }

    const storedHash = productRow?.[hashColumn] ?? null;
    const upToDate = Boolean(storedHash && storedHash === computedHash);

    return {
      upToDate,
      computedHash,
      storedHash,
      hasSourceRows: ids.length > 0,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[AnalysisHash] Unexpected error verifying analysis hash:', error);
    }
    return { upToDate: false, computedHash: null, storedHash: null, hasSourceRows: false };
  }
}
