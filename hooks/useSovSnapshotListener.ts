import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type SovEngine = 'google' | 'perplexity';
export type SovListenerStatus = 'processing' | 'completed';

export interface SovSnapshotRow {
  id: string;
  product_id: string;
  engine: SovEngine;
  analyzed_at: string;
  global_sov_score: number;
  citation_score: number;
  category_relevance: number;
  total_queries_analyzed: number;
  narrative_summary: string;
  [key: string]: any;
}

const STATUS_CACHE = new Map<string, SovListenerStatus>();

function getKey(productId: string, engine: SovEngine) {
  return productId ? `${engine}:${productId}` : '';
}

async function fetchCurrentSovStatus(productId: string, engine: SovEngine): Promise<SovListenerStatus> {
  try {
    const { data, error } = await supabase
      .from('sov_product_snapshots')
      .select('status')
      .eq('product_id', productId)
      .eq('engine', engine)
      .eq('status', 'processing')
      .single();
    
    if (error || !data) {
      return 'completed';
    }
    
    return 'processing';
  } catch (err) {
    console.warn('[useSovSnapshotListener] Error fetching current status', err);
    return 'completed';
  }
}

export function useSovSnapshotListener(productId: string, engine: SovEngine) {
  const key = useMemo(() => getKey(productId, engine), [productId, engine]);

  const [eventNonce, setEventNonce] = useState(0);

  const [status, setStatus] = useState<SovListenerStatus>(() => {
    if (!key) return 'completed';
    return STATUS_CACHE.get(key) ?? 'completed';
  });

  const markProcessing = useCallback(() => {
    setStatus('processing');
    if (key) STATUS_CACHE.set(key, 'processing');
  }, [key]);

  const markCompleted = useCallback(() => {
    setStatus('completed');
    if (key) STATUS_CACHE.set(key, 'completed');
  }, [key]);

  useEffect(() => {
    if (!productId) return;

    // First check cache, then fetch current status from database
    const cached = key ? STATUS_CACHE.get(key) : undefined;
    if (cached) {
      setStatus(cached);
    } else {
      // If no cache, fetch from database to ensure correct initial state
      fetchCurrentSovStatus(productId, engine).then((dbStatus) => {
        setStatus(dbStatus);
        if (key) STATUS_CACHE.set(key, dbStatus);
      });
    }

    const channel = supabase
      .channel(`sov-snapshot-${engine}-${productId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sov_product_snapshots',
          filter: `product_id=eq.${productId}`,
        },
        (payload) => {
          const row = payload.new as SovSnapshotRow | undefined;
          if (!row) return;
          if (row.engine !== engine) return;
          markCompleted();
          setEventNonce((n) => n + 1);
        }
      )
      .subscribe((s) => {
        if (s === 'SUBSCRIBED') {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[useSovSnapshotListener] Subscribed', { productId, engine });
          }
        }
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[useSovSnapshotListener] Error removing channel', { err, productId, engine });
        }
      }
    };
  }, [productId, engine, key, markCompleted]);

  return {
    status,
    eventNonce,
    setStatus,
    markProcessing,
    markCompleted,
  };
}
