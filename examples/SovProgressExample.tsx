import React from 'react';
import { SovProgressIndicator } from '@/components/SovProgressIndicator';
import { SovProgressStatus, checkLatestSovProgress } from '@/lib/sovProgressCheck';

// Example 1: Direct function call with manual state management
export function SovProgressWithAutoPoll({ productId, engine }: { productId: string; engine: 'google' | 'perplexity' }) {
  const [progress, setProgress] = React.useState<SovProgressStatus>({
    status: 'waiting_for_data',
    totalScrapedCount: 0,
    completedAnalysisCount: 0,
    progressPercentage: 0,
    message: 'Checking progress...'
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const checkProgress = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await checkLatestSovProgress(productId, engine);
      setProgress(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [productId, engine]);

  // Auto-polling effect
  React.useEffect(() => {
    checkProgress();
    
    if (progress.status === 'processing') {
      const interval = setInterval(checkProgress, 5000);
      return () => clearInterval(interval);
    }
  }, [checkProgress, progress.status]);

  return (
    <SovProgressIndicator
      progress={progress}
      isLoading={isLoading}
      error={error}
      onRefresh={checkProgress}
    />
  );
}

// Example 2: Compact mode for inline display
export function CompactSovProgress({ productId, engine }: { productId: string; engine: 'google' | 'perplexity' }) {
  const [progress, setProgress] = React.useState<SovProgressStatus>({
    status: 'waiting_for_data',
    totalScrapedCount: 0,
    completedAnalysisCount: 0,
    progressPercentage: 0,
    message: 'Checking progress...'
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const checkProgress = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await checkLatestSovProgress(productId, engine);
      setProgress(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [productId, engine]);

  return (
    <SovProgressIndicator
      progress={progress}
      isLoading={isLoading}
      error={error}
      onRefresh={checkProgress}
      compact={true}
    />
  );
}

// Example 3: Manual progress check (no hook)
export function ManualSovProgress({ snapshotId, engine }: { snapshotId: string; engine: 'google' | 'perplexity' }) {
  // You would manually call checkSovProgress when needed
  const [progress, setProgress] = React.useState<SovProgressStatus | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleCheck = async () => {
    setLoading(true);
    try {
      const { checkSovProgress } = await import('@/lib/sovProgressCheck');
      const result = await checkSovProgress(snapshotId, engine);
      setProgress(result);
    } catch (error) {
      console.error('Progress check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handleCheck} disabled={loading}>
        Check Progress
      </button>
      {progress && (
        <SovProgressIndicator
          progress={progress}
          isLoading={loading}
          onRefresh={handleCheck}
        />
      )}
    </div>
  );
}

// Example 4: Integration with existing SOVPerformanceCard
export function EnhancedSOVPerformanceCard({ 
  productId, 
  engine, 
  onDeepAnalysisClick, 
  isDeepAnalysisActive, 
  product 
}: any) {
  const [progress, setProgress] = React.useState<SovProgressStatus>({
    status: 'waiting_for_data',
    totalScrapedCount: 0,
    completedAnalysisCount: 0,
    progressPercentage: 0,
    message: 'Checking progress...'
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const checkProgress = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await checkLatestSovProgress(productId, engine);
      setProgress(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [productId, engine]);

  // Auto-polling effect
  React.useEffect(() => {
    checkProgress();
    
    if (progress.status === 'processing') {
      const interval = setInterval(checkProgress, 5000);
      return () => clearInterval(interval);
    }
  }, [checkProgress, progress.status]);

  // Show progress indicator when analysis is processing
  if (progress.status === 'processing') {
    return (
      <div className="sov-progress-container">
        <SovProgressIndicator
          progress={progress}
          isLoading={isLoading}
          error={error}
          onRefresh={checkProgress}
          compact={true}
        />
      </div>
    );
  }

  // Show normal SOV card when complete or no data
  return (
    <div className="sov-normal-container">
      {/* Your existing SOVPerformanceCard component */}
      <div>Normal SOV card content here</div>
    </div>
  );
}
