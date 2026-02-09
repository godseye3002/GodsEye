"use client";

import { useEffect, useState } from "react";
import { Button, Card, Typography, Stack, Box, Alert } from "@mui/joy";
import InsightsIcon from "@mui/icons-material/Insights";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { startGoogleDeepAnalysis, startPerplexityDeepAnalysis } from "@/lib/deepAnalysisApi";
import { useAnalysisListener } from "@/hooks/useAnalysisListener";

interface DeepAnalysisCardProps {
  engine: 'google' | 'perplexity';
  productId: string;
  analysisHash: string | null;
  isAnalysisUpToDate: boolean;
}

export default function DeepAnalysisCard({
  engine,
  productId,
  analysisHash,
  isAnalysisUpToDate,
}: DeepAnalysisCardProps) {
  const engineLabel = engine === 'google' ? 'Google AI Overview' : 'Perplexity Citations';
  const [showCopyNotification, setShowCopyNotification] = useState(false);
  const [isStartingAnalysis, setIsStartingAnalysis] = useState(false);
  const [startAnalysisError, setStartAnalysisError] = useState<string | null>(null);
  const [showStartSuccess, setShowStartSuccess] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const {
    status: liveAnalysisStatus,
    data: latestAnalysisRow,
    setStatus: setLiveAnalysisStatus,
  } = useAnalysisListener(productId, engine);

  const hasRealtimeAnalysis = Boolean(latestAnalysisRow);
  const hasAnalysisData = Boolean(analysisHash) || hasRealtimeAnalysis;
  const isAnalysisCurrentlyUpToDate = Boolean(isAnalysisUpToDate || hasRealtimeAnalysis);

  const isCompleted = hasAnalysisData;

  useEffect(() => {
    // When realtime insert arrives (or backend up-to-date flag is true), stop showing "processing"
    if (isAnalysisUpToDate || hasRealtimeAnalysis) {
      setLiveAnalysisStatus('completed');
    }
  }, [isAnalysisUpToDate, hasRealtimeAnalysis, setLiveAnalysisStatus]);

  const startDeepAnalysis = async () => {
    if (isStartingAnalysis || liveAnalysisStatus === 'processing') {
      return;
    }

    // Check internet connectivity first
    try {
      const response = await fetch('https://httpbin.org/get', { 
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      if (!response.ok) throw new Error('Network check failed');
      setConnectionError(null);
    } catch (err) {
      setConnectionError('Poor internet connection detected. Please check your connection and try again.');
      return;
    }

    let retries = 0;
    const maxRetries = 2;
    const retryDelay = 2000; // 2 seconds between retries

    while (retries < maxRetries) {
      try {
        setIsStartingAnalysis(true);
        setStartAnalysisError(null);
        setShowStartSuccess(false);
        setLiveAnalysisStatus('processing');

        if (engine === 'google') {
          await startGoogleDeepAnalysis(productId);
        } else {
          await startPerplexityDeepAnalysis(productId);
        }

        // Success - exit retry loop
        setShowStartSuccess(true);
        setTimeout(() => setShowStartSuccess(false), 5000);
        // Don't set to completed here - let realtime handle it
        // Keep status as 'processing' until realtime data arrives
        break; // Exit while loop on success
        
      } catch (err) {
        retries++;
        
        if (retries >= maxRetries) {
          // Final attempt failed - show error
          const message = err instanceof Error ? err.message : 'Failed to start deep analysis after multiple attempts';
          setStartAnalysisError(message);
          setLiveAnalysisStatus('completed');
        } else {
          // Retry attempt - show retry message in console only
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[DeepAnalysis] Attempt ${retries} failed, retrying in ${retryDelay}ms...`, err);
          }
          // Brief pause before retry
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      } finally {
        setIsStartingAnalysis(false);
      }
    }
  };

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
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to copy text: ', err);
      }
      
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
              {isAnalysisCurrentlyUpToDate ? (
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
                    New query data available, start new deep analysis
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
              onClick={startDeepAnalysis}
              disabled={isStartingAnalysis || liveAnalysisStatus === 'processing'}
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
              {isStartingAnalysis ? 'Starting…' : liveAnalysisStatus === 'processing' ? 'Analyzing…' : 'Start Deep Analysis'}
            </Button>

            {showStartSuccess && (
              <Alert
                variant="soft"
                color="success"
                sx={{
                  mt: 2,
                  backgroundColor: "rgba(46, 212, 122, 0.1)",
                  color: "#2ED47A",
                  border: "1px solid rgba(46, 212, 122, 0.3)",
                }}
              >
                Request submitted successfully. It will take a few minutes to complete.
              </Alert>
            )}

            {liveAnalysisStatus === 'processing' && (
              <Alert
                variant="soft"
                color="warning"
                sx={{
                  mt: 1.5,
                  border: "1px solid rgba(245, 158, 11, 0.35)",
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  color: "#F59E0B",
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ 
                    width: 8, 
                    height: 8, 
                    borderRadius: '50%', 
                    backgroundColor: '#F59E0B',
                    animation: 'pulse 1.5s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1 },
                      '50%': { opacity: 0.3 }
                    }
                  }} />
                  <Typography level="body-sm" sx={{ fontWeight: 500 }}>
                    Deep analysis is running. This typically takes 2-5 minutes. You'll be notified when complete.
                  </Typography>
                </Box>
              </Alert>
            )}

            {startAnalysisError && (
              <Alert
                variant="soft"
                color="danger"
                sx={{
                  mt: 2,
                  border: "1px solid rgba(243, 91, 100, 0.35)",
                  backgroundColor: "rgba(243, 91, 100, 0.08)",
                }}
              >
                {startAnalysisError}
              </Alert>
            )}
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
                The GodsEye MCP connects your AI coding agent (Cursor, Windsurf, Claude Desktop) directly to the GodsEye AEO Database. It injects the "Godseyes AEO Analysis" directly into your workspace and enables automatic Gap Analysis.
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
                  {`{\n  \"mcpServers\": {\n    \"godseye\": {\n      \"url\": \"https://godseye-mcp-production.up.railway.app/sse\",\n      \"type\": \"sse\"\n    }\n  }\n}`}
                </Box>
                <Button
                  size="sm"
                  variant="plain"
                  onClick={() => copyToClipboard(`{\n  "mcpServers": {\n    "godseye": {\n      "url": "https://godseye-mcp-production.up.railway.app/sse",\n      "type": "sse"\n    }\n  }\n}`)}
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
                  {`{\n  \"mcpServers\": {\n    \"godseye\": {\n      \"command\": \"npx\",\n      \"args\": [\n        \"-y\",\n        \"mcp-remote\",\n        \"https://godseye-mcp-production.up.railway.app/sse\",\n        \"--transport\",\n        \"sse-only\"\n      ]\n    }\n  }\n}`}
                </Box>
                <Button
                  size="sm"
                  variant="plain"
                  onClick={() => copyToClipboard(`{\n  \"mcpServers\": {\n    \"godseye\": {\n      \"command\": \"npx\",\n      \"args\": [\n        \"-y\",\n        \"mcp-remote\",\n        \"https://godseye-mcp-production.up.railway.app/sse\",\n        \"--transport\",\n        \"sse-only\"\n      ]\n    }\n  }\n}`)}
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

              <Typography level="body-sm" sx={{ color: "#F59E0B", fontWeight: 600, mb: 1, mt: 2 }}>
                ⚠️ Important: Plan File Location Issue
              </Typography>

              <Typography level="body-sm" sx={{ color: "rgba(245, 158, 11, 0.88)", lineHeight: 1.6 }}>
                <strong>Problem:</strong> MCP creates the optimization plan in a file, but your Vibe coding agent might download it to a different folder. You need to manually locate this file and move it to your project root directory (or any folder in the project) before optimization can proceed.
              </Typography>

              <Typography level="body-sm" sx={{ color: "rgba(245, 158, 11, 0.88)", lineHeight: 1.6, mt: 1 }}>
                <strong>Action Required:</strong> Before starting optimization, mention the exact file location to your agent and instruct it to proceed with the AEO improvements.
              </Typography>
            </Box>

                {isAnalysisCurrentlyUpToDate ? (
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
                onClick={startDeepAnalysis}
                disabled={liveAnalysisStatus === 'processing'}
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
                {liveAnalysisStatus === 'processing' ? 'Analyzing…' : 'Start New Deep Analysis'}
              </Button>
            )}

            {showStartSuccess && (
              <Alert
                variant="soft"
                color="success"
                sx={{
                  mt: 2,
                  backgroundColor: "rgba(46, 212, 122, 0.1)",
                  color: "#2ED47A",
                  border: "1px solid rgba(46, 212, 122, 0.3)",
                  borderRadius: "8px",
                }}
              >
                Request submitted successfully. It will take a few minutes to complete.
              </Alert>
            )}

            {connectionError && (
              <Alert
                variant="soft"
                color="warning"
                sx={{
                  mt: 2,
                  border: "1px solid rgba(245, 158, 11, 0.35)",
                  backgroundColor: "rgba(245, 158, 11, 0.08)",
                  color: "#F59E0B",
                }}
              >
                {connectionError}
              </Alert>
            )}

            {startAnalysisError && (
              <Alert
                variant="soft"
                color="danger"
                sx={{
                  mt: 2,
                  border: "1px solid rgba(243, 91, 100, 0.35)",
                  backgroundColor: "rgba(243, 91, 100, 0.08)",
                }}
              >
                {startAnalysisError}
              </Alert>
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
