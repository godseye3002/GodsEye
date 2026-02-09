import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { checkLatestSovProgress } from '@/lib/sovProgressCheck';

export type SovEngine = 'google' | 'perplexity';
export type SovListenerStatus = 'processing' | 'completed';

interface SovSnapshotRow {
  id: string;
  product_id: string;
  engine: SovEngine;
  analyzed_at: string;
  global_sov_score: number;
  citation_score: number;
  category_relevance: number;
  total_queries_analyzed: number;
  narrative_summary: string;
  [key: string]: unknown;
}

const STATUS_CACHE = new Map<string, SovListenerStatus>();

function getKey(productId: string, engine: SovEngine) {
  return productId ? `${engine}:${productId}` : '';
}

async function fetchCurrentSovStatus(productId: string, engine: SovEngine): Promise<SovListenerStatus> {
  try {
    console.log('🔍 [SOV Listener] Checking status for:', { productId, engine });
    
    // Use our new progress logic instead of non-existent status column
    const { checkLatestSovProgress } = await import('@/lib/sovProgressCheck');
    const progress = await checkLatestSovProgress(productId, engine);
    
    console.log('📊 [SOV Listener] Progress result:', {
      status: progress.status,
      totalScrapedCount: progress.totalScrapedCount,
      completedAnalysisCount: progress.completedAnalysisCount,
      progressPercentage: progress.progressPercentage,
      message: progress.message
    });
    
    // Map progress status to listener status
    if (progress.status === 'processing') {
      console.log('⏳ [SOV Listener] Status: PROCESSING - Analysis in progress');
      return 'processing';
    }
    
    console.log('✅ [SOV Listener] Status: COMPLETED - Analysis finished');
    return 'completed';
  } catch (err) {
    console.error('❌ [SOV Listener] Error fetching current status:', {
      error: err,
      productId,
      engine,
      timestamp: new Date().toISOString()
    });
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
          
          console.log('🔄 [SOV Listener] Real-time change detected, checking completion status...');
          
          // Check if analysis is actually complete using progress logic
          checkLatestSovProgress(productId, engine).then((progress) => {
            const actualStatus: SovListenerStatus = progress.status === 'complete' ? 'completed' : 'processing';
            console.log('📊 [SOV Listener] Actual completion status:', actualStatus, 'Progress:', progress);
            if (actualStatus === 'completed') {
              markCompleted();
            } else {
              markProcessing();
            }
            setEventNonce((n) => n + 1);
          }).catch((err) => {
            console.error('❌ [SOV Listener] Error checking completion status:', err);
            markProcessing();
          });
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
          console.warn('[SovSnapshotListener] Error removing channel:', {
            error: err,
            productId,
            engine,
            timestamp: new Date().toISOString()
          });
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
