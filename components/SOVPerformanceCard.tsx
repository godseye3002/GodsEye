"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Card, Chip, Skeleton, Stack, Divider, Button, Tooltip, Alert } from "@mui/joy";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ReactMarkdown from "react-markdown";
import { triggerSovAnalysis } from "@/lib/sovAnalysisApi";
import { useSovSnapshotListener } from "@/hooks/useSovSnapshotListener";
import { OptimizedProduct } from "@/app/optimize/types";

interface SOVSnapshot {
  id: string;
  product_id: string;
  global_sov_score: number;
  citation_score: number;
  category_relevance: number;
  total_queries_analyzed: number;
  narrative_summary: string;
  engine: 'google' | 'perplexity';
  analyzed_at: string;
}

interface SOVPerformanceCardProps {
  productId: string;
  engine: 'google' | 'perplexity';
  onDeepAnalysisClick?: () => void;
  isDeepAnalysisActive?: boolean;
  product?: OptimizedProduct | null;
}

export default function SOVPerformanceCard({ productId, engine, onDeepAnalysisClick, isDeepAnalysisActive, product }: SOVPerformanceCardProps) {
  const [snapshot, setSnapshot] = useState<SOVSnapshot | null>(null);
  const [previousSnapshot, setPreviousSnapshot] = useState<SOVSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTriggeringAnalysis, setIsTriggeringAnalysis] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSovUpToDate, setIsSovUpToDate] = useState(false);

  const {
    status: liveSovStatus,
    eventNonce,
    markProcessing,
    markCompleted,
  } = useSovSnapshotListener(productId, engine);

  // Helper function to calculate growth/decline
  const calculateGrowth = (current: number, previous: number | null) => {
    if (previous === null) return null;
    const change = current - previous;

    // Avoid divide-by-zero. When previous is 0, show point change instead of %.
    if (previous === 0) {
      return {
        change,
        percentageChange: null as number | null,
        isGrowth: change > 0,
        isDecline: change < 0,
        isNeutral: change === 0,
        displayMode: 'points' as const,
      };
    }

    const percentageChange = (change / previous) * 100;
    return {
      change,
      percentageChange,
      isGrowth: change > 0,
      isDecline: change < 0,
      isNeutral: change === 0,
      displayMode: 'percent' as const,
    };
  };

  // Component to display score with growth indicator
  const ScoreWithGrowth = ({ current, previous, label, getColor }: { 
    current: number; 
    previous: number | null; 
    label: string; 
    getColor: (score: number) => string;
  }) => {
    const growth = calculateGrowth(current, previous);
    
    return (
      <Stack spacing={1} sx={{ flex: 1, alignItems: 'center' }}>
        <Typography level="body-sm" sx={{ 
          color: "rgba(162, 167, 180, 0.88)",
          fontSize: "0.875rem",
          fontWeight: 500,
          textAlign: "center",
        }}>
          {label}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 0.5 }}>
          <Typography level="h1" sx={{ 
            color: getColor(current),
            fontSize: "2.5rem",
            fontWeight: 700,
            lineHeight: 1,
            textAlign: "center",
          }}>
            {current}%
          </Typography>
          {growth && (
            <Typography level="body-xs" sx={{ 
              color: growth.isGrowth ? "#2ED47A" : growth.isDecline ? "#F44336" : "#A2A7B4",
              fontWeight: 600,
              fontSize: "0.875rem",
              pb: 0.5,
            }}>
              {growth.isNeutral
                ? (growth.displayMode === 'points' ? '→ +0' : '→ 0.0%')
                : growth.displayMode === 'points'
                  ? (growth.isGrowth
                    ? `↑ +${Math.abs(growth.change).toFixed(0)}`
                    : `↓ -${Math.abs(growth.change).toFixed(0)}`)
                  : (growth.isGrowth
                    ? `↑ ${Math.abs(growth.percentageChange ?? 0).toFixed(1)}%`
                    : `↓ ${Math.abs(growth.percentageChange ?? 0).toFixed(1)}%`)
              }
            </Typography>
          )}
        </Box>
        <Box sx={{ 
          width: "100%", 
          height: "4px", 
          backgroundColor: "rgba(46, 212, 122, 0.1)",
          borderRadius: "2px",
          overflow: "hidden",
        }}>
          <Box sx={{ 
            width: `${current}%`,
            height: "100%",
            backgroundColor: getColor(current),
            borderRadius: "2px",
          }} />
        </Box>
        {previous !== null && (
          <Typography level="body-xs" sx={{ 
            color: "rgba(162, 167, 180, 0.75)",
            fontSize: "0.75rem",
            textAlign: "center",
          }}>
            Previous: {previous}%
          </Typography>
        )}
      </Stack>
    );
  };

  const fetchSOVData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/sov?productId=${encodeURIComponent(productId)}&engine=${encodeURIComponent(engine)}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setSnapshot(null);
          setError('No Share of Voice data available for this product.');
        } else {
          setSnapshot(null);
          setError('Failed to load Share of Voice data.');
        }
        return;
      }

      const data = await response.json();

      if (data.latestSnapshot) {
        setSnapshot(data.latestSnapshot);
        setPreviousSnapshot(data.previousSnapshot);
        setError(null);
      } else {
        setSnapshot(null);
        setPreviousSnapshot(null);
        setError('No Share of Voice data available for this product.');
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[SOVPerformanceCard] Error fetching SOV data:', {
          error: err,
          productId,
          timestamp: new Date().toISOString()
        });
      }
      setSnapshot(null);
      setError('Failed to load Share of Voice data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!productId) return;
    fetchSOVData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, engine]);

  useEffect(() => {
    if (!productId) return;
    // Re-fetch when realtime reports a snapshot change for this product+engine
    fetchSOVData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventNonce]);

  // Check SOV progress to determine if up to date
  useEffect(() => {
    const checkSovProgress = async () => {
      if (!productId) return;
      
      try {
        const { checkLatestSovProgress } = await import('@/lib/sovProgressCheck');
        const progress = await checkLatestSovProgress(productId, engine);
        setIsSovUpToDate(progress.status === 'complete');
      } catch (error) {
        console.error('Failed to check SOV progress:', error);
        setIsSovUpToDate(false);
      }
    };

    checkSovProgress();
  }, [productId, engine, eventNonce]); // Re-check when snapshot updates

  const runSovAnalysis = async () => {
    if (!productId) return;
    if (isTriggeringAnalysis) return;

    setActionError(null);
    setActionSuccess(null);
    setIsTriggeringAnalysis(true);
    setIsSovUpToDate(false);
    markProcessing();

    const result = await triggerSovAnalysis({
      productId,
      engine,
      debug: process.env.NODE_ENV !== 'production',
    });

    if ('success' in result && result.success) {
      // If the upstream says no work was needed, show the specific message.
      if (result.message) {
        console.log('SOV Analysis message:', result.message);
        setActionSuccess(result.message + ' (No new queries found to analyze)');
        setIsSovUpToDate(true);
        markCompleted();
      } else {
        // Analysis was accepted. Snapshot update comes via realtime.
        setActionSuccess('Request submitted successfully. This may take a few minutes.');
        // Don't set isSovUpToDate here - wait for actual completion
      }
      setTimeout(() => setActionSuccess(null), 5000);
    } else {
      setActionError(result.error || 'Failed to start SOV analysis.');
      setIsSovUpToDate(false);
      // Don't mark as completed when analysis fails - keep it in processing state
      // This allows user to retry
    }

    setIsTriggeringAnalysis(false);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const getVisibilityColor = (score: number) => {
    if (score > 50) return "#2ED47A"; // Green
    if (score > 20) return "#FFA500"; // Yellow/Orange
    return "#F35B64"; // Red
  };

  const getTrustColor = (score: number) => {
    if (score > 70) return "#2ED47A"; // Green
    if (score > 40) return "#FFA500"; // Yellow/Orange
    return "#F35B64"; // Red
  };

  const getReputationColor = (score: number) => {
    if (score > 70) return "#2ED47A"; // Green (Positive)
    if (score > 30) return "#FFA500"; // Yellow/Orange (Neutral)
    return "#F35B64"; // Red (Negative)
  };

  const getEngineColor = (engine: string) => {
    return engine === 'google' ? "#4285F4" : "#2ED47A";
  };

  if (loading) {
    return (
      <Card
        variant="outlined"
        sx={{
          p: 3,
          backgroundColor: "rgba(17, 19, 24, 0.95)",
          border: "1px solid rgba(46, 212, 122, 0.14)",
          borderRadius: "12px",
          minWidth: "850px",
          minHeight: "400px",
        }}
      >
        <Stack spacing={2}>
          {/* Header skeleton */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Skeleton variant="text" level="h3" sx={{ width: "40%" }} />
            <Skeleton variant="text" level="body-sm" sx={{ width: "30%" }} />
          </Stack>
          
          {/* Metrics skeleton */}
          <Stack direction="row" spacing={2} sx={{ py: 2 }}>
            {[1, 2, 3].map((i) => (
              <Stack key={i} spacing={1} sx={{ flex: 1, alignItems: 'center' }}>
                <Skeleton variant="text" level="h2" sx={{ width: "60%" }} />
                <Skeleton variant="text" level="body-sm" sx={{ width: "80%" }} />
              </Stack>
            ))}
          </Stack>
          
          {/* Insight skeleton */}
          <Box sx={{ p: 2, backgroundColor: "rgba(46, 212, 122, 0.05)", borderRadius: "8px" }}>
            <Skeleton variant="text" level="body-md" sx={{ width: "90%", mb: 1 }} />
            <Skeleton variant="text" level="body-sm" sx={{ width: "60%" }} />
          </Box>
        </Stack>

        {actionSuccess && (
          <Alert
            variant="soft"
            color="success"
            sx={{
              mt: 2,
              backgroundColor: "rgba(46, 212, 122, 0.1)",
              color: "#2ED47A",
              border: "1px solid rgba(46, 212, 122, 0.3)",
              borderRadius: "8px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {actionSuccess}
          </Alert>
        )}

        {actionError && (
          <Alert
            variant="soft"
            color="danger"
            sx={{
              mt: 2,
              border: "1px solid rgba(243, 91, 100, 0.35)",
              backgroundColor: "rgba(243, 91, 100, 0.08)",
            }}
          >
            {actionError}
          </Alert>
        )}
      </Card>
    );
  }

  if (error || !snapshot) {
    return (
      <Card
        variant="outlined"
        sx={{
          p: 3,
          backgroundColor: "rgba(17, 19, 24, 0.95)",
          border: "1px solid rgba(243, 91, 100, 0.14)",
          borderRadius: "12px",
        }}
      >
        <Typography level="h3" sx={{ color: "#F35B64", mb: 2 }}>
          Share of Voice Data Unavailable
        </Typography>
        <Typography level="body-sm" sx={{ color: "rgba(162, 167, 180, 0.88)", mb: 1 }}>
          {error || 'No Share of Voice data available for this product.'}
        </Typography>
        
        <Typography level="body-sm" sx={{ color: "rgba(162, 167, 180, 0.7)", mb: 3, fontStyle: 'italic' }}>
          {!product?.analyses || product.analyses.length === 0 
            ? "You must first complete at least one Google or Perplexity analysis before running SOV analysis."
            : "Start SOV Analysis to see the Share Of Voice of your product"
          }
        </Typography>
        
        <Stack spacing={2}>
          <Button
            variant="solid"
            color="danger"
            startDecorator={<AnalyticsIcon />}
            onClick={runSovAnalysis}
            disabled={isTriggeringAnalysis || (!product?.analyses || product.analyses.length === 0)}
            sx={{
              width: "100%",
              backgroundColor: "#F35B64",
              color: "#0D0F14",
              "&:hover": {
                backgroundColor: "#E5494A",
                boxShadow: "0 6px 20px rgba(243, 91, 100, 0.3)",
              },
              fontWeight: 600,
              py: 1.5,
              fontSize: "1rem",
              "&:disabled": {
                backgroundColor: "rgba(243, 91, 100, 0.2)",
                color: "rgba(162, 167, 180, 0.5)",
                cursor: "not-allowed",
              },
            }}
          >
            {isTriggeringAnalysis ? 'Starting…' : 'Start SOV Analysis'}
          </Button>
          
          <Tooltip 
            title="Do 'Start SOV Analysis' to enable Deep Analysis" 
            placement="top"
            arrow
            enterDelay={100}
            leaveDelay={100}
          >
            <span style={{ width: "100%", display: "inline-block" }}>
              <Button
                variant="outlined"
                color="neutral"
                startDecorator={<TrendingUpIcon />}
                disabled
                sx={{
                  width: "100%",
                  borderColor: "rgba(46, 212, 122, 0.36)",
                  color: "#F2F5FA",
                  backgroundColor: "transparent",
                  cursor: "not-allowed",
                  fontWeight: 600,
                  py: 1.5,
                  fontSize: "1rem",
                  "&:disabled": {
                    borderColor: "rgba(46, 212, 122, 0.2)",
                    color: "rgba(162, 167, 180, 0.5)",
                    backgroundColor: "transparent",
                  },
                  "&:hover": {
                    backgroundColor: "transparent",
                    borderColor: "rgba(46, 212, 122, 0.2)",
                    color: "rgba(162, 167, 180, 0.5)",
                  },
                }}
              >
                Deep Analysis
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Card>
    );
  }

  return (
    <Card
      variant="outlined"
      sx={{
        p: 3,
        backgroundColor: "rgba(17, 19, 24, 0.95)",
        border: "1px solid rgba(46, 212, 122, 0.14)",
        borderRadius: "12px",
      }}
    >
      {/* Top Bar (Header) */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography level="h3" sx={{ color: "#F2F5FA", fontWeight: 600 }}>
            Share of Voice
          </Typography>
          <Chip
            variant="soft"
            size="sm"
            sx={{
              backgroundColor: getEngineColor(snapshot.engine),
              color: "#FFFFFF",
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            {snapshot.engine}
          </Chip>
        </Stack>
        
        <Stack direction="row" spacing={1} alignItems="center">
          <AccessTimeIcon sx={{ fontSize: 16, color: "rgba(162, 167, 180, 0.75)" }} />
          <Typography level="body-sm" sx={{ 
            color: "rgba(162, 167, 180, 0.75)",
            fontSize: "0.875rem",
          }}>
            Last Updated: {getRelativeTime(snapshot.analyzed_at)}
          </Typography>
        </Stack>
      </Stack>

      {/* Middle Section (3 Big Numbers) */}
      <Stack direction="row" spacing={3} sx={{ mb: 3, py: 2 }}>
        <ScoreWithGrowth 
          current={Number(snapshot.global_sov_score)}
          previous={previousSnapshot ? Number(previousSnapshot.global_sov_score) : null}
          label="Visibility"
          getColor={getVisibilityColor}
        />
        <ScoreWithGrowth 
          current={Number(snapshot.citation_score)}
          previous={previousSnapshot ? Number(previousSnapshot.citation_score) : null}
          label="Citation Rate"
          getColor={getTrustColor}
        />
        <ScoreWithGrowth 
          current={Number(snapshot.category_relevance)}
          previous={previousSnapshot ? Number(previousSnapshot.category_relevance) : null}
          label="Category Relevance"
          getColor={getReputationColor}
        />
      </Stack>

      <Divider sx={{ backgroundColor: "rgba(46, 212, 122, 0.14)" }} />

      {/* Bottom Section (The Insight) */}
      <Stack spacing={2} sx={{ mt: 3 }}>
        <Box sx={{ 
          p: 2.5,
          backgroundColor: "rgba(46, 212, 122, 0.05)",
          border: "1px solid rgba(46, 212, 122, 0.1)",
          borderRadius: "8px",
          minWidth: "850px",
        }}>
          <ReactMarkdown 
            components={{
              p: ({ children }) => (
                <Typography level="body-md" sx={{ 
                  color: "#F2F5FA",
                  lineHeight: 1.6,
                  fontWeight: 500,
                  mb: 1,
                }}>
                  {children}
                </Typography>
              ),
              ul: ({ children }) => (
                <Box component="ul" sx={{ 
                  color: "#F2F5FA",
                  lineHeight: 1.6,
                  fontWeight: 500,
                  pl: 3,
                  mb: 1,
                }}>
                  {children}
                </Box>
              ),
              ol: ({ children }) => (
                <Box component="ol" sx={{ 
                  color: "#F2F5FA",
                  lineHeight: 1.6,
                  fontWeight: 500,
                  pl: 3,
                  mb: 1,
                }}>
                  {children}
                </Box>
              ),
              li: ({ children }) => (
                <Typography level="body-md" component="li" sx={{ 
                  color: "#F2F5FA",
                  lineHeight: 1.6,
                  fontWeight: 500,
                  mb: 0.5,
                }}>
                  {children}
                </Typography>
              ),
              strong: ({ children }) => (
                <Typography level="body-md" component="strong" sx={{ 
                  color: "#F2F5FA",
                  lineHeight: 1.6,
                  fontWeight: 700,
                }}>
                  {children}
                </Typography>
              ),
              em: ({ children }) => (
                <Typography level="body-md" component="em" sx={{ 
                  color: "#F2F5FA",
                  lineHeight: 1.6,
                  fontWeight: 500,
                  fontStyle: 'italic',
                }}>
                  {children}
                </Typography>
              ),
            }}
          >
            {snapshot.narrative_summary}
          </ReactMarkdown>
        </Box>
        
        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          <Button
            variant={isDeepAnalysisActive ? "solid" : "outlined"}
            color={isDeepAnalysisActive ? "success" : "neutral"}
            startDecorator={<AnalyticsIcon />}
            sx={{
              flex: 1,
              borderColor: isDeepAnalysisActive ? "transparent" : "rgba(46, 212, 122, 0.36)",
              color: isDeepAnalysisActive ? "#0D0F14" : "#F2F5FA",
              backgroundColor: isDeepAnalysisActive ? "#2ED47A" : "transparent",
              boxShadow: isDeepAnalysisActive ? "0 4px 12px rgba(46, 212, 122, 0.3)" : "none",
              "&:hover": {
                backgroundColor: isDeepAnalysisActive ? "#26B869" : "rgba(46, 212, 122, 0.1)",
                borderColor: isDeepAnalysisActive ? "transparent" : "rgba(46, 212, 122, 0.6)",
                color: isDeepAnalysisActive ? "#0D0F14" : "#2ED47A",
                boxShadow: isDeepAnalysisActive ? "0 6px 16px rgba(46, 212, 122, 0.4)" : "none",
              },
              fontWeight: isDeepAnalysisActive ? 600 : 500,
              py: 1.2,
              transition: "all 0.2s ease-in-out",
            }}
            onClick={() => {
              if (onDeepAnalysisClick) {
                onDeepAnalysisClick();
              }
            }}
          >
            Deep Analysis
          </Button>
          
          <Button
            variant="solid"
            color="success"
            startDecorator={<RefreshIcon />}
            onClick={runSovAnalysis}
            disabled={isTriggeringAnalysis || isSovUpToDate}
            sx={{
              flex: 1,
              backgroundColor: isSovUpToDate ? "#10B981" : "#2ED47A",
              color: "#0D0F14",
              "&:hover": {
                backgroundColor: isSovUpToDate ? "#059669" : "#26B869",
                boxShadow: "0 4px 12px rgba(46, 212, 122, 0.3)",
              },
              "&:disabled": {
                cursor: "not-allowed",
                opacity: 0.6,
                backgroundColor: "#10B981",
              },
            }}
          >
            {isTriggeringAnalysis ? 'Starting…' : isSovUpToDate ? 'Up to date' : 'Refresh Analysis'}
          </Button>
        </Stack>

        {actionSuccess && (
          <Alert
            variant="soft"
            color="success"
            sx={{
              mt: 2,
              backgroundColor: "rgba(46, 212, 122, 0.1)",
              color: "#2ED47A",
              border: "1px solid rgba(46, 212, 122, 0.3)",
              borderRadius: "8px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {actionSuccess}
          </Alert>
        )}

        {actionError && (
          <Alert
            variant="soft"
            color="danger"
            sx={{
              mt: 2,
              border: "1px solid rgba(243, 91, 100, 0.35)",
              backgroundColor: "rgba(243, 91, 100, 0.08)",
            }}
          >
            {actionError}
          </Alert>
        )}
        
        <Typography level="body-xs" sx={{ 
          color: "rgba(162, 167, 180, 0.75)",
          fontSize: "0.8rem",
          textAlign: "center",
          mt: 1,
        }}>
          Based on analysis of {snapshot.total_queries_analyzed} high-intent queries
        </Typography>
      </Stack>
    </Card>
  );
}
