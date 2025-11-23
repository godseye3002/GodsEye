"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Card, Sheet, Button, Skeleton, Stack } from "@mui/joy";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import { useProductStore } from "../../optimize/store";
import AnalysisDisplay from "../../optimize/analysis-display";
import { exportAnalysisToDocx, exportAnalysisToPdf } from "../../optimize/export-utils";

export default function GoogleResultsPage() {
  const router = useRouter();
  const {
    googleOverviewAnalysis,
    products,
    setOptimizationAnalysis,
  } = useProductStore();
  const handleExportDocx = async () => {
    if (!googleOverviewAnalysis) return;
    try {
      await exportAnalysisToDocx(googleOverviewAnalysis, "Google AI Overview Analysis");
    } catch (error) {
      console.error("Failed to export DOCX", error);
    }
  };

  const handleExportPdf = () => {
    if (!googleOverviewAnalysis) return;
    try {
      exportAnalysisToPdf(googleOverviewAnalysis, "Google AI Overview Analysis");
    } catch (error) {
      console.error("Failed to export PDF", error);
    }
  };


  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  // Theme tokens aligned with results/page
  const accentColor = "#2ED47A";
  const surfaceRaised = "rgba(13, 15, 19, 0.96)";
  const borderColor = "rgba(46, 212, 122, 0.14)";
  const borderColorHover = "rgba(46, 212, 122, 0.24)";
  const textPrimary = "#F2F5FA";
  const textSecondary = "#A2A7B4";

  const normalizeAnalysisText = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (value == null) return "";
    try {
      if (typeof value === "object") {
        return JSON.stringify(value, null, 2);
      }
      return String(value);
    } catch {
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

    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1<\/strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1<\/em>");
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box component="img" src="/GodsEye.png" alt="GodsEye logo" sx={{ width: 22, height: 22 }} />
          <Typography level="h4" sx={{ color: textPrimary, fontWeight: 600 }}>
            GodsEye
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="sm"
          onClick={() => router.push("/products")}
          sx={{ width: { xs: 120, sm: "auto" } }}
        >
          Back to Dashboard
        </Button>
      </Sheet>

      {/* Main Content */}
      <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto", width: "100%", mt: { xs: 7, md: 8 } }}>
        {googleOverviewAnalysis && (
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
                Google AI Overview Analysis
              </Typography>
            </Box>
            <AnalysisDisplay
              analysis={googleOverviewAnalysis}
              onClose={() => router.push("/optimize")}
              formatMarkdownToHtml={formatMarkdownToHtml}
            />
          </Box>
        )}

        {!googleOverviewAnalysis && (
          <Box sx={{ mt: 8, textAlign: "center" }}>
            <Typography level="h3" sx={{ mb: 2, color: textPrimary }}>
              No Google Overview Analysis Available
            </Typography>
            <Typography level="body-md" sx={{ mb: 4, color: textSecondary }}>
              We couldn't find a completed Google AI Overview analysis for this product. You can return to the
              Optimize page and run the analysis.
            </Typography>
            <Button
              onClick={() => router.push("/optimize")}
              sx={{
                minWidth: 200,
                borderRadius: "999px",
                backgroundColor: accentColor,
                color: "#0D0F14",
                fontWeight: 600,
                px: 3,
                border: "1px solid rgba(46, 212, 122, 0.36)",
                boxShadow: "0 10px 26px rgba(46, 212, 122, 0.25)",
                "&:hover": {
                  backgroundColor: "#26B869",
                },
              }}
            >
              Go to Optimize
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
