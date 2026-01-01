"use client";

import { useEffect, useState } from "react";
import { Box, Typography, Card, Chip, Skeleton, Stack, Divider, Button } from "@mui/joy";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import RefreshIcon from "@mui/icons-material/Refresh";

interface SOVSnapshot {
  id: string;
  product_id: string;
  global_sov_score: number;
  citation_score: number;
  sentiment_score: number;
  total_queries_analyzed: number;
  narrative_summary: string;
  engine: 'google' | 'perplexity';
  analyzed_at: string;
}

interface SOVPerformanceCardProps {
  productId: string;
  engine: 'google' | 'perplexity';
}

export default function SOVPerformanceCard({ productId, engine }: SOVPerformanceCardProps) {
  const [snapshot, setSnapshot] = useState<SOVSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;

    const fetchSOVData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/sov?productId=${encodeURIComponent(productId)}&engine=${encodeURIComponent(engine)}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('No Share of Voice data available for this product.');
          } else {
            setError('Failed to load Share of Voice data.');
          }
          return;
        }

        const data = await response.json();
        
        if (data.snapshot) {
          setSnapshot(data.snapshot);
        } else {
          setError('No Share of Voice data available for this product.');
        }

      } catch (err) {
        console.error('Error fetching SOV data:', err);
        setError('Failed to load Share of Voice data.');
      } finally {
        setLoading(false);
      }
    };

    fetchSOVData();
  }, [productId, engine]);

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
        <Typography level="body-sm" sx={{ color: "rgba(162, 167, 180, 0.88)" }}>
          {error || 'No Share of Voice data available for this product.'}
        </Typography>
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
        {/* Metric 1: Visibility (SOV) */}
        <Stack spacing={1} sx={{ flex: 1, alignItems: 'center' }}>
          <Typography level="body-sm" sx={{ 
            color: "rgba(162, 167, 180, 0.88)",
            fontSize: "0.875rem",
            fontWeight: 500,
            textAlign: "center",
          }}>
            Visibility
          </Typography>
          <Typography level="h1" sx={{ 
            color: getVisibilityColor(snapshot.global_sov_score),
            fontSize: "2.5rem",
            fontWeight: 700,
            lineHeight: 1,
            textAlign: "center",
          }}>
            {snapshot.global_sov_score}%
          </Typography>
          <Box sx={{ 
            width: "100%", 
            height: "4px", 
            backgroundColor: "rgba(46, 212, 122, 0.1)",
            borderRadius: "2px",
            overflow: "hidden",
          }}>
            <Box sx={{ 
              width: `${snapshot.global_sov_score}%`,
              height: "100%",
              backgroundColor: getVisibilityColor(snapshot.global_sov_score),
              borderRadius: "2px",
            }} />
          </Box>
        </Stack>

        {/* Metric 2: Trust (Citations) */}
        <Stack spacing={1} sx={{ flex: 1, alignItems: 'center' }}>
          <Typography level="body-sm" sx={{ 
            color: "rgba(162, 167, 180, 0.88)",
            fontSize: "0.875rem",
            fontWeight: 500,
            textAlign: "center",
          }}>
            Citation Rate
          </Typography>
          <Typography level="h1" sx={{ 
            color: getTrustColor(snapshot.citation_score),
            fontSize: "2.5rem",
            fontWeight: 700,
            lineHeight: 1,
            textAlign: "center",
          }}>
            {snapshot.citation_score}%
          </Typography>
          <Box sx={{ 
            width: "100%", 
            height: "4px", 
            backgroundColor: "rgba(46, 212, 122, 0.1)",
            borderRadius: "2px",
            overflow: "hidden",
          }}>
            <Box sx={{ 
              width: `${snapshot.citation_score}%`,
              height: "100%",
              backgroundColor: getTrustColor(snapshot.citation_score),
              borderRadius: "2px",
            }} />
          </Box>
        </Stack>

        {/* Metric 3: Reputation (Sentiment) */}
        <Stack spacing={1} sx={{ flex: 1, alignItems: 'center' }}>
          <Typography level="body-sm" sx={{ 
            color: "rgba(162, 167, 180, 0.88)",
            fontSize: "0.875rem",
            fontWeight: 500,
            textAlign: "center",
          }}>
            Sentiment Score
          </Typography>
          <Typography level="h1" sx={{ 
            color: getReputationColor(snapshot.sentiment_score),
            fontSize: "2.5rem",
            fontWeight: 700,
            lineHeight: 1,
            textAlign: "center",
          }}>
            {snapshot.sentiment_score}%
          </Typography>
          <Box sx={{ 
            width: "100%", 
            height: "4px", 
            backgroundColor: "rgba(46, 212, 122, 0.1)",
            borderRadius: "2px",
            overflow: "hidden",
          }}>
            <Box sx={{ 
              width: `${snapshot.sentiment_score}%`,
              height: "100%",
              backgroundColor: getReputationColor(snapshot.sentiment_score),
              borderRadius: "2px",
            }} />
          </Box>
        </Stack>
      </Stack>

      <Divider sx={{ backgroundColor: "rgba(46, 212, 122, 0.14)" }} />

      {/* Bottom Section (The Insight) */}
      <Stack spacing={2} sx={{ mt: 3 }}>
        <Box sx={{ 
          p: 2.5,
          backgroundColor: "rgba(46, 212, 122, 0.05)",
          border: "1px solid rgba(46, 212, 122, 0.1)",
          borderRadius: "8px",
        }}>
          <Typography level="body-md" sx={{ 
            color: "#F2F5FA",
            lineHeight: 1.6,
            fontWeight: 500,
          }}>
            {snapshot.narrative_summary}
          </Typography>
        </Box>
        
        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          <Button
            variant="outlined"
            color="neutral"
            startDecorator={<AnalyticsIcon />}
            sx={{
              flex: 1,
              borderColor: "rgba(46, 212, 122, 0.36)",
              color: "#F2F5FA",
              backgroundColor: "transparent",
              "&:hover": {
                backgroundColor: "rgba(46, 212, 122, 0.1)",
                borderColor: "rgba(46, 212, 122, 0.6)",
                color: "#2ED47A",
              },
              fontWeight: 500,
              py: 1.2,
            }}
            onClick={() => {
              console.log('Deep Analysis clicked - placeholder for now');
            }}
          >
            Deep Analysis
          </Button>
          
          <Button
            variant="solid"
            color="success"
            startDecorator={<RefreshIcon />}
            sx={{
              flex: 1,
              backgroundColor: "#2ED47A",
              color: "#0D0F14",
              "&:hover": {
                backgroundColor: "#26B869",
                boxShadow: "0 4px 12px rgba(46, 212, 122, 0.3)",
              },
              fontWeight: 600,
              py: 1.2,
            }}
            onClick={() => {
              console.log('Refresh Analysis clicked - placeholder for now');
            }}
          >
            Refresh Analysis
          </Button>
        </Stack>
        
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
