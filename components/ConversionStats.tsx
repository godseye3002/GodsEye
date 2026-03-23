"use client";

import React, { useState } from "react";
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
  Button
} from "@mui/joy";
import { useConversions } from "@/hooks/useConversions";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  ZapIcon, 
  PieChartIcon, 
  ArrowLeft01Icon, 
  PackageIcon, 
  ArrowRight01Icon,
  GlobalIcon
} from "@hugeicons/core-free-icons";

const SOURCE_LABELS: Record<string, string> = {
  chatgpt:            "ChatGPT",
  perplexity:         "Perplexity",
  claude:             "Claude",
  bing_copilot:       "Bing Copilot",
  google_ai_mode:     "Google AI Mode",
  google_unclassified: "Google",
};

export default function ConversionStats({ productId, userId }: { productId?: string, userId?: string }) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  // Fetch summary of all pages
  const summary = useConversions({ productId, userId });
  
  // Fetch detailed drill-down for a specific page (only when selected)
  const detail = useConversions({ 
    productId, 
    userId, 
    pagePath: selectedPath || undefined 
  });

  // UI Tokens
  const textPrimary = "#F2F5FA";
  const textSecondary = "rgba(242, 245, 250, 0.6)";
  const accentColor = "#2ED47A";
  const borderColor = "rgba(46, 212, 122, 0.15)";
  const surfaceBase = "linear-gradient(135deg, rgba(13, 15, 20, 0.8), rgba(10, 12, 16, 0.9))";

  // Handle Loading/Error for the first load
  if (summary.isLoading && !summary.data) {
    return (
      <Card variant="outlined" sx={{ p: 4, background: surfaceBase, borderColor, borderRadius: "24px", minHeight: 250, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress size="md" sx={{ color: accentColor }} />
          <Typography level="body-sm" sx={{ color: textSecondary, fontStyle: 'italic' }}>Syncing Global Intelligence...</Typography>
        </Stack>
      </Card>
    );
  }

  const activeData = selectedPath ? detail.data : summary.data;
  const activeLoading = selectedPath ? detail.isLoading : summary.isLoading;
  const activeError = selectedPath ? detail.error : summary.error;

  const renderDrillDown = () => {
    if (!selectedPath) return null;
    const pageData = activeData?.find(p => p.page_path === selectedPath);
    
    return (
      <Box sx={{ mt: 2 }}>
        <Button 
          variant="plain" 
          size="sm"
          startDecorator={<HugeiconsIcon icon={ArrowLeft01Icon} size={16} />}
          onClick={() => setSelectedPath(null)}
          sx={{ mb: 2, color: textSecondary, '&:hover': { color: textPrimary, bgcolor: 'rgba(255,255,255,0.05)' } }}
        >
          Back to all pages
        </Button>

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Stack spacing={0.5}>
            <Typography level="body-xs" sx={{ color: accentColor, fontWeight: 700, letterSpacing: '0.1em' }}>DRILL-DOWN ACTIVE</Typography>
            <Typography level="h4" sx={{ color: textPrimary }}>{pageData?.page_description || "Page Details"}</Typography>
            <Typography level="body-xs" sx={{ color: textSecondary, fontFamily: 'monospace' }}>{selectedPath}</Typography>
          </Stack>
          <Box sx={{ textAlign: 'right' }}>
            <Typography level="h2" sx={{ color: accentColor, fontWeight: 800 }}>{pageData?.total_conversions || 0}</Typography>
            <Typography level="body-xs" sx={{ color: textSecondary }}>Total conversions on this page</Typography>
          </Box>
        </Stack>

        <Sheet variant="plain" sx={{ backgroundColor: 'transparent', borderRadius: '16px', border: `1px solid ${borderColor}`, overflow: 'hidden' }}>
          <Table sx={{ 
            '& thead th': { bgcolor: 'rgba(255,255,255,0.02)', color: textSecondary, fontWeight: 700, textTransform: 'uppercase', fontSize: '10px' },
            '& td': { color: textPrimary, borderColor: 'rgba(255,255,255,0.05)' }
          }}>
            <thead>
              <tr>
                <th>Traffic Source</th>
                <th style={{ textAlign: 'right' }}>Total Visits</th>
                <th style={{ textAlign: 'right' }}>Conv. Volume</th>
                <th style={{ textAlign: 'right' }}>Conv. Rate</th>
              </tr>
            </thead>
            <tbody>
              {pageData?.sources.map((s, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{SOURCE_LABELS[s.source] || s.source}</td>
                  <td style={{ textAlign: 'right', color: textSecondary }}>{s.total_visits.toLocaleString()}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: accentColor }}>{s.conversions.toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Chip size="sm" variant="soft" sx={{ bgcolor: 'rgba(46, 212, 122, 0.1)', color: accentColor, fontWeight: 700 }}>
                      {s.conversion_rate.toFixed(2)}%
                    </Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Sheet>
      </Box>
    );
  };

  const renderSummary = () => {
    if (selectedPath) return null;
    return (
      <Box sx={{ mt: 3 }}>
        <Typography level="title-md" sx={{ color: textSecondary, mb: 2, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '11px', fontWeight: 700 }}>
          Conversion Performance By Page
        </Typography>
        <Stack spacing={1.5}>
          {summary.data?.map((page, idx) => (
            <Card 
              key={idx}
              variant="outlined"
              onClick={() => setSelectedPath(page.page_path)}
              sx={{ 
                p: 2, 
                bgcolor: 'rgba(255,255,255,0.02)', 
                borderColor: 'rgba(255,255,255,0.05)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', borderColor: accentColor, transform: 'translateY(-2px)' }
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Stack spacing={0.5}>
                  <Typography level="title-sm" sx={{ color: textPrimary }}>{page.page_description}</Typography>
                  <Typography level="body-xs" sx={{ color: textSecondary, fontFamily: 'monospace' }}>{page.page_path}</Typography>
                </Stack>
                <Stack direction="row" spacing={3} alignItems="center">
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography level="title-md" sx={{ color: accentColor, fontWeight: 800 }}>{page.total_conversions}</Typography>
                    <Typography level="body-xs" sx={{ color: textSecondary }}>Conversions</Typography>
                  </Box>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} style={{ color: textSecondary }} />
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      </Box>
    );
  };

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        p: 4, 
        background: surfaceBase, 
        backdropFilter: "blur(20px)",
        borderColor, 
        borderRadius: "24px",
        boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6)",
        position: 'relative'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Stack spacing={0.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HugeiconsIcon icon={ZapIcon} size={20} style={{ color: accentColor }} />
            <Typography level="h3" sx={{ color: textPrimary, fontSize: "1.5rem", fontWeight: 800 }}>
              Conversion Intelligence
            </Typography>
          </Box>
          <Typography level="body-sm" sx={{ color: textSecondary }}>
            Tracking {summary.data?.length || 0} unique landing paths
          </Typography>
        </Stack>
        <Chip variant="soft" size="sm" sx={{ bgcolor: "rgba(46, 212, 122, 0.1)", color: accentColor, border: `1px solid ${borderColor}` }}>
          LIVE FEED
        </Chip>
      </Box>

      {/* Grand Total Display */}
      {!selectedPath && (
        <Stack 
          direction="row" 
          spacing={4} 
          sx={{ 
            p: 3, 
            borderRadius: '20px', 
            bgcolor: 'rgba(255,255,255,0.03)',
            border: `1px solid rgba(255,255,255,0.05)`,
            mb: 2,
            alignItems: 'center'
          }}
        >
          <Box>
            <Typography level="body-xs" sx={{ color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
              Network Total
            </Typography>
            <Typography level="h1" sx={{ color: accentColor, fontSize: "3rem", fontWeight: 900 }}>
              {summary.grandTotal.toLocaleString()}
            </Typography>
          </Box>
          <Divider orientation="vertical" />
          <Stack spacing={1}>
             <Typography level="body-xs" sx={{ color: textSecondary }}>This period</Typography>
             <Box sx={{ display: 'flex', gap: 1 }}>
               <Chip startDecorator={<HugeiconsIcon icon={GlobalIcon} size={14} />} size="sm" variant="soft" sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: textPrimary }}>All Sources</Chip>
             </Box>
          </Stack>
        </Stack>
      )}

      {activeError && (
        <Typography color="danger" level="body-sm" sx={{ p: 2, bgcolor: 'rgba(255,0,0,0.05)', borderRadius: '12px' }}>
          Fetch Error: {activeError.message}
        </Typography>
      )}

      {renderSummary()}
      {renderDrillDown()}
      
      {activeLoading && selectedPath && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress size="sm" />
        </Box>
      )}
    </Card>
  );
}
