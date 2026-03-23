"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  Typography,
  Table,
  Sheet,
  Stack,
  Chip,
  CircularProgress,
  Divider,
} from "@mui/joy";
import { useConversions } from "@/hooks/useConversions";
import { useJourney } from "@/hooks/useJourney";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ZapIcon,
  GlobalIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

const SOURCE_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  perplexity: "Perplexity",
  claude: "Claude",
  bing_copilot: "Bing Copilot",
  google_ai_mode: "Google AI Mode",
  google_unclassified: "Google",
};

const SOURCE_COLORS: Record<string, string> = {
  chatgpt: "#10A37F",
  perplexity: "#20B2AA",
  claude: "#D97706",
  bing_copilot: "#00BCF2",
  google_ai_mode: "#4285F4",
  google_unclassified: "#EA4335",
};



// ────────────────────────────────────────────────────────────────────
// Design Tokens (consistent with WebsiteAuditManager / project)
// ────────────────────────────────────────────────────────────────────
const T = {
  textPrimary: "#F2F5FA",
  textSecondary: "rgba(242, 245, 250, 0.6)",
  accent: "#2ED47A",
  accentDim: "rgba(46, 212, 122, 0.15)",
  surface: "linear-gradient(135deg, rgba(13, 15, 20, 0.8), rgba(10, 12, 16, 0.9))",
  border: "rgba(46, 212, 122, 0.15)",
  rowHover: "rgba(46, 212, 122, 0.05)",
  blue: "#38BDF8",
  blueDim: "rgba(56, 189, 248, 0.15)",
  purple: "#7C6CFA",
};

const tableStyles = {
  "& thead th": {
    bgcolor: "rgba(255,255,255,0.02)",
    color: T.textSecondary,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    fontSize: "10px",
    letterSpacing: "0.08em",
  },
  "& td": {
    color: T.textPrimary,
    borderColor: "rgba(255,255,255,0.05)",
  },
  "& tr:hover td": {
    bgcolor: T.rowHover,
  },
};

