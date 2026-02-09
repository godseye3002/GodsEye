import React from 'react';
import { Box, Typography, LinearProgress, Button, Chip, Tooltip } from '@mui/joy';
import { Refresh as RefreshIcon, CheckCircle as CheckCircleIcon, AccessTime as ClockIcon } from '@mui/icons-material';
import { SovProgressStatus } from '@/lib/sovProgressCheck';

interface SovProgressIndicatorProps {
  progress: SovProgressStatus;
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  compact?: boolean; // For compact display mode
}

export function SovProgressIndicator({
  progress,
  isLoading = false,
  error = null,
  onRefresh,
  compact = false
}: SovProgressIndicatorProps) {
  if (process.env.NODE_ENV === 'development') {
    console.log('🎨 [SovProgressIndicator] Rendering with progress:', {
      status: progress.status,
      message: progress.message,
      totalScrapedCount: progress.totalScrapedCount,
      completedAnalysisCount: progress.completedAnalysisCount,
      progressPercentage: progress.progressPercentage,
      compact
    });
  }

  const getStatusColor = (status: SovProgressStatus['status']) => {
    switch (status) {
      case 'complete':
        return 'success';
      case 'processing':
        return 'warning';
      case 'waiting_for_data':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const getStatusIcon = (status: SovProgressStatus['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircleIcon sx={{ fontSize: 16 }} />;
      case 'processing':
        return <ClockIcon sx={{ fontSize: 16 }} />;
      case 'waiting_for_data':
        return <ClockIcon sx={{ fontSize: 16 }} />;
      default:
        return <ClockIcon sx={{ fontSize: 16 }} />;
    }
  };

  console.log('🔘 [SovProgressIndicator] Button conditions:', {
    isComplete: progress.status === 'complete',
    isProcessing: progress.status === 'processing',
    isWaiting: progress.status === 'waiting_for_data',
    hasOnRefresh: !!onRefresh
  });

  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Chip
          size="sm"
          color={getStatusColor(progress.status)}
          variant="soft"
          startDecorator={getStatusIcon(progress.status)}
        >
          {progress.message}
        </Chip>
        
        {progress.status === 'waiting_for_data' && onRefresh && (
          <>
            {console.log('🔘 [SovProgressIndicator] Rendering "Check Status" button')}
            <Button
              size="sm"
              variant="outlined"
              color="neutral"
              onClick={onRefresh}
              loading={isLoading}
              startDecorator={<RefreshIcon sx={{ fontSize: 14 }} />}
              sx={{
                minWidth: '120px'
              }}
            >
              Check Status
            </Button>
          </>
        )}
        
        {progress.status === 'processing' && onRefresh && (
          <>
            {console.log('🔄 [SovProgressIndicator] Rendering "Refresh Analysis" button')}
            <Button
              size="sm"
              variant="solid"
              color="primary"
              onClick={onRefresh}
              loading={isLoading}
              startDecorator={<RefreshIcon sx={{ fontSize: 14 }} />}
              sx={{
                minWidth: '120px',
                '&:hover': {
                  bgcolor: 'primary.solidActiveBg'
                }
              }}
            >
              Refresh Analysis
            </Button>
          </>
        )}
        
        {progress.status === 'complete' && (
          <>
            {console.log('✅ [SovProgressIndicator] Rendering "Up to date" button')}
            <Button
              size="sm"
              variant="soft"
              color="success"
              disabled
              startDecorator={<CheckCircleIcon sx={{ fontSize: 14 }} />}
              sx={{
                minWidth: '120px',
                cursor: 'not-allowed',
                opacity: 0.8
              }}
              title="Analysis is up to date"
            >
              Up to date
            </Button>
          </>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography level="title-md" sx={{ fontWeight: 600 }}>
          SOV Analysis Progress
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="sm"
            color={getStatusColor(progress.status)}
            variant="soft"
            startDecorator={getStatusIcon(progress.status)}
          >
            {progress.message}
          </Chip>
          
          {progress.status === 'waiting_for_data' && onRefresh && (
            <>
              {console.log('🔘 [SovProgressIndicator] Full: Rendering "Check Status" button')}
              <Button
                size="sm"
                variant="outlined"
                color="neutral"
                onClick={onRefresh}
                loading={isLoading}
                startDecorator={<RefreshIcon sx={{ fontSize: 14 }} />}
                sx={{
                  minWidth: '140px'
                }}
              >
                Check Status
              </Button>
            </>
          )}
          
          {progress.status === 'processing' && onRefresh && (
            <>
              {console.log('🔄 [SovProgressIndicator] Full: Rendering "Refresh Analysis" button')}
              <Button
                size="sm"
                variant="solid"
                color="primary"
                onClick={onRefresh}
                loading={isLoading}
                startDecorator={<RefreshIcon sx={{ fontSize: 14 }} />}
                sx={{
                  minWidth: '140px',
                  '&:hover': {
                    bgcolor: 'primary.solidActiveBg'
                  }
                }}
              >
                Refresh Analysis
              </Button>
            </>
          )}
          
          {progress.status === 'complete' && (
            <>
              {console.log('✅ [SovProgressIndicator] Full: Rendering "Up to date" button')}
              <Button
                size="sm"
                variant="soft"
                color="success"
                disabled
                startDecorator={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                sx={{
                  minWidth: '140px',
                  cursor: 'not-allowed',
                  opacity: 0.8
                }}
                title="Analysis is up to date"
              >
                Up to date
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Error Display */}
      {error && (
        <Box sx={{ mb: 2, p: 2, bgcolor: 'danger.50', borderRadius: 'sm' }}>
          <Typography level="body-sm" color="danger">
            Error: {error}
          </Typography>
        </Box>
      )}

      {/* Progress Details */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography level="body-sm" color="neutral">
            Analysis Progress
          </Typography>
          <Typography level="body-sm" color="neutral">
            {progress.completedAnalysisCount} / {progress.totalScrapedCount} queries
          </Typography>
        </Box>
        
        <LinearProgress
          determinate
          value={progress.progressPercentage}
          color={progress.status === 'complete' ? 'success' : 'primary'}
          sx={{ height: 8, borderRadius: 4 }}
        />
        
        <Typography level="body-xs" color="neutral" sx={{ mt: 1, textAlign: 'center' }}>
          {progress.progressPercentage}% Complete
        </Typography>
      </Box>

      {/* Status Messages */}
      <Box sx={{ p: 2, bgcolor: 'background.level1', borderRadius: 'sm' }}>
        {progress.status === 'waiting_for_data' && (
          <Typography level="body-sm" color="neutral">
            Waiting for scraped data to be available. This may take a few moments...
          </Typography>
        )}
        
        {progress.status === 'processing' && (
          <Typography level="body-sm" color="neutral">
            SOV analysis is currently in progress. The system is analyzing the scraped data and generating insights.
          </Typography>
        )}
        
        {progress.status === 'complete' && (
          <Typography level="body-sm" color="success">
            SOV analysis is complete! All queries have been processed and insights are available.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
