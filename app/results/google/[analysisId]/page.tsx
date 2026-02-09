"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Typography, Card, Sheet, Button, Skeleton, Stack, Modal, ModalDialog, ModalClose, Menu, MenuItem, Chip, Tooltip } from "@mui/joy";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import { useProductStore } from "../../../optimize/store";
import { OptimizedProduct, OptimizationAnalysis } from "../../../optimize/types";
import AnalysisDisplay from "../../../optimize/analysis-display";
import { exportAnalysisToDocx, exportAnalysisToPdf } from "../../../optimize/export-utils";
import AnalysisReplacer from "../../../components/AnalysisReplacer";

export default function GoogleAnalysisResultPage() {
  const router = useRouter();
  const params = useParams();
  const analysisId = params.analysisId as string;
  
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [resultMenuAnchor, setResultMenuAnchor] = useState<null | HTMLElement>(null);
  
  const {
    formData,
    googleOverviewAnalysis,
    isAnalyzing,
    analysisError,
    serverError,
    setGoogleOverviewAnalysis,
    setGeneratedQuery,
    setServerError,
    products,
    currentProductId,
  } = useProductStore();

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
    setServerError(null);
  }, [setServerError]);

  // Helper functions for stacked deck UI
  const getAnalysesForQuery = (query: string, pipeline: 'perplexity' | 'google_overview') => {
    if (!currentProductId) return [];

    const currentProduct = products.find(p => p.id === currentProductId);
    if (!currentProduct || !currentProduct.analyses) return [];

    return currentProduct.analyses
      .filter((analysis: any) => {
        if (pipeline === 'perplexity') {
          const analysisQuery = analysis.optimization_query;
          return analysisQuery && (
            analysisQuery === query ||
            analysisQuery.toLowerCase() === query.toLowerCase()
          );
        } else {
          const analysisQuery = analysis.google_search_query;
          return analysisQuery && (
            analysisQuery === query ||
            analysisQuery.toLowerCase() === query.toLowerCase()
          );
        }
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA; // Newest first
      });
  };

  const getTrendIndicator = (analyses: any[]) => {
    if (analyses.length < 2) return null;

    const latest = analyses[0];
    const previous = analyses[1];

    // Extract client_product_visibility from analysis data
    const getVisibilityStatus = (analysis: any) => {
      try {
        const analysisData = analysis.optimization_analysis || analysis.google_overview_analysis || '';
        
        // Try to parse as JSON first
        let parsedData;
        try {
          parsedData = typeof analysisData === 'string' ? JSON.parse(analysisData) : analysisData;
        } catch {
          // If not valid JSON, try to extract from text
          return extractVisibilityFromText(analysisData);
        }

        // Look for client_product_visibility in the parsed data
        if (parsedData && typeof parsedData === 'object') {
          if (parsedData.client_product_visibility) {
            return parsedData.client_product_visibility;
          }
          
          // Check nested objects
          for (const key in parsedData) {
            if (parsedData[key] && parsedData[key].client_product_visibility) {
              return parsedData[key].client_product_visibility;
            }
          }
        }
        
        return extractVisibilityFromText(analysisData);
      } catch (error) {
        console.error('Error extracting visibility:', error);
        return 'Unknown';
      }
    };

    const extractVisibilityFromText = (text: string) => {
      // Look for patterns like "client_product_visibility": "Featured" or similar
      const patterns = [
        /client_product_visibility["\s]*[:=]["\s]*(Featured|Not Featured)/i,
        /visibility["\s]*[:=]["\s]*(Featured|Not Featured)/i,
        /(Featured|Not Featured)/i
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }
      
      return 'Unknown';
    };

    const latestVisibility = getVisibilityStatus(latest);
    const previousVisibility = getVisibilityStatus(previous);

    // Define visibility hierarchy: Featured > Not Featured
    const getVisibilityRank = (visibility: any) => {
      if (!visibility || typeof visibility !== 'string') {
        return 0; // Unknown or invalid values
      }
      
      const normalized = visibility.toLowerCase().trim();
      if (normalized.includes('featured')) return 2;
      if (normalized.includes('not featured')) return 1;
      return 0; // Unknown or other values
    };

    const latestRank = getVisibilityRank(latestVisibility);
    const previousRank = getVisibilityRank(previousVisibility);

    if (latestRank > previousRank) {
      return { direction: 'up', icon: '↗' };
    } else if (latestRank < previousRank) {
      return { direction: 'down', icon: '↘' };
    } else {
      return { direction: 'same', icon: '-' };
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleResultMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setResultMenuAnchor(event.currentTarget);
  };

  const handleResultMenuClose = () => {
    setResultMenuAnchor(null);
  };

  const handleViewAnalysisById = (analysisId: string) => {
    handleResultMenuClose();
    router.push(`/results/google/${analysisId}`);
  };

  // Load specific analysis by ID
  useEffect(() => {
    if (!hydrated) return;
    if (!analysisId) return;

    const loadAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);
        setServerError(null);
        
        // 1) Try local store first (fast path)
        let localMatch: any = null;
        if (currentProductId && products.length > 0) {
          const currentProduct = products.find(p => p.id === currentProductId);
          localMatch = currentProduct?.analyses?.find((a: unknown) => (a as { id: string }).id === analysisId) ?? null;
        }

        if (localMatch && 'googleOverviewAnalysis' in localMatch && localMatch.googleOverviewAnalysis) {
          // Set data synchronously before stopping loading
          setAnalysis(localMatch);
          setGoogleOverviewAnalysis(localMatch.googleOverviewAnalysis as OptimizationAnalysis);
          const googleQueryCandidate =
            typeof localMatch?.google_search_query === "string" ? localMatch.google_search_query : "";
          setGeneratedQuery(googleQueryCandidate);
          return;
        }

        // 2) Fallback: fetch by analysisId (authoritative)
        const response = await fetch(`/api/product-analyses/${analysisId}`);
        if (!response.ok) {
          setError('Failed to load analysis data.');
          return;
        }

        const data = await response.json();
        if (data.analysis?.google_overview_analysis) {
          // Set data synchronously before stopping loading
          setAnalysis(data.analysis);
          setGoogleOverviewAnalysis(data.analysis.google_overview_analysis);
          setGeneratedQuery(data.analysis.google_search_query || '');
        } else {
          setError('Google AI Overview analysis not found for this query.');
        }
      } catch (err) {
        console.error('Error loading analysis:', err);
        setError('Failed to load analysis data.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalysis();
  }, [hydrated, analysisId, currentProductId, products, setGoogleOverviewAnalysis, setGeneratedQuery]);

  const handleExportDocx = async () => {
    if (googleOverviewAnalysis) {
      await exportAnalysisToDocx(googleOverviewAnalysis, "Google AI Overview Analysis", analysis?.google_search_query || '');
    }
  };

  const handleExportPdf = async () => {
    if (googleOverviewAnalysis) {
      await exportAnalysisToPdf(googleOverviewAnalysis, "Google AI Overview Analysis", analysis?.google_search_query || '');
    }
  };

  const handleReset = () => {
    setConfirmResetOpen(true);
  };

  const confirmReset = () => {
    setGoogleOverviewAnalysis(null);
    setGeneratedQuery(null);
    setServerError(null);
    setConfirmResetOpen(false);
    router.push('/optimize');
  };

  const googleQueryText = analysis?.google_search_query || '';

  if (loading) {
    return (
      <Sheet
        sx={{
          maxWidth: { xs: "100%", md: "1200px" },
          mx: "auto",
          my: 4,
          p: { xs: 2, md: 4 },
          backgroundColor: "rgba(13, 15, 19, 0.95)",
          borderRadius: "16px",
          border: "1px solid rgba(46, 212, 122, 0.14)",
          boxShadow: "0 24px 60px rgba(2, 4, 7, 0.55)",
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Button
            variant="plain"
            onClick={() => router.push('/optimize')}
            sx={{ color: "#2ED47A", mb: 2 }}
          >
            <KeyboardArrowLeftIcon />
            Back to Optimization
          </Button>
          <Typography level="h1" sx={{ color: "#F2F5FA", mb: 2 }}>
            Loading Google AI Overview Analysis...
          </Typography>
        </Box>
        
        <Stack spacing={3}>
          <Skeleton variant="text" level="h2" sx={{ width: "60%" }} />
          <Skeleton variant="text" level="body-md" sx={{ width: "80%" }} />
          <Skeleton variant="text" level="body-md" sx={{ width: "70%" }} />
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: "8px" }} />
        </Stack>
      </Sheet>
    );
  }

  if (error || serverError || analysisError) {
    return (
      <Sheet
        sx={{
          maxWidth: { xs: "100%", md: "800px" },
          mx: "auto",
          my: 4,
          p: { xs: 2, md: 4 },
          backgroundColor: "rgba(13, 15, 19, 0.95)",
          borderRadius: "16px",
          border: "1px solid rgba(243, 91, 100, 0.14)",
          boxShadow: "0 24px 60px rgba(2, 4, 7, 0.55)",
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Button
            variant="plain"
            onClick={() => router.push('/optimize')}
            sx={{ color: "#F35B64", mb: 2 }}
          >
            <KeyboardArrowLeftIcon />
            Back to Optimization
          </Button>
          <Typography level="h1" sx={{ color: "#F35B64", mb: 2 }}>
            Analysis Not Found
          </Typography>
          <Typography level="body-md" sx={{ color: "rgba(162, 167, 180, 0.88)" }}>
            {error || serverError || analysisError || 'The requested Google AI Overview analysis could not be found.'}
          </Typography>
        </Box>
        
        <Button
          onClick={() => router.push('/optimize')}
          sx={{
            backgroundColor: "#F35B64",
            color: "#0D0F14",
            fontWeight: 600,
            "&:hover": {
              backgroundColor: "#E54850",
            },
          }}
        >
          Return to Optimization
        </Button>
      </Sheet>
    );
  }

  return (
    <Sheet
      sx={{
        maxWidth: { xs: "100%", md: "1200px" },
        mx: "auto",
        my: 4,
        p: { xs: 2, md: 4 },
        backgroundColor: "rgba(13, 15, 19, 0.95)",
        borderRadius: "16px",
        border: "1px solid rgba(46, 212, 122, 0.14)",
        boxShadow: "0 24px 60px rgba(2, 4, 7, 0.55)",
      }}
    >
      <Box sx={{ mb: 4 }}>
        <Button
          variant="plain"
          onClick={() => router.back()}
          sx={{ color: "#2ED47A", mb: 2 }}
        >
          <KeyboardArrowLeftIcon />
          Back
        </Button>
        <Typography level="h1" sx={{ color: "#F2F5FA", mb: 2 }}>
          🌐 Google AI Overview Analysis
        </Typography>
        {googleQueryText && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography level="body-md" sx={{ color: "rgba(162, 167, 180, 0.88)" }}>
              <strong>Query:</strong> "{googleQueryText}"
            </Typography>
            {(() => {
              const analyses = getAnalysesForQuery(googleQueryText, 'google_overview');
              const analysisCount = analyses.length;
              const trend = getTrendIndicator(analyses);
              
              return analysisCount > 1 ? (
                <Box sx={{ position: 'relative' }}>
                  <Tooltip title="View analysis history" placement="top">
                    <Button
                      size="sm"
                      variant="outlined"
                      onClick={handleResultMenuOpen}
                      sx={{
                        minWidth: 100,
                        borderColor: "rgba(66, 133, 244, 0.3)",
                        color: "#4285F4",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        position: 'relative',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)',
                        "&:hover": {
                          backgroundColor: "rgba(66, 133, 244, 0.1)",
                          borderColor: "rgba(66, 133, 244, 0.5)",
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography sx={{ fontSize: '0.75rem' }}>
                          📄 History
                        </Typography>
                        <Chip
                          size="sm"
                          variant="solid"
                          sx={{
                            backgroundColor: "rgba(66, 133, 244, 0.2)",
                            color: "#4285F4",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            minWidth: 20,
                            height: 20,
                            borderRadius: '10px',
                          }}
                        >
                          {analysisCount}
                        </Chip>
                        {trend && (
                          <Typography sx={{ fontSize: '0.8rem', color: trend.direction === 'up' ? '#4285F4' : trend.direction === 'down' ? '#F35B64' : '#6c757d' }}>
                            {trend.icon}
                          </Typography>
                        )}
                      </Box>
                    </Button>
                  </Tooltip>
                  <Menu
                    anchorEl={resultMenuAnchor}
                    open={Boolean(resultMenuAnchor)}
                    onClose={handleResultMenuClose}
                    sx={{
                      '& .MuiList-root': {
                        py: 0.5,
                      },
                    }}
                  >
                    <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <Typography level="title-sm" sx={{ color: '#4285F4', fontWeight: 600 }}>
                        Analysis History
                      </Typography>
                    </Box>
                    {analyses.map((analysisItem: any, index: number) => (
                      <MenuItem
                        key={analysisItem.id}
                        onClick={() => handleViewAnalysisById(analysisItem.id)}
                        sx={{
                          py: 0.75,
                          px: 1.5,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          '&:hover': {
                            backgroundColor: 'rgba(66, 133, 244, 0.1)',
                          },
                          backgroundColor: analysisItem.id === analysisId ? 'rgba(66, 133, 244, 0.15)' : 'transparent',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography level="body-sm" sx={{ fontSize: '0.8rem' }}>
                            {index === 0 ? 'Latest' : index === 1 ? 'v2' : `v${index + 1}`}
                          </Typography>
                          {index === 0 && trend && (
                            <Typography sx={{ fontSize: '0.8rem', color: trend.direction === 'up' ? '#4285F4' : trend.direction === 'down' ? '#F35B64' : '#6c757d' }}>
                              {trend.icon}
                            </Typography>
                          )}
                          {analysisItem.id === analysisId && (
                            <Chip
                              size="sm"
                              variant="solid"
                              sx={{
                                backgroundColor: "#4285F4",
                                color: "#FFFFFF",
                                fontSize: "0.6rem",
                                fontWeight: 600,
                                height: 16,
                              }}
                            >
                              Current
                            </Chip>
                          )}
                        </Box>
                        <Typography level="body-sm" sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          {formatRelativeTime(analysisItem.created_at)}
                        </Typography>
                      </MenuItem>
                    ))}
                  </Menu>
                </Box>
              ) : null;
            })()}
          </Box>
        )}
        {analysis && (
          <Typography level="body-sm" sx={{ color: "rgba(129, 135, 146, 0.75)" }}>
            Analysis from {new Date(analysis.created_at).toLocaleString()}
          </Typography>
        )}
      </Box>

      {googleOverviewAnalysis ? (
        <>
          <Box sx={{ mb: 4, display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Button
              onClick={handleExportDocx}
              sx={{
                backgroundColor: "#4285F4",
                color: "#FFFFFF",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: "#3367D6",
                },
              }}
            >
              Export as DOCX
            </Button>
            <Button
              onClick={handleExportPdf}
              variant="outlined"
              sx={{
                borderColor: "#4285F4",
                color: "#4285F4",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: "rgba(66, 133, 244, 0.1)",
                  borderColor: "rgba(66, 133, 244, 0.5)",
                },
              }}
            >
              Export as PDF
            </Button>
            <AnalysisReplacer
              analysisId={analysisId}
              query={analysis?.google_search_query || ''}
              pipeline="google_overview"
              onComplete={async () => {
                // Refresh the analysis data after replacement
                try {
                  setLoading(true);
                  const response = await fetch(`/api/product-analyses/${analysisId}`);
                  if (response.ok) {
                    const data = await response.json();
                    // Update the local state with fresh data
                    if (data.analysis) {
                      setGoogleOverviewAnalysis(data.analysis);
                    }
                  }
                } catch (error) {
                  console.error('Failed to refresh analysis:', error);
                  // Fallback to full page reload if fetch fails
                  window.location.reload();
                } finally {
                  setLoading(false);
                }
              }}
              onError={(error) => {
                setError(error);
              }}
            />
          </Box>

          <AnalysisDisplay 
            analysis={googleOverviewAnalysis} 
            onClose={() => router.push('/optimize')}
            formatMarkdownToHtml={(input: unknown) => {
              if (typeof input === 'string') {
                return input
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  .replace(/\n/g, '<br>');
              }
              return String(input);
            }}
          />
        </>
      ) : (
        <Card
          variant="outlined"
          sx={{
            p: 4,
            textAlign: "center",
            backgroundColor: "rgba(17, 19, 24, 0.6)",
            border: "1px solid rgba(66, 133, 244, 0.2)",
          }}
        >
          <Typography level="h3" sx={{ color: "#F2F5FA", mb: 2 }}>
            No Analysis Data Available
          </Typography>
          <Typography level="body-md" sx={{ color: "rgba(162, 167, 180, 0.88)", mb: 4 }}>
            The Google AI Overview analysis data could not be loaded.
          </Typography>
          <Button
            onClick={() => router.push('/optimize')}
            sx={{
              backgroundColor: "#4285F4",
              color: "#FFFFFF",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "#3367D6",
              },
            }}
          >
            Return to Optimization
          </Button>
        </Card>
      )}

      <Modal open={confirmResetOpen} onClose={() => setConfirmResetOpen(false)}>
        <ModalDialog sx={{ backgroundColor: "#0D0F14", border: "1px solid rgba(46, 212, 122, 0.14)" }}>
          <ModalClose />
          <Typography level="h2" sx={{ color: "#F2F5FA", mb: 2 }}>
            Re-Do Analysis?
          </Typography>
          <Typography level="body-md" sx={{ color: "rgba(162, 167, 180, 0.88)", mb: 4 }}>
            This will clear the current analysis results and return you to the optimization page.
          </Typography>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
            <Button
              variant="plain"
              onClick={() => setConfirmResetOpen(false)}
              sx={{ color: "rgba(162, 167, 180, 0.88)" }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmReset}
              sx={{
                backgroundColor: "#F35B64",
                color: "#0D0F14",
                fontWeight: 600,
                "&:hover": {
                  backgroundColor: "#E54850",
                },
              }}
            >
              Confirm
            </Button>
          </Box>
        </ModalDialog>
      </Modal>
    </Sheet>
  );
}
