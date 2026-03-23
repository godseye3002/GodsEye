"use client";

import { 
  Box, 
  Card, 
  Typography, 
  Table, 
  Sheet, 
  Stack, 
  Chip,
  CircularProgress,
  Divider
} from "@mui/joy";
import { useConversions } from "@/hooks/useConversions";
import { HugeiconsIcon } from "@hugeicons/react";
import { ZapIcon, Analytics01Icon } from "@hugeicons/core-free-icons";

const SOURCE_LABELS: Record<string, string> = {
  chatgpt:            "ChatGPT",
  perplexity:         "Perplexity",
  claude:             "Claude",
  bing_copilot:       "Bing Copilot",
  google_ai_mode:     "Google AI Mode",
  google_unclassified: "Google",
};

export default function ConversionStats({ productId, userId }: { productId?: string, userId?: string }) {
  const { data, error, isLoading } = useConversions(productId, userId);

  // Design Tokens - Consistent with Optimize Page
  const textPrimary = "#F2F5FA";
  const textSecondary = "rgba(242, 245, 250, 0.6)";
  const accentColor = "#2ED47A";
  const borderColor = "rgba(46, 212, 122, 0.15)";
  const surfaceBase = "linear-gradient(135deg, rgba(13, 15, 20, 0.8), rgba(10, 12, 16, 0.9))";

  if (isLoading) {
    return (
      <Card variant="outlined" sx={{ p: 4, background: surfaceBase, borderColor, borderRadius: "24px", minHeight: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress size="md" sx={{ color: accentColor }} />
          <Typography level="body-sm" sx={{ color: textSecondary, fontStyle: 'italic' }}>Loading Conversion Insights...</Typography>
        </Stack>
      </Card>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" sx={{ p: 4, background: "rgba(255, 0, 0, 0.05)", border: "1px solid rgba(255, 0, 0, 0.2)", borderRadius: "24px" }}>
        <Typography color="danger" level="title-md">⚠️ Failed to Load Conversions</Typography>
        <Typography level="body-sm" sx={{ color: "rgba(255, 0, 0, 0.5)", mt: 1 }}>{error.message}</Typography>
      </Card>
    );
  }

  if (!data?.length) {
    return (
      <Card variant="outlined" sx={{ p: 4, background: surfaceBase, borderColor, borderRadius: "24px", opacity: 0.8 }}>
        <Stack spacing={2} alignItems="center" textAlign="center">
          <HugeiconsIcon icon={Analytics01Icon} size={32} style={{ color: textSecondary, opacity: 0.5 }} />
          <Typography level="title-sm" sx={{ color: textSecondary }}>No conversion data available yet for this project.</Typography>
        </Stack>
      </Card>
    );
  }

  // Filter if productId is provided. 
  const filtered = productId ? data.filter(d => d.product_id === productId) : data;
  
  if (!filtered.length) {
    return (
      <Card variant="outlined" sx={{ p: 4, background: surfaceBase, borderColor, borderRadius: "24px" }}>
        <Typography level="body-md" textAlign="center" sx={{ color: textSecondary }}>No conversions linked to this product.</Typography>
      </Card>
    );
  }

  const total = filtered.reduce((sum, row) => sum + row.conversions, 0);

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
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Stack spacing={0.5}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HugeiconsIcon icon={ZapIcon} size={20} style={{ color: accentColor }} />
            <Typography level="h3" sx={{ color: textPrimary, fontSize: "1.5rem", fontWeight: 800 }}>
              AI Conversions
            </Typography>
          </Box>
          <Typography level="body-sm" sx={{ color: textSecondary }}>
            Conversion metrics driven by AI Search Referrals
          </Typography>
        </Stack>
        <Chip 
          variant="soft" 
          size="sm" 
          sx={{ 
            backgroundColor: "rgba(46, 212, 122, 0.1)", 
            color: accentColor,
            border: "1px solid rgba(46, 212, 122, 0.2)",
            fontWeight: 600
          }}
        >
          LIVE UPDATES
        </Chip>
      </Box>

      <Stack direction="row" spacing={4} sx={{ mb: 4, alignItems: 'center' }}>
        <Box>
          <Typography level="body-xs" sx={{ color: textSecondary, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
            Total Conversions
          </Typography>
          <Typography level="h1" sx={{ color: accentColor, fontSize: "3rem", fontWeight: 900, textShadow: "0 0 40px rgba(46, 212, 122, 0.2)" }}>
            {total.toLocaleString()}
          </Typography>
        </Box>
        <Divider orientation="vertical" sx={{ opacity: 0.1 }} />
      </Stack>

      <Sheet 
        variant="plain" 
        sx={{ 
          backgroundColor: "transparent",
          borderRadius: "12px",
          border: `1px solid rgba(242, 245, 250, 0.05)`,
          overflow: 'hidden'
        }}
      >
        <Table 
          variant="plain"
          sx={{ 
            "--TableCell-paddingX": "20px",
            "--TableCell-paddingY": "16px",
            backgroundColor: 'transparent',
            '& thead th': {
              backgroundColor: 'rgba(242, 245, 250, 0.03)',
              color: textSecondary,
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              borderBottom: `1px solid rgba(242, 245, 250, 0.05)`
            },
            '& tbody tr': {
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: 'rgba(242, 245, 250, 0.02)'
              }
            },
            '& td': {
              color: textPrimary,
              borderBottom: `1px solid rgba(242, 245, 250, 0.03)`
            }
          }}
        >
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Source</th>
              <th style={{ textAlign: 'right' }}>Volume</th>
              <th style={{ textAlign: 'right' }}>Market Share</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => (
              <tr key={`${row.product_id}-${row.source}`}>
                <td style={{ fontWeight: 600 }}>
                  {SOURCE_LABELS[row.source] ?? row.source}
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'monospace', fontSize: '1rem', color: accentColor }}>
                  {row.conversions.toLocaleString()}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Typography 
                    level="body-sm" 
                    sx={{ color: textSecondary, fontWeight: 500 }}
                  >
                    {total > 0 ? ((row.conversions / total) * 100).toFixed(1) : 0}%
                  </Typography>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Sheet>
    </Card>
  );
}
