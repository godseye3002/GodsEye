import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

export type AnalysisSource = 'google' | 'perplexity';
export type AnalysisStatus = 'processing' | 'completed';

const STATUS_CACHE = new Map<string, AnalysisStatus>();
const DATA_CACHE = new Map<string, any>();

const TABLE_BY_SOURCE: Record<AnalysisSource, 'product_analysis_dna_google' | 'product_analysis_dna_perplexity'> = {
  google: 'product_analysis_dna_google',
  perplexity: 'product_analysis_dna_perplexity',
};

interface UseAnalysisListenerResult<T = any> {
  status: AnalysisStatus;
  data: T | null;
  setStatus: (next: AnalysisStatus) => void;
}

export function useAnalysisListener<T = any>(productId: string, source: AnalysisSource): UseAnalysisListenerResult<T> {
  const key = useMemo(() => (productId ? `${source}:${productId}` : ''), [productId, source]);

  const [status, setStatus] = useState<AnalysisStatus>(() => {
    if (!key) return 'completed';
    return STATUS_CACHE.get(key) ?? 'completed';
  });

  const [data, setData] = useState<T | null>(() => {
    if (!key) return null;
    return (DATA_CACHE.get(key) as T | undefined) ?? null;
  });

  const table = useMemo(() => TABLE_BY_SOURCE[source], [source]);

  const handleStatusUpdate = useCallback(
    (nextStatus: AnalysisStatus) => {
      setStatus(nextStatus);
      if (key) {
        STATUS_CACHE.set(key, nextStatus);
      }
    },
    [key]
  );

  useEffect(() => {
    if (!productId) {
      return;
    }

    // Restore last known state for this product+source (prevents losing state on engine switch)
    setData(((key && DATA_CACHE.get(key)) as T | undefined) ?? null);
    setStatus(key ? (STATUS_CACHE.get(key) ?? 'completed') : 'completed');

    const channel = supabase
      .channel(`analysis-${source}-${productId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table,
          filter: `product_id=eq.${productId}`,
        },
        (payload) => {
          setData(payload.new as T);
          if (key) {
            DATA_CACHE.set(key, payload.new);
          }
          setStatus('completed');
          if (key) {
            STATUS_CACHE.set(key, 'completed');
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[useAnalysisListener] Subscribed to', table, productId);
          }
        }
        // Silently handle all other statuses - these are expected behaviors
        // No need to log warnings as they're normal network/connection events
      });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        // Silently handle channel removal errors
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[AnalysisListener] Error removing channel:', {
            error: err,
            table,
            productId,
            timestamp: new Date().toISOString()
          });
        }
      }
    };
  }, [productId, key, table]);

  return {
    status,
    data,
    setStatus: handleStatusUpdate,
  };
}
