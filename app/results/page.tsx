"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Box, Typography, Card, Sheet, Button, Skeleton, Stack, Modal, ModalDialog, ModalClose } from "@mui/joy";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import { useProductStore } from "../optimize/store";
import AnalysisDisplay from "../optimize/analysis-display";
import { exportAnalysisToDocx, exportAnalysisToPdf } from "../optimize/export-utils";

export default function ResultsPage() {
  const router = useRouter();
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const {
    formData,
    optimizationAnalysis,
    isAnalyzing,
    analysisError,
    serverError,
    setOptimizationAnalysis,
    setGeneratedQuery,
    setServerError,
    products,
  } = useProductStore();

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // Fallback: if analysis missing after reload, derive from latest saved product
  useEffect(() => {
    if (!hydrated) return;
    if (!optimizationAnalysis && products && products.length > 0) {
      const latest = products[0];
      if (latest?.analysis) {
        setOptimizationAnalysis(latest.analysis);
      }
    }
  }, [hydrated, optimizationAnalysis, products, setOptimizationAnalysis]);

  const handleExportDocx = async () => {
    if (!optimizationAnalysis) return;
    try {
      await exportAnalysisToDocx(optimizationAnalysis, "Perplexity Search Analysis");
    } catch (error) {
      console.error("Failed to export DOCX", error);
    }
  };

  const handleExportPdf = () => {
    if (!optimizationAnalysis) return;
    try {
      exportAnalysisToPdf(optimizationAnalysis, "Perplexity Search Analysis");
    } catch (error) {
      console.error("Failed to export PDF", error);
    }
  };

  const accentColor = "#2ED47A";
  const surfaceRaised = "rgba(13, 15, 19, 0.96)";
  const borderColor = "rgba(46, 212, 122, 0.14)";
  const borderColorHover = "rgba(46, 212, 122, 0.24)";
  const textPrimary = "#F2F5FA";
  const textSecondary = "#A2A7B4";

  let perplexityQueryText: string | null = null;
  try {
    const raw = (useProductStore.getState().generatedQuery ?? null) as string | null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { perplexityQuery?: string[]; googleQuery?: string[] };
        perplexityQueryText = parsed.perplexityQuery && parsed.perplexityQuery.length > 0
          ? parsed.perplexityQuery[0]
          : raw;
      } catch {
        perplexityQueryText = raw;
      }
    }
  } catch {
    perplexityQueryText = null;
  }

  const normalizeAnalysisText = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (value == null) return "";
    try {
      if (typeof value === "object") {
        return JSON.stringify(value, null, 2);
      }
      return String(value);
    } catch (error) {
      return "";
    }
  };

  const formatMarkdownToHtml = (input: unknown) => {
    const text = normalizeAnalysisText(input);
    if (!text) return "";
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/\n/g, "<br />");

    return html;
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "transparent",
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {!hydrated && (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto", width: "100%", mt: { xs: 7, md: 8 } }}>
          <Card variant="outlined" sx={{ p: 4, backgroundColor: "rgba(17,19,24,0.95)", border: "1px solid rgba(46,212,122,0.14)" }}>
            <Skeleton level="h3" variant="text" sx={{ width: "45%", mb: 2 }} />
            <Skeleton variant="text" sx={{ width: "90%", mb: 1 }} />
            <Skeleton variant="text" sx={{ width: "85%", mb: 1 }} />
            <Skeleton variant="text" sx={{ width: "75%" }} />
          </Card>
        </Box>
      )}
      {/* Navbar */}
      <Sheet
        variant="outlined"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: surfaceRaised,
          border: `1px solid ${borderColor}`,
          borderBottom: `1px solid ${borderColor}`,
          py: { xs: 1.25, md: 2 },
          px: { xs: 2, md: 4 },
          boxShadow: "0 20px 44px rgba(2, 4, 7, 0.6)",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          "&:hover": {
            border: `1px solid ${borderColorHover}`,
            borderBottom: `1px solid ${borderColorHover}`,
            boxShadow: "0 24px 60px rgba(2, 4, 7, 0.65)",
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component="img" src="/GodsEye.png" alt="GodsEye logo" sx={{ width: 22, height: 22 }} />
          <Typography level="h4" sx={{ color: textPrimary, fontWeight: 600 }}>
            GodsEye
          </Typography>
        </Box>
        <Button variant="outlined" size="sm" onClick={() => router.push("/products")} sx={{ width: { xs: 120, sm: "auto" } }}>
          Back to Dashboard
        </Button>
      </Sheet>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto", width: "100%", mt: { xs: 7, md: 8 } }}>
        {/* Server Error State */}
        {serverError && (
          <Box sx={{ mt: 4 }}>
            <Card
              variant="outlined"
              sx={{
                p: 4,
                backgroundColor: "rgba(243, 91, 100, 0.1)",
                border: "1px solid rgba(243, 91, 100, 0.3)",
              }}
            >
              <Typography 
                level="h3" 
                sx={{ 
                  mb: 2, 
                  color: "#F35B64",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Box 
                  component="span" 
                  sx={{ fontSize: "1.5rem" }}
                >
                  ⚠️
                </Box>
                Server Connection Error
              </Typography>
              <Typography sx={{ color: "#F2F5FA", mb: 3, lineHeight: 1.6 }}>
                {serverError}
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Button 
                  variant="outlined" 
                  color="danger"
                  onClick={() => setServerError(null)}
                >
                  Dismiss
                </Button>
                <Button onClick={() => router.push("/optimize")}>
                  Try Again
                </Button>
              </Box>
            </Card>
          </Box>
        )}

        {/* Loading State with Skeleton */}
        {isAnalyzing && !serverError && (
          <Box sx={{ mt: 4 }}>
            <Card
              variant="outlined"
              sx={{
                p: 4,
                mb: 4,
                backgroundColor: "rgba(17, 19, 24, 0.95)",
                border: `1px solid ${borderColor}`,
                position: "relative",
                overflow: "hidden",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: "-100%",
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(90deg, transparent, rgba(46, 212, 122, 0.1), transparent)",
                  animation: "shimmer 2s infinite",
                },
              }}
            >
              <Typography level="h3" sx={{ mb: 3, color: textPrimary }}>
                Analyzing Your Product...
              </Typography>
              <Typography level="body-md" sx={{ mb: 4, color: textSecondary }}>
                We're analyzing your product against AI search engines. This may take a moment.
              </Typography>

              {/* Skeleton Cards */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {[1, 2, 3, 4].map((item) => (
                  <Card
                    key={item}
                    variant="outlined"
                    sx={{
                      p: 3,
                      backgroundColor: "rgba(20, 23, 29, 0.8)",
                      border: `1px solid rgba(46, 212, 122, 0.08)`,
                    }}
                  >
                    <Skeleton
                      variant="text"
                      level="h3"
                      sx={{ mb: 2, width: "40%", bgcolor: "rgba(46, 212, 122, 0.1)" }}
                    />
                    <Skeleton
                      variant="text"
                      sx={{ mb: 1, width: "90%", bgcolor: "rgba(46, 212, 122, 0.08)" }}
                    />
                    <Skeleton
                      variant="text"
                      sx={{ mb: 1, width: "85%", bgcolor: "rgba(46, 212, 122, 0.08)" }}
                    />
                    <Skeleton
                      variant="text"
                      sx={{ width: "75%", bgcolor: "rgba(46, 212, 122, 0.08)" }}
                    />
                  </Card>
                ))}
              </Box>
            </Card>
          </Box>
        )}

        {/* Error State */}
        {analysisError && !isAnalyzing && !serverError && (
          <Box sx={{ mt: 4 }}>
            <Card
              variant="outlined"
              sx={{
                p: 4,
                backgroundColor: "rgba(243, 91, 100, 0.1)",
                border: "1px solid rgba(243, 91, 100, 0.3)",
              }}
            >
              <Typography level="h3" sx={{ mb: 2, color: "#F35B64" }}>
                Analysis Error
              </Typography>
              <Typography sx={{ color: "#ffcccc", mb: 3 }}>{analysisError}</Typography>
              <Button variant="outlined" onClick={() => router.push("/optimize")}>
                Go Back
              </Button>
            </Card>
          </Box>
        )}

        {/* Results Display */}
        {optimizationAnalysis && !isAnalyzing && !serverError && (
          <Box sx={{ mt: 4 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
                mb: 2,
              }}
            >
              <Button
                variant="outlined"
                size="md"
                startDecorator={<KeyboardArrowLeftIcon sx={{ fontSize: 18, mr: -0.5 }} />}
                onClick={() => router.push("/optimize")}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.25,
                  minWidth: { xs: "100%", sm: 160 },
                  px: { xs: 2, md: 3.5 },
                  py: { xs: 1, md: 1.25 },
                  borderRadius: "999px",
                  borderColor: "rgba(46, 212, 122, 0.35)",
                  color: textPrimary,
                  fontWeight: 600,
                  letterSpacing: "0.01em",
                  backgroundColor: "rgba(46, 212, 122, 0.12)",
                  transition: "all 0.25s ease",
                  "&:hover": {
                    borderColor: "rgba(46, 212, 122, 0.55)",
                    backgroundColor: "rgba(46, 212, 122, 0.2)",
                    transform: "translateY(-1px)",
                  },
                  "& .MuiButton-startDecorator": {
                    display: "flex",
                    alignItems: "center",
                  },
                }}
              >
                Go Back
              </Button>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: { xs: "100%", sm: "auto" } }}>
                <Button
                  onClick={() => router.push('/visibility')}
                  variant="outlined"
                  sx={{
                    minWidth: { xs: "100%", sm: 200 },
                    px: { xs: 2, md: 3.5 },
                    py: { xs: 1, md: 1.2 },
                    borderRadius: "999px",
                    fontWeight: 600,
                    borderColor: "rgba(46, 212, 122, 0.36)",
                    color: textPrimary,
                    transition: "all 0.25s ease",
                    "&:hover": {
                      borderColor: "rgba(46, 212, 122, 0.55)",
                      backgroundColor: "rgba(46, 212, 122, 0.12)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  Improve Product Visiblity
                </Button>
                <Button
                  onClick={handleExportDocx}
                  sx={{
                    minWidth: { xs: "100%", sm: 160 },
                    px: { xs: 2, md: 3.5 },
                    py: { xs: 1, md: 1.2 },
                    borderRadius: "999px",
                    fontWeight: 600,
                    backgroundColor: accentColor,
                    color: "#0D0F14",
                    border: "1px solid rgba(46, 212, 122, 0.36)",
                    boxShadow: "0 10px 26px rgba(46, 212, 122, 0.25)",
                    transition: "all 0.25s ease",
                    "&:hover": {
                      backgroundColor: "#26B869",
                      borderColor: "rgba(46, 212, 122, 0.48)",
                      boxShadow: "0 12px 32px rgba(46, 212, 122, 0.3)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  Export as Word
                </Button>
                <Button
                  onClick={handleExportPdf}
                  sx={{
                    minWidth: { xs: "100%", sm: 160 },
                    px: { xs: 2, md: 3.5 },
                    py: { xs: 1, md: 1.2 },
                    borderRadius: "999px",
                    fontWeight: 600,
                    backgroundColor: accentColor,
                    color: "#0D0F14",
                    border: "1px solid rgba(46, 212, 122, 0.36)",
                    boxShadow: "0 10px 26px rgba(46, 212, 122, 0.25)",
                    transition: "all 0.25s ease",
                    "&:hover": {
                      backgroundColor: "#26B869",
                      borderColor: "rgba(46, 212, 122, 0.48)",
                      boxShadow: "0 12px 32px rgba(46, 212, 122, 0.3)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  Export as PDF
                </Button>
              </Stack>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography level="body-sm" sx={{ color: textSecondary, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                Perplexity Search Analysis
              </Typography>
              {perplexityQueryText && (
                <Typography level="body-xs" sx={{ color: textSecondary, mt: 0.5 }}>
                  Search query used: “{perplexityQueryText}”
                </Typography>
              )}
            </Box>
            <AnalysisDisplay
              analysis={optimizationAnalysis}
              onClose={() => setConfirmResetOpen(true)}
              formatMarkdownToHtml={formatMarkdownToHtml}
            />
          </Box>
        )}

        {/* Empty State - No Analysis Yet */}
        {!optimizationAnalysis && !isAnalyzing && !analysisError && !serverError && (
          <Box sx={{ mt: 8, textAlign: "center" }}>
            <Typography level="h3" sx={{ mb: 2, color: textPrimary }}>
              No Analysis Available
            </Typography>
            <Typography level="body-md" sx={{ mb: 4, color: textSecondary }}>
              Please submit a product for analysis first.
            </Typography>
            <Button onClick={() => router.push("/optimize")}>Go to Optimize</Button>
          </Box>
        )}
      </Box>
      <Modal
        open={confirmResetOpen}
        onClose={() => setConfirmResetOpen(false)}
        slotProps={{ backdrop: { sx: { backdropFilter: "blur(18px)", backgroundColor: "rgba(6, 8, 12, 0.75)" } } }}
      >
        <ModalDialog
          variant="outlined"
          sx={{
            background: "linear-gradient(135deg, rgba(16, 21, 28, 0.98), rgba(9, 12, 20, 0.96))",
            border: "1px solid rgba(46, 212, 122, 0.22)",
            borderRadius: "24px",
            boxShadow: "0 48px 120px rgba(0, 0, 0, 0.55)",
            minWidth: { xs: "auto", sm: 420 },
            maxWidth: 520,
            width: "100%",
            p: 3,
            gap: 2,
            overflow: "hidden",
          }}
        >
          <ModalClose onClick={() => setConfirmResetOpen(false)} />
          <Typography level="title-lg" sx={{ color: "#ffffff", mb: 1 }}>
            Start a New Analysis?
          </Typography>
          <Typography level="body-sm" sx={{ color: "rgba(242, 245, 250, 0.7)", mb: 2.5, lineHeight: 1.6 }}>
            This will delete the current analysis. Make sure to export it as PDF or Word before continuing.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={() => setConfirmResetOpen(false)}
              sx={{
                minWidth: 120,
                borderColor: "rgba(46, 212, 122, 0.28)",
                color: "#F2F5FA",
                "&:hover": {
                  borderColor: "rgba(46, 212, 122, 0.45)",
                },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color="warning"
              onClick={() => {
                setConfirmResetOpen(false);
                setOptimizationAnalysis(null);
                setGeneratedQuery(null);
                router.push("/optimize");
              }}
              sx={{
                minWidth: 140,
                backgroundColor: accentColor,
                color: "#0D0F14",
                fontWeight: 600,
                px: 3,
                "&:hover": {
                  backgroundColor: "#26B869",
                },
              }}
            >
              Confirm
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </Box>
  );
}
