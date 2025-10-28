import { Box, Card, Typography, Button, Divider, Chip } from "@mui/joy";
import { OptimizationAnalysis } from "./types";

interface AnalysisDisplayProps {
  analysis: OptimizationAnalysis;
  onClose: () => void;
  formatMarkdownToHtml: (input: unknown) => string;
}

export default function AnalysisDisplay({ analysis, onClose, formatMarkdownToHtml }: AnalysisDisplayProps) {
  const isFeatured = analysis.client_product_visibility.status.toLowerCase().includes("featured");

  return (
    <>
      <Divider sx={{ my: 4 }} />
      
      {/* Executive Summary */}
      <Card
        variant="outlined"
        sx={{
          p: 4,
          mb: 4,
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.04), rgba(79, 70, 229, 0.02))",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(216, 180, 254, 0.08)",
        }}
      >
        <Typography level="h2" sx={{ mb: 3, color: "#ffffff" }}>
          {analysis.executive_summary.title}
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography level="title-lg" sx={{ mb: 1, color: "#a78bfa" }}>
            Status Overview
          </Typography>
          <div
            style={{ color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.8, fontSize: "1.05rem" }}
            dangerouslySetInnerHTML={{
              __html: formatMarkdownToHtml(analysis.executive_summary.status_overview)
            }}
          />
        </Box>

        <Box
          sx={{
            p: 3,
            borderLeft: "4px solid #a78bfa",
            backgroundColor: "rgba(167, 139, 250, 0.05)",
            borderRadius: "4px"
          }}
        >
          <Typography level="title-sm" sx={{ mb: 1, color: "#c4b5fd", fontStyle: "italic" }}>
            Strategic Analogy
          </Typography>
          <div
            style={{ color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.7, fontSize: "0.95rem", fontStyle: "italic" }}
            dangerouslySetInnerHTML={{
              __html: formatMarkdownToHtml(analysis.executive_summary.strategic_analogy)
            }}
          />
        </Box>
      </Card>

      {/* Product Visibility Status */}
      <Card
        variant="outlined"
        sx={{
          p: 3,
          mb: 4,
          background: isFeatured
            ? "linear-gradient(135deg, rgba(34, 197, 94, 0.04), rgba(22, 163, 74, 0.02))"
            : "linear-gradient(135deg, rgba(239, 68, 68, 0.04), rgba(220, 38, 38, 0.02))",
          border: isFeatured
            ? "1px solid rgba(34, 197, 94, 0.2)"
            : "1px solid rgba(239, 68, 68, 0.2)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
          <Typography level="h4" sx={{ color: "#ffffff" }}>
            Product Visibility
          </Typography>
          <Chip
            color={isFeatured ? "success" : "danger"}
            variant="soft"
            sx={{ fontWeight: 600 }}
          >
            {analysis.client_product_visibility.status}
          </Chip>
        </Box>
        <div
          style={{ color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.7 }}
          dangerouslySetInnerHTML={{
            __html: formatMarkdownToHtml(analysis.client_product_visibility.details)
          }}
        />
      </Card>

      {/* AI Answer Deconstruction */}
      <Card
        variant="outlined"
        sx={{
          p: 4,
          mb: 4,
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.04), rgba(37, 99, 235, 0.02))",
          border: "1px solid rgba(59, 130, 246, 0.15)",
        }}
      >
        <Typography level="h3" sx={{ mb: 3, color: "#60a5fa" }}>
          AI Answer Deconstruction
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography level="title-md" sx={{ mb: 1, color: "#93c5fd" }}>
            Dominant Narrative
          </Typography>
          <div
            style={{ color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{
              __html: formatMarkdownToHtml(analysis.ai_answer_deconstruction.dominant_narrative)
            }}
          />
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography level="title-md" sx={{ mb: 2, color: "#93c5fd" }}>
            Key Decision Factors
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {analysis.ai_answer_deconstruction.key_decision_factors.map((factor, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  backgroundColor: "rgba(59, 130, 246, 0.08)",
                  borderRadius: "8px",
                  borderLeft: "3px solid #60a5fa"
                }}
              >
                <div
                  style={{ color: "rgba(255, 255, 255, 0.9)", fontSize: "0.95rem" }}
                  dangerouslySetInnerHTML={{
                    __html: formatMarkdownToHtml(factor)
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>

        <Box>
          <Typography level="title-md" sx={{ mb: 1, color: "#93c5fd" }}>
            Trusted Source Analysis
          </Typography>
          <div
            style={{ color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{
              __html: formatMarkdownToHtml(analysis.ai_answer_deconstruction.trusted_source_analysis)
            }}
          />
        </Box>
      </Card>

      {/* Competitive Landscape */}
      <Card
        variant="outlined"
        sx={{
          p: 4,
          mb: 4,
          background: "linear-gradient(135deg, rgba(245, 158, 11, 0.04), rgba(217, 119, 6, 0.02))",
          border: "1px solid rgba(245, 158, 11, 0.15)",
        }}
      >
        <Typography level="h3" sx={{ mb: 3, color: "#fbbf24" }}>
          Competitive Landscape
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {analysis.competitive_landscape_analysis.map((competitor, index) => (
            <Card
              key={index}
              variant="outlined"
              sx={{
                p: 3,
                background: "rgba(245, 158, 11, 0.05)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
              }}
            >
              <Typography level="title-lg" sx={{ mb: 2, color: "#fcd34d" }}>
                {competitor.competitor_name}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography level="title-sm" sx={{ mb: 1, color: "#fde68a" }}>
                  Why They Were Featured
                </Typography>
                <div
                  style={{ color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.6, fontSize: "0.95rem" }}
                  dangerouslySetInnerHTML={{
                    __html: formatMarkdownToHtml(competitor.reason_for_inclusion)
                  }}
                />
              </Box>

              <Box>
                <Typography level="body-sm" sx={{ color: "#fde68a", mb: 0.5 }}>
                  Source
                </Typography>
                <Typography
                  level="body-sm"
                  sx={{
                    color: "#60a5fa",
                    fontFamily: "monospace",
                    wordBreak: "break-all"
                  }}
                >
                  {competitor.source_of_mention}
                </Typography>
              </Box>
            </Card>
          ))}
        </Box>
      </Card>

      {/* Strategic Gap Analysis */}
      <Card
        variant="outlined"
        sx={{
          p: 4,
          mb: 4,
          background: "linear-gradient(135deg, rgba(236, 72, 153, 0.04), rgba(219, 39, 119, 0.02))",
          border: "1px solid rgba(236, 72, 153, 0.15)",
        }}
      >
        <Typography level="h3" sx={{ mb: 3, color: "#f472b6" }}>
          Strategic Gap & Opportunity Analysis
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Typography level="title-md" sx={{ mb: 1, color: "#fbcfe8" }}>
            Analysis Summary
          </Typography>
          <div
            style={{ color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.7 }}
            dangerouslySetInnerHTML={{
              __html: formatMarkdownToHtml(analysis.strategic_gap_and_opportunity_analysis.analysis_summary)
            }}
          />
        </Box>

        {isFeatured && analysis.strategic_gap_and_opportunity_analysis.if_featured && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography level="title-md" sx={{ mb: 1, color: "#fbcfe8" }}>
                Current Positioning
              </Typography>
              <div
                style={{ color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{
                  __html: formatMarkdownToHtml(analysis.strategic_gap_and_opportunity_analysis.if_featured.current_positioning)
                }}
              />
            </Box>

            <Box>
              <Typography level="title-md" sx={{ mb: 1, color: "#fbcfe8" }}>
                Opportunities for Improvement
              </Typography>
              <div
                style={{ color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{
                  __html: formatMarkdownToHtml(analysis.strategic_gap_and_opportunity_analysis.if_featured.opportunities_for_improvement)
                }}
              />
            </Box>
          </>
        )}

        {!isFeatured && analysis.strategic_gap_and_opportunity_analysis.if_not_featured && (
          <>
            <Box sx={{ mb: 3 }}>
              <Typography level="title-md" sx={{ mb: 1, color: "#fbcfe8" }}>
                Primary Reasons for Omission
              </Typography>
              <div
                style={{ color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{
                  __html: formatMarkdownToHtml(analysis.strategic_gap_and_opportunity_analysis.if_not_featured.primary_reasons_for_omission)
                }}
              />
            </Box>

            <Box>
              <Typography level="title-md" sx={{ mb: 1, color: "#fbcfe8" }}>
                Path to Inclusion
              </Typography>
              <div
                style={{ color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{
                  __html: formatMarkdownToHtml(analysis.strategic_gap_and_opportunity_analysis.if_not_featured.path_to_inclusion)
                }}
              />
            </Box>
          </>
        )}
      </Card>

      {/* Actionable Recommendations */}
      <Card
        variant="outlined"
        sx={{
          p: 4,
          mb: 4,
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.04), rgba(5, 150, 105, 0.02))",
          border: "1px solid rgba(16, 185, 129, 0.15)",
        }}
      >
        <Typography level="h3" sx={{ mb: 3, color: "#34d399" }}>
          Actionable Recommendations
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {analysis.actionable_recommendations.map((rec, index) => (
            <Card
              key={index}
              variant="outlined"
              sx={{
                p: 3,
                background: "rgba(16, 185, 129, 0.05)",
                border: "1px solid rgba(16, 185, 129, 0.2)",
              }}
            >
              <Typography level="title-lg" sx={{ mb: 2, color: "#6ee7b7" }}>
                {index + 1}. {rec.recommendation}
              </Typography>
              <div
                style={{ color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{
                  __html: formatMarkdownToHtml(rec.action)
                }}
              />
            </Card>
          ))}
        </Box>
      </Card>

      {/* Action Button */}
      <Box sx={{ textAlign: 'center' }}>
        <Button
          variant="outlined"
          onClick={onClose}
          size="lg"
          sx={{
            minWidth: 200,
            borderColor: "rgba(167, 139, 250, 0.3)",
            color: "#a78bfa",
            "&:hover": {
              borderColor: "rgba(167, 139, 250, 0.5)",
              backgroundColor: "rgba(167, 139, 250, 0.05)",
            }
          }}
        >
          Start New Analysis
        </Button>
      </Box>
    </>
  );
}
