import React from 'react';
import { Box, Typography, Card, CardContent, Divider, Chip } from '@mui/joy';
import { SovProgressStatus, checkLatestSovProgress, getLatestSnapshotId } from '@/lib/sovProgressCheck';

interface SovProgressDebugProps {
  productId: string;
  engine: 'google' | 'perplexity';
}

export function SovProgressDebug({ productId, engine }: SovProgressDebugProps) {
  const [debugInfo, setDebugInfo] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const runDebugCheck = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Step 1: Get latest snapshot ID
      const latestSnapshotId = await getLatestSnapshotId(productId);
      
      // Step 2: Get progress status
      const progress = await checkLatestSovProgress(productId, engine);
      
      // Step 3: Get raw data counts for verification
      const { supabase } = await import('@/lib/supabase');
      
      const analysisTable = engine === 'google' ? 'product_analysis_google' : 'product_analysis_perplexity';
      const queryCol = engine === 'google' ? 'search_query' : 'optimization_prompt';
      
      // Get scraped data
      const { data: scrapedData, error: scrapedError } = await supabase
        .from(analysisTable)
        .select('id, snapshot_id')
        .eq('snapshot_id', latestSnapshotId || '');
      
      // Get insights data
      const scrapedIds = scrapedData?.map(row => row.id) || [];
      let insightsData: any[] = [];
      
      if (scrapedIds.length > 0) {
        const { data: insights, error: insightsError } = await supabase
          .from('sov_query_insights')
          .select('id, analysis_id')
          .in('analysis_id', scrapedIds)
          .eq('engine', engine);
        
        insightsData = insights || [];
      }
      
      setDebugInfo({
        productId,
        engine,
        latestSnapshotId,
        progress,
        rawCounts: {
          scrapedDataCount: scrapedData?.length || 0,
          scrapedIds: scrapedIds,
          insightsDataCount: insightsData?.length || 0,
          insightsIds: insightsData?.map(i => i.analysis_id) || []
        },
        errors: {
          scrapedError,
          insightsError: null
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    runDebugCheck();
  }, [productId, engine]);

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography level="body-sm">Loading debug information...</Typography>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography level="body-sm" color="danger">Error: {error}</Typography>
        </CardContent>
      </Card>
    );
  }

  if (!debugInfo) {
    return (
      <Card>
        <CardContent>
          <Typography level="body-sm">No debug information available</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography level="title-md" sx={{ mb: 2 }}>
          SOV Progress Debug Information
        </Typography>
        
        {/* Basic Info */}
        <Box sx={{ mb: 2 }}>
          <Typography level="body-sm" fontWeight="bold">
            Product ID: {debugInfo.productId}
          </Typography>
          <Typography level="body-sm" fontWeight="bold">
            Engine: {debugInfo.engine}
          </Typography>
          <Typography level="body-sm" fontWeight="bold">
            Latest Snapshot ID: {debugInfo.latestSnapshotId || 'None'}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Progress Status */}
        <Box sx={{ mb: 2 }}>
          <Typography level="body-sm" fontWeight="bold" sx={{ mb: 1 }}>
            Progress Status:
          </Typography>
          <Chip
            size="sm"
            color={
              debugInfo.progress.status === 'complete' ? 'success' :
              debugInfo.progress.status === 'processing' ? 'warning' : 'neutral'
            }
          >
            {debugInfo.progress.status}
          </Chip>
          <Typography level="body-xs" sx={{ mt: 1 }}>
            Message: {debugInfo.progress.message}
          </Typography>
          <Typography level="body-xs">
            Total Scraped: {debugInfo.progress.totalScrapedCount}
          </Typography>
          <Typography level="body-xs">
            Completed Analysis: {debugInfo.progress.completedAnalysisCount}
          </Typography>
          <Typography level="body-xs">
            Progress: {debugInfo.progress.progressPercentage}%
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Raw Data Counts */}
        <Box sx={{ mb: 2 }}>
          <Typography level="body-sm" fontWeight="bold" sx={{ mb: 1 }}>
            Raw Data Verification:
          </Typography>
          <Typography level="body-xs">
            Scraped Data Count: {debugInfo.rawCounts.scrapedDataCount}
          </Typography>
          <Typography level="body-xs">
            Insights Data Count: {debugInfo.rawCounts.insightsDataCount}
          </Typography>
          
          {debugInfo.rawCounts.scrapedIds.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography level="body-xs" fontWeight="bold">
                Scraped IDs (first 5):
              </Typography>
              <Typography level="body-xs" sx={{ fontFamily: 'monospace', fontSize: '10px' }}>
                {debugInfo.rawCounts.scrapedIds.slice(0, 5).join(', ')}
                {debugInfo.rawCounts.scrapedIds.length > 5 ? '...' : ''}
              </Typography>
            </Box>
          )}
          
          {debugInfo.rawCounts.insightsIds.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography level="body-xs" fontWeight="bold">
                Insights IDs (first 5):
              </Typography>
              <Typography level="body-xs" sx={{ fontFamily: 'monospace', fontSize: '10px' }}>
                {debugInfo.rawCounts.insightsIds.slice(0, 5).join(', ')}
                {debugInfo.rawCounts.insightsIds.length > 5 ? '...' : ''}
              </Typography>
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Status Verification */}
        <Box sx={{ mb: 2 }}>
          <Typography level="body-sm" fontWeight="bold" sx={{ mb: 1 }}>
            Status Verification:
          </Typography>
          <Typography level="body-xs">
            ✓ Scraped Count = {debugInfo.rawCounts.scrapedDataCount}
          </Typography>
          <Typography level="body-xs">
            ✓ Insights Count = {debugInfo.rawCounts.insightsDataCount}
          </Typography>
          <Typography level="body-xs">
            ✓ Status Logic: {debugInfo.rawCounts.scrapedDataCount === 0 ? 'waiting_for_data' :
                           debugInfo.rawCounts.insightsDataCount < debugInfo.rawCounts.scrapedDataCount ? 'processing' : 'complete'}
          </Typography>
          <Typography level="body-xs">
            ✓ Expected Status: {debugInfo.rawCounts.scrapedDataCount === 0 ? 'waiting_for_data' :
                               debugInfo.rawCounts.insightsDataCount < debugInfo.rawCounts.scrapedDataCount ? 'processing' : 'complete'}
          </Typography>
          <Typography level="body-xs" color={debugInfo.progress.status === 
            (debugInfo.rawCounts.scrapedDataCount === 0 ? 'waiting_for_data' :
             debugInfo.rawCounts.insightsDataCount < debugInfo.rawCounts.scrapedDataCount ? 'processing' : 'complete') 
            ? 'success' : 'danger'}>
            {debugInfo.progress.status === 
              (debugInfo.rawCounts.scrapedDataCount === 0 ? 'waiting_for_data' :
               debugInfo.rawCounts.insightsDataCount < debugInfo.rawCounts.scrapedDataCount ? 'processing' : 'complete') 
              ? '✓ Status matches expected' : '✗ Status mismatch!'}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Actions */}
        <Box>
          <button onClick={runDebugCheck} style={{ padding: '8px 16px', fontSize: '12px' }}>
            Refresh Debug Info
          </button>
          <Typography level="body-xs" sx={{ mt: 1 }}>
            Last updated: {debugInfo.timestamp}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
