"use client";

import { useState } from "react";
import { Button, Card, Typography, Stack, Box, Alert } from "@mui/joy";
import InsightsIcon from "@mui/icons-material/Insights";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

interface DeepAnalysisCardProps {
  engine: 'google' | 'perplexity';
  productId: string;
  analysisHash: string | null;
  isAnalysisUpToDate: boolean;
  onStartAnalysis: () => void;
}

export default function DeepAnalysisCard({
  engine,
  productId,
  analysisHash,
  isAnalysisUpToDate,
  onStartAnalysis,
}: DeepAnalysisCardProps) {
  const engineLabel = engine === 'google' ? 'Google AI Overview' : 'Perplexity Citations';
  const isCompleted = Boolean(analysisHash);
  const [showCopyNotification, setShowCopyNotification] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[DeepAnalysisCard] Copying to clipboard:', {
          textLength: text.length,
          textPreview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
          timestamp: new Date().toISOString(),
        });
      }
      
      await navigator.clipboard.writeText(text);
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 2000);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('[DeepAnalysisCard] Copy successful, notification shown');
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      
      if (process.env.NODE_ENV !== 'production') {
        console.error('[DeepAnalysisCard] Copy failed:', {
          error: err,
          errorType: err instanceof Error ? err.constructor.name : typeof err,
          timestamp: new Date().toISOString(),
        });
      }
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        p: 3,
        backgroundColor: "rgba(17, 19, 24, 0.95)",
        border: "1px solid rgba(46, 212, 122, 0.14)",
        borderRadius: "12px",
        mt: 3,
      }}
    >
      <Stack spacing={3}>
        {/* Header */}
        <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
          <Stack direction="row" spacing={2} alignItems="center">
            <InsightsIcon sx={{ fontSize: 24, color: "#2ED47A" }} />
            <Typography level="h3" sx={{ color: "#F2F5FA", fontWeight: 600 }}>
              Deep Analysis
            </Typography>
          </Stack>
          
          {isCompleted && (
            <Stack direction="row" spacing={1} alignItems="center">
              {isAnalysisUpToDate ? (
                <>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#2ED47A",
                    }}
                  />
                  <Typography level="body-sm" sx={{ color: "#2ED47A", fontWeight: 500 }}>
                    Up to date
                  </Typography>
                </>
              ) : (
                <>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: "#F59E0B",
                    }}
                  />
                  <Typography level="body-sm" sx={{ color: "#F59E0B", fontWeight: 500 }}>
                    New data available
                  </Typography>
                </>
              )}
            </Stack>
          )}
        </Stack>

        {!isCompleted ? (
          <>
            {/* Default State */}
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
                Run a deep audit of {engineLabel} answers and compare them with your page to produce an implementation-ready strategy.
                The output is designed for AI coding agents so they can apply the recommended content + structure changes directly in your repo.
              </Typography>
            </Box>

            <Button
              variant="solid"
              color="success"
              startDecorator={<TrendingUpIcon />}
              onClick={onStartAnalysis}
              sx={{
                width: "100%",
                backgroundColor: "#2ED47A",
                color: "#0D0F14",
                "&:hover": {
                  backgroundColor: "#26B869",
                  boxShadow: "0 6px 20px rgba(46, 212, 122, 0.3)",
                },
                fontWeight: 600,
                py: 1.5,
                fontSize: "1rem",
              }}
            >
              Start Deep Analysis
            </Button>
          </>
        ) : (
          <>
            {/* Documentation State */}
            <Box sx={{
              p: 2.5,
              backgroundColor: "rgba(46, 212, 122, 0.05)",
              border: "1px solid rgba(46, 212, 122, 0.1)",
              borderRadius: "8px",
            }}>
              <Typography level="body-md" sx={{
                color: "#F2F5FA",
                lineHeight: 1.6,
                fontWeight: 600,
                mb: 2,
              }}>
                👁️ GodsEye MCP: Integration Guide
              </Typography>

              <Typography level="body-sm" sx={{
                color: "rgba(162, 167, 180, 0.88)",
                lineHeight: 1.6,
                mb: 2,
              }}>
                The GodsEye MCP connects your AI coding agent (Cursor, Windsurf, Claude Desktop) directly to the GodsEye AEO Database. It injects the "Winning Content DNA" directly into your workspace and enables automatic Gap Analysis.
              </Typography>

              <Typography level="body-sm" sx={{ color: "#F2F5FA", fontWeight: 600, mb: 1 }}>
                ⚙️ Installation
              </Typography>

              <Typography level="body-sm" sx={{
                color: "rgba(162, 167, 180, 0.88)",
                lineHeight: 1.6,
                mb: 2,
              }}>
                Add the following configuration to your MCP settings file:
              </Typography>

              <Typography level="body-sm" sx={{
                color: "rgba(162, 167, 180, 0.88)",
                lineHeight: 1.6,
                mb: 1,
                fontWeight: 600,
              }}>
                SSE Configuration (For Cursor & Windsurf) (Recommended)
              </Typography>

              <Box sx={{ position: "relative", mb: 2 }}>
                <Box sx={{
                  p: 1.5,
                  backgroundColor: "rgba(13, 15, 20, 0.6)",
                  border: "1px solid rgba(46, 212, 122, 0.12)",
                  borderRadius: "8px",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                  fontSize: "0.85rem",
                  color: "rgba(242, 245, 250, 0.92)",
                  whiteSpace: "pre-wrap",
                  pr: 4,
                }}>
                  {`{\n  \"mcpServers\": {\n    \"godseye\": {\n      \"url\": \"https://godseye-mcp.onrender.com/sse\",\n      \"type\": \"sse\"\n    }\n  }\n}`}
                </Box>
                <Button
                  size="sm"
                  variant="plain"
                  onClick={() => copyToClipboard(`{\n  "mcpServers": {\n    "godseye": {\n      "url": "https://godseye-mcp.onrender.com/sse",\n      "type": "sse"\n    }\n  }\n}`)}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    p: 0.5,
                    minWidth: "auto",
                    color: "rgba(162, 167, 180, 0.7)",
                    "&:hover": {
                      color: "#2ED47A",
                      backgroundColor: "rgba(46, 212, 122, 0.1)",
                    },
                  }}
                >
                  <ContentCopyIcon sx={{ fontSize: 16 }} />
                </Button>
              </Box>

              <Typography level="body-sm" sx={{
                color: "rgba(162, 167, 180, 0.88)",
                lineHeight: 1.6,
                mb: 1,
                fontWeight: 600,
              }}>
                Option 2: For Claude Desktop
              </Typography>

              <Typography level="body-sm" sx={{
                color: "rgba(162, 167, 180, 0.88)",
                lineHeight: 1.6,
                mb: 2,
              }}>
                Claude Desktop requires a local bridge to connect to remote servers.
              </Typography>

              <Box sx={{ position: "relative", mb: 2 }}>
                <Box sx={{
                  p: 1.5,
                  backgroundColor: "rgba(13, 15, 20, 0.6)",
                  border: "1px solid rgba(46, 212, 122, 0.12)",
                  borderRadius: "8px",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                  fontSize: "0.85rem",
                  color: "rgba(242, 245, 250, 0.92)",
                  whiteSpace: "pre-wrap",
                  pr: 4,
                }}>
                  {`{\n  \"mcpServers\": {\n    \"godseye\": {\n      \"command\": \"npx\",\n      \"args\": [\n        \"-y\",\n        \"@modelcontextprotocol/server-sse-client\",\n        \"https://godseye-mcp.onrender.com/sse\"\n      ]\n    }\n  }\n}`}
                </Box>
                <Button
                  size="sm"
                  variant="plain"
                  onClick={() => copyToClipboard(`{\n  "mcpServers": {\n    "godseye": {\n      "command": "npx",\n      "args": [\n        "-y",\n        "@modelcontextprotocol/server-sse-client",\n        "https://godseye-mcp.onrender.com/sse"\n      ]\n    }\n  }\n}`)}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    p: 0.5,
                    minWidth: "auto",
                    color: "rgba(162, 167, 180, 0.7)",
                    "&:hover": {
                      color: "#2ED47A",
                      backgroundColor: "rgba(46, 212, 122, 0.1)",
                    },
                  }}
                >
                  <ContentCopyIcon sx={{ fontSize: 16 }} />
                </Button>
              </Box>

              <Typography level="body-sm" sx={{ color: "#F2F5FA", fontWeight: 600, mb: 1 }}>
                🚀 How to Use
              </Typography>

              <Stack spacing={2} sx={{ mb: 2 }}>
                <Box>
                  <Typography level="body-sm" sx={{ color: "#2ED47A", fontWeight: 600, mb: 1 }}>
                    For Cursor & Windsurf
                  </Typography>
                  <Typography level="body-sm" sx={{ color: "rgba(162, 167, 180, 0.88)", lineHeight: 1.6 }}>
                    1. Open Chat (⌘+L or Ctrl+L)<br/>
                    2. Type <strong>@godseye</strong> to select the server<br/>
                    3. Enter your prompt with the Product UUID
                  </Typography>
                </Box>

                <Box>
                  <Typography level="body-sm" sx={{ color: "#9333EA", fontWeight: 600, mb: 1 }}>
                    For Claude Desktop
                  </Typography>
                  <Typography level="body-sm" sx={{ color: "rgba(162, 167, 180, 0.88)", lineHeight: 1.6 }}>
                    1. Open a new chat<br/>
                    2. Simply ask clearly for the tool by name
                  </Typography>
                </Box>
              </Stack>

              <Typography level="body-sm" sx={{ color: "#F2F5FA", fontWeight: 600, mb: 1 }}>
                Configuration Notes
              </Typography>

              <Stack spacing={1} sx={{ mb: 2 }}>
                <Typography level="body-sm" sx={{ color: "rgba(162, 167, 180, 0.88)" }}>
                  • <strong>SSE Configuration</strong>: Use the recommended SSE setup for Cursor & Windsurf
                </Typography>
                <Typography level="body-sm" sx={{ color: "rgba(162, 167, 180, 0.88)" }}>
                  • <strong>For Claude Desktop</strong>: Use the local bridge setup with npx command
                </Typography>
              </Stack>

              <Typography level="body-sm" sx={{ color: "#F2F5FA", fontWeight: 600, mb: 1 }}>
                Example Prompts
              </Typography>

              <Box sx={{ position: "relative", mb: 2 }}>
                <Box sx={{
                  p: 1.5,
                  backgroundColor: "rgba(13, 15, 20, 0.6)",
                  border: "1px solid rgba(46, 212, 122, 0.12)",
                  borderRadius: "8px",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
                  fontSize: "0.85rem",
                  color: "rgba(242, 245, 250, 0.92)",
                  whiteSpace: "pre-wrap",
                  pr: 4,
                }}>
                  {`// Cursor & Windsurf:\n@godseye fetch the AEO analysis for product ID ${productId}\n\n// Claude Desktop:\nUse the GodsEye tool to fetch the analysis for product ID ${productId}`}
                </Box>
                <Button
                  size="sm"
                  variant="plain"
                  onClick={() => copyToClipboard(`// Cursor & Windsurf:\n@godseye fetch the AEO analysis for product ID ${productId}\n\n// Claude Desktop:\nUse the GodsEye tool to fetch the analysis for product ID ${productId}`)}
                  sx={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    p: 0.5,
                    minWidth: "auto",
                    color: "rgba(162, 167, 180, 0.7)",
                    "&:hover": {
                      color: "#2ED47A",
                      backgroundColor: "rgba(46, 212, 122, 0.1)",
                    },
                  }}
                >
                  <ContentCopyIcon sx={{ fontSize: 16 }} />
                </Button>
              </Box>

              <Typography level="body-sm" sx={{ color: "#F2F5FA", fontWeight: 600, mb: 1 }}>
                🔄 Workflow
              </Typography>

              <Stack spacing={1} sx={{ mb: 2 }}>
                <Typography level="body-sm" sx={{ color: "rgba(162, 167, 180, 0.88)" }}>
                  1. The tool creates <code>.godseye_aeo_plan_YYYY-MM-DD.md</code> in your workspace
                </Typography>
                <Typography level="body-sm" sx={{ color: "rgba(162, 167, 180, 0.88)" }}>
                  2. Ask your AI to read the plan and compare it with your code
                </Typography>
                <Typography level="body-sm" sx={{ color: "rgba(162, 167, 180, 0.88)" }}>
                  3. Let the AI apply structural changes and content optimizations
                </Typography>
              </Stack>

              <Typography level="body-sm" sx={{ color: "#F2F5FA", fontWeight: 600, mb: 1 }}>
                📋 Features
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography level="body-sm" sx={{ color: "rgba(162, 167, 180, 0.88)" }}>
                  • <strong>Persistence:</strong> Auto-saves analysis to local Markdown file<br/>
                  • <strong>Gap Analysis:</strong> Compares actual code vs required AEO structure<br/>
                  • <strong>Context Aware:</strong> AI asks for product-specific context
                </Typography>
              </Box>

              <Typography level="body-sm" sx={{ color: "#F35B64", fontWeight: 600, mb: 1 }}>
                ⚠️ Troubleshooting
              </Typography>

              <Typography level="body-sm" sx={{ color: "rgba(162, 167, 180, 0.88)" }}>
                • <strong>"Product Not Found":</strong> Ensure the UUID is correct<br/>
                • <strong>"Unauthorized":</strong> Ensure your user ID matches the product owner
              </Typography>
            </Box>

            {isAnalysisUpToDate ? (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: "8px",
                  border: "1px solid rgba(46, 212, 122, 0.25)",
                  backgroundColor: "rgba(46, 212, 122, 0.08)",
                }}
              >
                <Typography level="body-md" sx={{ color: "#2ED47A", fontWeight: 600 }}>
                  ✅ This analysis is up to date.
                </Typography>
                <Typography level="body-sm" sx={{ color: "rgba(162, 167, 180, 0.88)", mt: 0.5 }}>
                  Run more queries to increase the accuracy of the analysis and to enable deep analysis.
                </Typography>
              </Box>
            ) : (
              <Button
                variant="outlined"
                color="neutral"
                onClick={onStartAnalysis}
                sx={{
                  width: "100%",
                  borderColor: "rgba(46, 212, 122, 0.36)",
                  color: "#F2F5FA",
                  backgroundColor: "transparent",
                  "&:hover": {
                    backgroundColor: "rgba(46, 212, 122, 0.1)",
                    borderColor: "rgba(46, 212, 122, 0.6)",
                    color: "#2ED47A",
                  },
                  fontWeight: 600,
                  py: 1.4,
                }}
              >
                Start New Deep Analysis
              </Button>
            )}
          </>
        )}
      </Stack>
    
    {/* Copy Notification */}
    {showCopyNotification && (
      <Box
        sx={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          animation: "slideIn 0.3s ease-out",
          "@keyframes slideIn": {
            from: {
              transform: "translateX(100%)",
              opacity: 0,
            },
            to: {
              transform: "translateX(0)",
              opacity: 1,
            },
          },
        }}
      >
        <Alert
          startDecorator={<CheckCircleIcon />}
          variant="soft"
          color="success"
          sx={{
            backgroundColor: "rgba(46, 212, 122, 0.1)",
            color: "#2ED47A",
            border: "1px solid rgba(46, 212, 122, 0.3)",
            boxShadow: "0 4px 12px rgba(46, 212, 122, 0.2)",
          }}
        >
          Copied to clipboard!
        </Alert>
      </Box>
    )}
  </Card>
  );
}
