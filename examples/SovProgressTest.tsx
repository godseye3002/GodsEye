import React from 'react';
import { SovProgressIndicator } from '@/components/SovProgressIndicator';
import { SovProgressDebug } from '@/components/SovProgressDebug';
import { SovProgressStatus, checkLatestSovProgress } from '@/lib/sovProgressCheck';

// Test component - Add this to your page temporarily to debug
export function SovProgressTest({ 
  productId, 
  engine 
}: { 
  productId: string; 
  engine: 'google' | 'perplexity'; 
}) {
  const [progress, setProgress] = React.useState<SovProgressStatus>({
    status: 'waiting_for_data',
    totalScrapedCount: 0,
    completedAnalysisCount: 0,
    progressPercentage: 0,
    message: 'Initializing...'
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showDebug, setShowDebug] = React.useState(true);

  const checkProgress = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Checking SOV progress for:', { productId, engine });
      const result = await checkLatestSovProgress(productId, engine);
      console.log('📊 Progress result:', result);
      setProgress(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Progress check failed:', err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [productId, engine]);

  // Auto-polling effect
  React.useEffect(() => {
    checkProgress();
    
    if (progress.status === 'processing') {
      console.log('⏰ Starting polling for processing status...');
      const interval = setInterval(() => {
        console.log('🔄 Polling...');
        checkProgress();
      }, 5000);
      return () => {
        console.log('⏹️ Stopping polling');
        clearInterval(interval);
      };
    }
  }, [checkProgress, progress.status]);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>SOV Progress Test Component</h3>
        <p><strong>Product ID:</strong> {productId}</p>
        <p><strong>Engine:</strong> {engine}</p>
        <p><strong>Status:</strong> {progress.status}</p>
        <p><strong>Message:</strong> {progress.message}</p>
        <p><strong>Progress:</strong> {progress.progressPercentage}% ({progress.completedAnalysisCount}/{progress.totalScrapedCount})</p>
        <button onClick={() => setShowDebug(!showDebug)}>
          {showDebug ? 'Hide' : 'Show'} Debug Info
        </button>
        <button onClick={checkProgress} disabled={isLoading} style={{ marginLeft: '10px' }}>
          {isLoading ? 'Checking...' : 'Manual Check'}
        </button>
      </div>

      {/* Progress Indicator */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Progress Indicator (Compact):</h4>
        <SovProgressIndicator
          progress={progress}
          isLoading={isLoading}
          error={error}
          onRefresh={checkProgress}
          compact={true}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h4>Progress Indicator (Full):</h4>
        <SovProgressIndicator
          progress={progress}
          isLoading={isLoading}
          error={error}
          onRefresh={checkProgress}
        />
      </div>

      {/* Debug Information */}
      {showDebug && (
        <div style={{ marginBottom: '20px' }}>
          <h4>Debug Information:</h4>
          <SovProgressDebug productId={productId} engine={engine} />
        </div>
      )}

      {/* Console Instructions */}
      <div style={{ padding: '10px', backgroundColor: '#e8f4fd', borderRadius: '8px' }}>
        <h4>Debug Instructions:</h4>
        <ol>
          <li>Open browser console (F12)</li>
          <li>Look for logs with 🔍, 📊, ❌, ⏰, 🔄, ⏹️ emojis</li>
          <li>Check the Debug Information section above</li>
          <li>Verify the status logic matches the raw data counts</li>
          <li>Use "Manual Check" button to test refresh functionality</li>
        </ol>
        <p><strong>Expected behavior:</strong></p>
        <ul>
          <li>If no scraped data = "Waiting for Data" + "Check Status" button</li>
          <li>If scraped data &gt; insights = "Processing..." + "Refresh Analysis" button</li>
          <li>If scraped data = insights = "Complete" + "Up to date" button</li>
        </ul>
      </div>
    </div>
  );
}

// Usage example:
// Add this to your page temporarily:
// &lt;SovProgressTest productId="your-product-id" engine="google" /&gt;