// ════════════════════════════════════════════════════════════════════
//   C O M P O N E N T
// ════════════════════════════════════════════════════════════════════
export default function ConversionStats({
  productId,
  userId,
}: {
  productId?: string;
  userId?: string;
}) {
  const summary = useConversions({
    productId: productId as string,
    userId: userId as string,
  });

  const journey = useJourney({
    productId: productId as string,
    userId: userId as string,
  });

  const [selectedPath, setSelectedPath] = useState<string>("/");

  // Auto-select first available path
  useEffect(() => {
    if (
      summary.data?.length &&
      !summary.data.find((p) => p.page_path === selectedPath)
    ) {
      setSelectedPath(summary.data[0].page_path);
    }
  }, [summary.data]);

  // ── Loading state ──────────────────────────────────────────────
  if (summary.isLoading && !summary.data) {
    return (
      <Card
        variant="outlined"
        sx={{
          p: 4,
          background: T.surface,
          borderColor: T.border,
          borderRadius: "24px",
          minHeight: 300,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress size="md" sx={{ color: T.accent }} />
          <Typography level="body-sm" sx={{ color: T.textSecondary, fontStyle: "italic" }}>
            Syncing Conversion Intelligence…
          </Typography>
        </Stack>
      </Card>
    );
  }

  const selectedPageData = summary.data?.find((p) => p.page_path === selectedPath);
  const rawJourneys = journey.data ?? [];

  const groupedJourneysMap = rawJourneys.reduce((acc, j) => {
    const pathSteps = j.path_array ?? j.journey?.split(" → ") ?? [];
    const pathKey = pathSteps.join(" → ");
    const key = `${j.source}|||${pathKey}`;

    if (!acc[key]) {
      acc[key] = {
        ...j,
        pathSteps,
        count: 0,
      };
    }
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, typeof rawJourneys[0] & { pathSteps: string[], count: number }>);

  const groupedJourneys = Object.values(groupedJourneysMap).sort((a, b) => b.count - a.count);

  // Calculate actual total visits per source for the selected selectedPath
  const actualVisitsBySource = rawJourneys.reduce((acc, j) => {
    const visitedPath = j.path_array?.includes(selectedPath) || j.entry_page === selectedPath;
    if (visitedPath) {
      acc[j.source] = (acc[j.source] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // ══════════════════════════════════════════════════════════════
  return (
    <Stack spacing={4}>
      {/* ───────── CARD 1 — Conversion Intelligence ───────── */}
      <Card
        variant="outlined"
        sx={{
          p: { xs: 3, md: 4 },
          background: T.surface,
          backdropFilter: "blur(20px)",
          borderColor: T.border,
          borderRadius: "24px",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Stack spacing={0.5}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, rgba(46,212,122,0.15), rgba(46,212,122,0.03))",
                  border: "1px solid rgba(46,212,122,0.25)",
                  display: "flex",
                }}
              >
                <HugeiconsIcon icon={ZapIcon} size={18} style={{ color: T.accent }} />
              </Box>
              <Typography level="h3" sx={{ color: T.textPrimary, fontSize: "1.4rem", fontWeight: 800 }}>
                Conversion Intelligence
              </Typography>
            </Box>
            <Typography level="body-sm" sx={{ color: T.textSecondary }}>
              Tracking {summary.data?.length || 0} unique landing paths
            </Typography>
          </Stack>
          <Chip
            variant="soft"
            size="sm"
            sx={{ bgcolor: T.accentDim, color: T.accent, border: `1px solid ${T.border}`, fontWeight: 700 }}
          >
            LIVE FEED
          </Chip>
        </Box>

        {/* Grand Total */}
        <Stack
          direction="row"
          spacing={4}
          sx={{
            p: 3,
            borderRadius: "20px",
            bgcolor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.05)",
            mb: 4,
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              level="body-xs"
              sx={{ color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}
            >
              Total Visits
            </Typography>
            <Typography level="h1" sx={{ color: T.blue, fontSize: "2.5rem", fontWeight: 900 }}>
              {(journey.data?.length ?? 0).toLocaleString()}
            </Typography>
          </Box>
          <Divider orientation="vertical" />
          <Box>
            <Typography
              level="body-xs"
              sx={{ color: T.textSecondary, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}
            >
              Network Conversions
            </Typography>
            <Typography level="h1" sx={{ color: T.accent, fontSize: "2.5rem", fontWeight: 900 }}>
              {summary.grandTotal.toLocaleString()}
            </Typography>
          </Box>
          <Divider orientation="vertical" />
          <Stack spacing={0.5}>
            <Typography level="body-xs" sx={{ color: T.textSecondary }}>
              Performance Period
            </Typography>
            <Chip
              startDecorator={<HugeiconsIcon icon={GlobalIcon} size={14} />}
              size="sm"
              variant="soft"
              sx={{ bgcolor: "rgba(255,255,255,0.05)", color: T.textPrimary }}
            >
              All AI Sources Active
            </Chip>
          </Stack>
        </Stack>

        {/* Route Tags */}
        <Box sx={{ mb: 3 }}>
          <Typography
            level="title-sm"
            sx={{
              color: T.textSecondary,
              mb: 1.5,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontSize: "10px",
              fontWeight: 700,
            }}
          >
            Detected Routes
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            {summary.data?.map((page) => {
              const active = selectedPath === page.page_path;
              return (
                <Chip
                  key={page.page_path}
                  onClick={() => setSelectedPath(page.page_path)}
                  variant="plain"
                  sx={{
                    px: 2,
                    py: 0.75,
                    borderRadius: "12px",
                    border: "1px solid",
                    borderColor: active ? `${T.accent} !important` : "rgba(255,255,255,0.1) !important",
                    background: active ? `${T.accent} !important` : "transparent !important",
                    color: active ? "#ffffff !important" : `${T.textPrimary} !important`,
                    fontWeight: 600,
                    fontSize: "13px",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: active ? `0 0 10px ${T.accentDim}` : "none",
                    cursor: "pointer",
                    "&:hover": {
                      borderColor: T.purple,
                      bgcolor: active ? T.purple : "rgba(124, 108, 250, 0.1)",
                      transform: "translateY(-1px)",
                    },
                  }}
                >
                  {page.page_path}
                </Chip>
              );
            })}
            {(!summary.data || summary.data.length === 0) && (
              <Typography level="body-sm" sx={{ color: T.textSecondary, fontStyle: "italic" }}>
                No routes detected yet.
              </Typography>
            )}
          </Stack>
        </Box>

        {/* Sources Table for Selected Route */}
        {selectedPageData ? (
          <Box
            sx={{
              animation: "fadeSlide 0.3s ease-out",
              "@keyframes fadeSlide": {
                from: { opacity: 0, transform: "translateY(8px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
              <Stack spacing={0.25}>
                <Typography level="title-md" sx={{ color: T.textPrimary, fontWeight: 700 }}>
                  {selectedPageData.page_description || selectedPath}
                </Typography>
                <Typography level="body-xs" sx={{ color: T.accent, fontWeight: 700, letterSpacing: "0.05em" }}>
                  SOURCE BREAKDOWN FOR {selectedPath.toUpperCase()}
                </Typography>
              </Stack>
              <Box sx={{ textAlign: "right" }}>
                <Typography level="h2" sx={{ color: T.accent, fontWeight: 800 }}>
                  {selectedPageData.total.toLocaleString()}
                </Typography>
                <Typography level="body-xs" sx={{ color: T.textSecondary }}>
                  Total Conversions
                </Typography>
              </Box>
            </Stack>

            <Sheet
              variant="plain"
              sx={{
                backgroundColor: "transparent",
                borderRadius: "16px",
                border: `1px solid ${T.border}`,
                overflow: "hidden",
              }}
            >
              <Table sx={tableStyles}>
                <thead>
                  <tr>
                    <th>Traffic Source</th>
                    <th style={{ textAlign: "right" }}>Total Reach</th>
                    <th style={{ textAlign: "right" }}>Converted</th>
                    <th style={{ textAlign: "right" }}>Navigation Conv.</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedPageData.sources.map((s, idx) => (
                    <tr key={idx}>
                      <td>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              bgcolor: SOURCE_COLORS[s.source] || T.accent,
                              flexShrink: 0,
                            }}
                          />
                          <Typography level="body-sm" sx={{ fontWeight: 600, color: T.textPrimary }}>
                            {SOURCE_LABELS[s.source] || s.source}
                          </Typography>
                        </Stack>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Typography level="body-sm" sx={{ color: T.blue, fontWeight: 700 }}>
                          {(actualVisitsBySource[s.source] || 0).toLocaleString()}
                        </Typography>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Typography level="body-sm" sx={{ color: T.textSecondary }}>
                          {s.total_visits.toLocaleString()}
                        </Typography>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Typography level="body-sm" sx={{ color: T.purple, fontWeight: 600 }}>
                          {s.continuation_conversions?.toLocaleString() ?? "—"}
                        </Typography>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Sheet>
          </Box>
        ) : (
          !summary.isLoading && (
            <Box
              sx={{
                p: 4,
                textAlign: "center",
                border: "1px dashed rgba(255,255,255,0.1)",
                borderRadius: "20px",
              }}
            >
              <Typography level="body-sm" sx={{ color: T.textSecondary }}>
                Select a route above to view detailed metrics
              </Typography>
            </Box>
          )
        )}
      </Card>

      {/* ───────── CARD 2 — Visitor Journey ───────── */}
      <Card
        variant="outlined"
        sx={{
          p: { xs: 3, md: 4 },
          background: T.surface,
          backdropFilter: "blur(20px)",
          borderColor: T.border,
          borderRadius: "24px",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
          <Stack spacing={0.5}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  p: 1,
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, rgba(124,108,250,0.15), rgba(124,108,250,0.03))",
                  border: "1px solid rgba(124,108,250,0.25)",
                  display: "flex",
                }}
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} style={{ color: T.purple }} />
              </Box>
              <Typography level="h3" sx={{ color: T.textPrimary, fontSize: "1.4rem", fontWeight: 800 }}>
                Visitor Journeys
              </Typography>
            </Box>
            <Typography level="body-sm" sx={{ color: T.textSecondary }}>
              {rawJourneys.length} tracked session{rawJourneys.length !== 1 ? "s" : ""} from AI referrals
            </Typography>
          </Stack>
          <Chip
            variant="soft"
            size="sm"
            sx={{ bgcolor: "rgba(124,108,250,0.1)", color: T.purple, border: "1px solid rgba(124,108,250,0.2)", fontWeight: 700 }}
          >
            SESSION REPLAY
          </Chip>
        </Box>

        {/* Journey Loading */}
        {journey.isLoading && !journey.data && (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress size="sm" sx={{ color: T.purple }} />
          </Box>
        )}

        {/* Journey List */}
        {groupedJourneys.length > 0 ? (
          <Stack spacing={2}>
            {groupedJourneys.map((j, idx) => {
              const srcColor = SOURCE_COLORS[j.source] || T.accent;
              const pathSteps = j.pathSteps;
              return (
                <Box
                  key={idx}
                  sx={{
                    p: 2.5,
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    bgcolor: "rgba(255,255,255,0.02)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.04)",
                      borderColor: "rgba(124,108,250,0.2)",
                    },
                  }}
                >
                  {/* Journey Header Row */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Chip
                        size="sm"
                        variant="soft"
                        sx={{
                          bgcolor: `${srcColor}18`,
                          color: srcColor,
                          fontWeight: 700,
                          fontSize: "11px",
                        }}
                      >
                        {SOURCE_LABELS[j.source] || j.source}
                      </Chip>
                      <Typography level="body-xs" sx={{ color: T.textSecondary, fontStyle: 'italic', ml: 1 }}>
                        <Typography sx={{ color: T.textPrimary, fontWeight: 700 }}>{j.count}</Typography> visitor{j.count !== 1 ? 's' : ''} took this specific journey
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ textAlign: "right" }}>
                        <Typography level="body-xs" sx={{ color: T.textSecondary, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          Pages
                        </Typography>
                        <Typography level="body-sm" sx={{ color: T.textPrimary, fontWeight: 800 }}>
                          {j.pages_visited}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>

                  {/* Journey Path Visualization */}
                  <Stack direction="row" spacing={0} alignItems="center" sx={{ flexWrap: "wrap", gap: 0.75 }}>
                    {pathSteps.map((step: string, sIdx: number) => {
                      const isEntry = sIdx === 0;
                      const isExit = sIdx === pathSteps.length - 1;
                      return (
                        <React.Fragment key={sIdx}>
                          {sIdx > 0 && (
                            <HugeiconsIcon
                              icon={ArrowRight01Icon}
                              size={12}
                              style={{ color: "rgba(255,255,255,0.15)", flexShrink: 0 }}
                            />
                          )}
                          <Chip
                            size="sm"
                            variant={isEntry ? "solid" : "outlined"}
                            sx={{
                              px: 1.5,
                              borderRadius: "8px",
                              fontSize: "11px",
                              fontWeight: isEntry || isExit ? 700 : 500,
                              fontFamily: "monospace",
                              ...(isEntry
                                ? {
                                  bgcolor: srcColor,
                                  color: "#0D0F14",
                                  boxShadow: `0 0 12px ${srcColor}40`,
                                }
                                : isExit
                                  ? {
                                    borderColor: "rgba(244,96,74,0.4)",
                                    color: "#f4604a",
                                    bgcolor: "rgba(244,96,74,0.06)",
                                  }
                                  : {
                                    borderColor: "rgba(255,255,255,0.08)",
                                    color: T.textSecondary,
                                  }),
                            }}
                          >
                            {step}
                          </Chip>
                        </React.Fragment>
                      );
                    })}
                  </Stack>

                  {/* Entry / Exit labels */}
                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 1.5, px: 0.5 }}>
                    <Typography level="body-xs" sx={{ color: srcColor, fontWeight: 700, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      ● ENTRY — {j.entry_page}
                    </Typography>
                    <Typography level="body-xs" sx={{ color: "#f4604a", fontWeight: 700, fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      EXIT — {j.exit_page} ●
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        ) : (
          !journey.isLoading && (
            <Box
              sx={{
                p: 4,
                textAlign: "center",
                border: "1px dashed rgba(255,255,255,0.1)",
                borderRadius: "20px",
              }}
            >
              <Typography level="body-sm" sx={{ color: T.textSecondary }}>
                No visitor journeys recorded yet. Sessions appear here once AI-referred visitors land on your site.
              </Typography>
            </Box>
          )
        )}
      </Card>
    </Stack>
  );
}
