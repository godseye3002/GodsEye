import { useState, useEffect, useCallback } from 'react';
import { SovEngine, SovProgressStatus, checkLatestSovProgress } from '@/lib/sovProgressCheck';

interface UseSovProgressCheckOptions {
  productId: string;
  engine: SovEngine;
  pollingInterval?: number; // in milliseconds, default 5000ms (5 seconds)
  autoPoll?: boolean; // whether to automatically poll when processing
}

export function useSovProgressCheck({
  productId,
  engine,
  pollingInterval = 5000,
  autoPoll = true
}: UseSovProgressCheckOptions) {
  const [progress, setProgress] = useState<SovProgressStatus>({
    status: 'waiting_for_data',
    totalScrapedCount: 0,
    completedAnalysisCount: 0,
    progressPercentage: 0,
    message: 'Checking progress...'
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const checkProgress = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await checkLatestSovProgress(productId, engine);
      setProgress(result);
      
      // Auto-polling logic
      if (autoPoll && result.status === 'processing') {
        setIsPolling(true);
      } else {
        setIsPolling(false);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsPolling(false);
    } finally {
      setIsLoading(false);
    }
  }, [productId, engine, autoPoll]);

  // Manual refresh function
  const refresh = useCallback(() => {
    checkProgress();
  }, [checkProgress]);

  // Stop polling function
  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  // Initial check and polling effect
  useEffect(() => {
    checkProgress();
  }, [checkProgress]);

  // Polling effect
  useEffect(() => {
    if (!isPolling || !autoPoll) {
      return;
    }

    const interval = setInterval(() => {
      checkProgress();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [isPolling, pollingInterval, checkProgress, autoPoll]);

  return {
    progress,
    isLoading,
    error,
    isPolling,
    refresh,
    stopPolling
  };
}

/**
 * Hook for manual progress checking (no auto-polling)
 */
export function useSovProgressCheckManual(productId: string, engine: SovEngine) {
  return useSovProgressCheck({
    productId,
    engine,
    autoPoll: false
  });
}
