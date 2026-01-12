"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Box, Typography, Card, Sheet, Button, Skeleton, Stack, Modal, ModalDialog, ModalClose } from "@mui/joy";
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
          <Typography level="body-md" sx={{ color: "rgba(162, 167, 180, 0.88)", mb: 2 }}>
            <strong>Query:</strong> "{googleQueryText}"
          </Typography>
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
