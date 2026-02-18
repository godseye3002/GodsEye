"use client";

import { useState } from "react";
import { Button, Card, Typography, Stack, Box, Alert, Container, Link } from "@mui/joy";
import InsightsIcon from "@mui/icons-material/Insights";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HomeIcon from "@mui/icons-material/Home";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function MCPDocumentationPage() {
    const [showCopyNotification, setShowCopyNotification] = useState(false);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setShowCopyNotification(true);
            setTimeout(() => setShowCopyNotification(false), 2000);
        } catch (err) {
            console.error('Failed to copy text: ', err);
        }
    };

    const accentColor = "#2ED47A";
    const textColor = "#F2F5FA";
    const textSecondary = "rgba(162, 167, 180, 0.88)";
    const cardBg = "rgba(17, 19, 24, 0.95)";
    const borderColor = "rgba(46, 212, 122, 0.14)";

    return (
        <Box sx={{ minHeight: "100vh", backgroundColor: "#0D0F14", py: 4 }}>
            <Container maxWidth="lg">
                {/* Navigation Header */}
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                    <Button
                        component="a"
                        href="/"
                        variant="plain"
                        startDecorator={<ArrowBackIcon />}
                        sx={{
                            color: textSecondary,
                            "&:hover": { color: textColor, backgroundColor: "rgba(255, 255, 255, 0.05)" }
                        }}
                    >
                        Back to Home
                    </Button>
                </Stack>

                <Card
                    variant="outlined"
                    sx={{
                        p: 4,
                        backgroundColor: cardBg,
                        border: `1px solid ${borderColor}`,
                        borderRadius: "12px",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
                    }}
                >
                    <Stack spacing={4}>
                        {/* Header */}
                        <Stack direction="row" spacing={2} alignItems="center">
                            <InsightsIcon sx={{ fontSize: 32, color: accentColor }} />
                            <Typography level="h1" sx={{ color: textColor, fontWeight: 700, fontSize: "2rem" }}>
                                GodsEye MCP: Integration Guide
                            </Typography>
                        </Stack>

                        <Typography level="body-lg" sx={{ color: textSecondary, lineHeight: 1.7 }}>
                            The GodsEye MCP connects your AI coding agent (Cursor, Windsurf, Claude Desktop) directly to the GodsEye AEO Database. It injects the "Godseyes AEO Analysis" directly into your workspace and enables automatic Gap Analysis.
                        </Typography>

                        <Box component="hr" sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                        {/* Installation Section */}
                        <Box>
                            <Typography level="h3" sx={{ color: textColor, fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                <Box component="span" sx={{ color: accentColor }}>⚙️</Box> Installation
                            </Typography>

                            <Typography level="body-md" sx={{ color: textSecondary, mb: 3 }}>
                                Add the configuration below to your MCP settings file for your preferred editor.
                            </Typography>

                            <Stack spacing={4}>
                                {/* SSE Configuration */}
                                <Box>
                                    <Typography level="title-md" sx={{ color: textColor, mb: 1.5, fontWeight: 600 }}>
                                        Option 1: SSE Configuration (For Cursor & Windsurf) <Box component="span" sx={{ color: accentColor, fontSize: "0.8em", opacity: 0.8, ml: 1 }}>(Recommended)</Box>
                                    </Typography>
                                    <Box sx={{ position: "relative" }}>
                                        <Box sx={{
                                            p: 2,
                                            backgroundColor: "rgba(13, 15, 20, 0.6)",
                                            border: `1px solid ${borderColor}`,
                                            borderRadius: "8px",
                                            fontFamily: "monospace",
                                            fontSize: "0.9rem",
                                            color: "rgba(242, 245, 250, 0.92)",
                                            whiteSpace: "pre-wrap",
                                            overflowX: "auto",
                                        }}>
                                            {`{\n  \"mcpServers\": {\n    \"godseye\": {\n      \"url\": \"https://godseye-mcp-new-production.up.railway.app/sse\",\n      \"type\": \"sse\"\n    }\n  }\n}`}
                                        </Box>
                                        <Button
                                            size="sm"
                                            variant="plain"
                                            onClick={() => copyToClipboard(`{\n  "mcpServers": {\n    "godseye": {\n      "url": "https://godseye-mcp-new-production.up.railway.app/sse",\n      "type": "sse"\n    }\n  }\n}`)}
                                            sx={{
                                                position: "absolute",
                                                top: 12,
                                                right: 12,
                                                color: "rgba(162, 167, 180, 0.7)",
                                                "&:hover": { color: accentColor, backgroundColor: "rgba(46, 212, 122, 0.1)" },
                                            }}
                                        >
                                            <ContentCopyIcon />
                                        </Button>
                                    </Box>
                                </Box>

                                {/* Claude Desktop Configuration */}
                                <Box>
                                    <Typography level="title-md" sx={{ color: textColor, mb: 1.5, fontWeight: 600 }}>
                                        Option 2: For Claude Desktop
                                    </Typography>
                                    <Box sx={{ position: "relative" }}>
                                        <Box sx={{
                                            p: 2,
                                            backgroundColor: "rgba(13, 15, 20, 0.6)",
                                            border: `1px solid ${borderColor}`,
                                            borderRadius: "8px",
                                            fontFamily: "monospace",
                                            fontSize: "0.9rem",
                                            color: "rgba(242, 245, 250, 0.92)",
                                            whiteSpace: "pre-wrap",
                                            overflowX: "auto",
                                        }}>
                                            {`{\n  \"mcpServers\": {\n    \"godseye\": {\n      \"command\": \"npx\",\n      \"args\": [\n        \"-y\",\n        \"mcp-remote\",\n        \"https://godseye-mcp-new-production.up.railway.app/sse\",\n        \"--transport\",\n        \"sse-only\"\n      ]\n    }\n  }\n}`}
                                        </Box>
                                        <Button
                                            size="sm"
                                            variant="plain"
                                            onClick={() => copyToClipboard(`{\n  "mcpServers": {\n    "godseye": {\n      "command": "npx",\n      "args": [\n        "-y",\n        "mcp-remote",\n        "https://godseye-mcp-new-production.up.railway.app/sse",\n        "--transport",\n        "sse-only"\n      ]\n    }\n  }\n}`)}
                                            sx={{
                                                position: "absolute",
                                                top: 12,
                                                right: 12,
                                                color: "rgba(162, 167, 180, 0.7)",
                                                "&:hover": { color: accentColor, backgroundColor: "rgba(46, 212, 122, 0.1)" },
                                            }}
                                        >
                                            <ContentCopyIcon />
                                        </Button>
                                    </Box>
                                </Box>
                            </Stack>
                        </Box>

                        <Box component="hr" sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                        {/* How to Use Section */}
                        <Box>
                            <Typography level="h3" sx={{ color: textColor, fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                <Box component="span" sx={{ color: accentColor }}>🚀</Box> How to Use
                            </Typography>

                            <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                                <Box sx={{ flex: 1, p: 3, borderRadius: "8px", backgroundColor: "rgba(46, 212, 122, 0.05)", border: `1px solid ${borderColor}` }}>
                                    <Typography level="title-lg" sx={{ color: accentColor, fontWeight: 600, mb: 2 }}>
                                        For Cursor & Windsurf
                                    </Typography>
                                    <Typography level="body-md" sx={{ color: textSecondary, lineHeight: 1.8 }}>
                                        1. Open Chat (⌘+L or Ctrl+L)<br />
                                        2. Type <strong>@godseye</strong> to select the server<br />
                                        3. Enter your prompt with the <strong>Product UUID</strong>
                                    </Typography>
                                </Box>

                                <Box sx={{ flex: 1, p: 3, borderRadius: "8px", backgroundColor: "rgba(147, 51, 234, 0.05)", border: "1px solid rgba(147, 51, 234, 0.2)" }}>
                                    <Typography level="title-lg" sx={{ color: "#9333EA", fontWeight: 600, mb: 2 }}>
                                        For Claude Desktop
                                    </Typography>
                                    <Typography level="body-md" sx={{ color: textSecondary, lineHeight: 1.8 }}>
                                        1. Open a new chat<br />
                                        2. simply ask clearly for the tool by name<br />
                                        3. Include the <strong>Product UUID</strong> in your request
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>

                        {/* Example Prompts */}
                        <Box>
                            <Typography level="title-md" sx={{ color: textColor, mb: 1.5, fontWeight: 600 }}>
                                Example Prompts
                            </Typography>
                            <Box sx={{ position: "relative" }}>
                                <Box sx={{
                                    p: 2,
                                    backgroundColor: "rgba(13, 15, 20, 0.6)",
                                    border: `1px solid ${borderColor}`,
                                    borderRadius: "8px",
                                    fontFamily: "monospace",
                                    fontSize: "0.9rem",
                                    color: "rgba(242, 245, 250, 0.92)",
                                    whiteSpace: "pre-wrap",
                                }}>
                                    {`// Cursor & Windsurf:\n@godseye fetch the AEO analysis for product ID [YOUR-PRODUCT-ID]\n\n// Claude Desktop:\nUse the GodsEye tool to fetch the analysis for product ID [YOUR-PRODUCT-ID]`}
                                </Box>
                                <Button
                                    size="sm"
                                    variant="plain"
                                    onClick={() => copyToClipboard(`// Cursor & Windsurf:\n@godseye fetch the AEO analysis for product ID [YOUR-PRODUCT-ID]\n\n// Claude Desktop:\nUse the GodsEye tool to fetch the analysis for product ID [YOUR-PRODUCT-ID]`)}
                                    sx={{
                                        position: "absolute",
                                        top: 12,
                                        right: 12,
                                        color: "rgba(162, 167, 180, 0.7)",
                                        "&:hover": { color: accentColor, backgroundColor: "rgba(46, 212, 122, 0.1)" },
                                    }}
                                >
                                    <ContentCopyIcon />
                                </Button>
                            </Box>
                        </Box>

                        <Box component="hr" sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                        {/* Workflow & Features */}
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4}>
                            <Box sx={{ flex: 1 }}>
                                <Typography level="h3" sx={{ color: textColor, fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box component="span" sx={{ color: accentColor }}>🔄</Box> Workflow
                                </Typography>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <Typography sx={{ color: accentColor, fontWeight: 'bold' }}>1.</Typography>
                                        <Typography sx={{ color: textSecondary }}>Tool creates <code>.godseye_aeo_plan_YYYY-MM-DD.md</code> in workspace</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <Typography sx={{ color: accentColor, fontWeight: 'bold' }}>2.</Typography>
                                        <Typography sx={{ color: textSecondary }}>AI reads plan and compares it with your codebase</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                        <Typography sx={{ color: accentColor, fontWeight: 'bold' }}>3.</Typography>
                                        <Typography sx={{ color: textSecondary }}>AI applies structural changes and content optimizations</Typography>
                                    </Box>
                                </Stack>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography level="h3" sx={{ color: textColor, fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                    <Box component="span" sx={{ color: accentColor }}>📋</Box> Key Features
                                </Typography>
                                <Stack spacing={1.5}>
                                    <Typography sx={{ color: textSecondary }}>
                                        • <strong>Persistence:</strong> Auto-saves analysis to local Markdown file
                                    </Typography>
                                    <Typography sx={{ color: textSecondary }}>
                                        • <strong>Gap Analysis:</strong> Compares actual code vs required AEO structure
                                    </Typography>
                                    <Typography sx={{ color: textSecondary }}>
                                        • <strong>Context Aware:</strong> AI automatically requests product-specific context
                                    </Typography>
                                </Stack>
                            </Box>
                        </Stack>

                        <Box component="hr" sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

                        {/* Troubleshooting & Warnings */}
                        <Box>
                            <Typography level="h3" sx={{ color: "#F35B64", fontWeight: 600, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                                <Box component="span">⚠️</Box> Troubleshooting & Warnings
                            </Typography>

                            <Stack spacing={2}>
                                <Box sx={{ p: 2.5, borderRadius: "8px", backgroundColor: "rgba(243, 91, 100, 0.05)", border: "1px solid rgba(243, 91, 100, 0.2)" }}>
                                    <Typography level="title-md" sx={{ color: "#F35B64", mb: 1, fontWeight: 600 }}>Common Issues</Typography>
                                    <Typography level="body-md" sx={{ color: textSecondary, mb: 0.5 }}>
                                        • <strong>"Product Not Found":</strong> Ensure the UUID is correct and belongs to your account.
                                    </Typography>
                                    <Typography level="body-md" sx={{ color: textSecondary }}>
                                        • <strong>"Unauthorized":</strong> Ensure your user ID matches the product owner.
                                    </Typography>
                                </Box>

                                <Box sx={{ p: 2.5, borderRadius: "8px", backgroundColor: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
                                    <Typography level="title-md" sx={{ color: "#F59E0B", mb: 1, fontWeight: 600 }}>Important: Plan File Location Issue</Typography>
                                    <Typography level="body-md" sx={{ color: textSecondary, lineHeight: 1.6, mb: 1.5 }}>
                                        <strong>Problem:</strong> MCP creates the optimization plan in a file, but your Vibe coding agent might download it to a different folder. You need to manually locate this file and move it to your project root directory (or any folder in the project) before optimization can proceed.
                                    </Typography>
                                    <Typography level="body-md" sx={{ color: textSecondary, lineHeight: 1.6 }}>
                                        <strong>Action Required:</strong> Before starting optimization, mention the exact file location to your agent and instruct it to proceed with the AEO improvements.
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>

                    </Stack>
                </Card>
            </Container>

            {/* Copy Notification Toast */}
            {showCopyNotification && (
                <Box
                    sx={{
                        position: "fixed",
                        top: 20,
                        right: 20,
                        zIndex: 9999,
                        animation: "slideIn 0.3s ease-out",
                        "@keyframes slideIn": {
                            from: { transform: "translateX(100%)", opacity: 0 },
                            to: { transform: "translateX(0)", opacity: 1 },
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
        </Box>
    );
}
