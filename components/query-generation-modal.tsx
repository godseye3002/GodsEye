"use client";

import * as React from "react";
import {
  Box,
  Button,
  Card,
  Checkbox,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalClose,
  ModalDialog,
  Stack,
  Typography,
} from "@mui/joy";
import { useProductStore } from "@/app/optimize/store";
import { useAuth } from "@/lib/auth-context";
import { HugeiconsIcon } from "@hugeicons/react";
import { AiInnovationIcon, File01Icon, Upload01Icon } from "@hugeicons/core-free-icons";

const accentColor = "#2ED47A";
const textPrimary = "#F2F5FA";
const textSecondary = "rgba(162, 167, 180, 0.88)";

const modalBackdropSx = {
  backgroundColor: "rgba(0, 0, 0, 0.75)",
  backdropFilter: "blur(6px)",
};

const modalDialogBaseSx = {
  backgroundColor: "rgba(17, 19, 24, 0.92)",
  borderRadius: "16px",
  border: "1px solid rgba(242, 245, 250, 0.14)",
  boxShadow: "0 50px 140px rgba(0, 0, 0, 0.65)",
  p: 3,
};

interface QueryGenerationModalProps {
  onBatchCreated?: (batchId: string) => Promise<void>;
  loadQueryBatches?: () => Promise<void>;
}

export function QueryGenerationModal({ onBatchCreated, loadQueryBatches }: QueryGenerationModalProps) {
  const { user } = useAuth();
  const {
    currentProductId,
    formData,
    saveProductToSupabase,
    isGenerateBatchModalOpen,
    setGenerateBatchModalOpen,
    isGeneratingQuery,
    setIsGeneratingQuery,
    setQueryGenerationError,
    setSelectedBatchId,
  } = useProductStore();

  const [modalStep, setModalStep] = React.useState<"choice" | "ai_setup" | "upload" | "review">("choice");
  const [newBatchName, setNewBatchName] = React.useState("");
  const [extractedQueries, setExtractedQueries] = React.useState<{ text: string; engine: "perplexity" | "google" | "chatgpt"; selected: boolean }[]>([]);
  const [isParsingFile, setIsParsingFile] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const resetModal = () => {
    setModalStep("choice");
    setNewBatchName("");
    setExtractedQueries([]);
    setServerError(null);
  };

  const handleClose = () => {
    if (!isGeneratingQuery) {
      setGenerateBatchModalOpen(false);
      resetModal();
    }
  };

  const handleGenerateAI = async () => {
    setIsGeneratingQuery(true);
    setServerError(null);

    let productId = currentProductId;

    try {
      if (!productId) {
        const id = typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);

        const productRecord = {
          id,
          name: formData.product_name?.trim() || "Untitled Product",
          description: formData.description?.trim() || "No description provided.",
          createdAt: new Date().toISOString(),
          formData: JSON.parse(JSON.stringify(formData)),
          analysis: null,
          googleOverviewAnalysis: null,
          combinedAnalysis: null,
          sourceLinks: [],
          processedSources: [],
        };

        productId = await saveProductToSupabase(productRecord as any, user!.id);
        if (!productId) throw new Error("Could not initialize product session.");
      }

      const response = await fetch("/api/generate-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user!.id,
          productId: productId,
          batchName: newBatchName.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate batch");
      }

      const { batch } = await response.json();

      if (loadQueryBatches) await loadQueryBatches();

      if (batch?.id) {
        if (onBatchCreated) await onBatchCreated(batch.id);
        setSelectedBatchId(batch.id);
      }
      handleClose();
    } catch (error: any) {
      const msg = error?.message || "Failed to generate new batch";
      setServerError(msg);
      setQueryGenerationError(msg);
    } finally {
      setIsGeneratingQuery(false);
    }
  };

  const smartExtractQueries = (content: string, fileName: string) => {
    const lines = content.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) return;

    // Keywords and helpers moved up for reuse
    const targetKeywords = ["query", "queries", "query_text", "prompt", "search", "keyword"];
    const getSimilarity = (h: string, t: string) => {
      if (h === t) return 1.0;
      if (h.includes(t) || t.includes(h)) return 0.8;
      const hChars = new Set(h.split(''));
      const tChars = new Set(t.split(''));
      const intersection = new Set([...hChars].filter(x => tChars.has(x)));
      const union = new Set([...hChars, ...tChars]);
      return intersection.size / union.size;
    };

    const isCsvExtension = fileName.toLowerCase().endsWith('.csv');
    const firstLine = lines[0];
    // Detect structured CSV data even in .txt files
    const isStructured = isCsvExtension || (firstLine.includes(',') && targetKeywords.some(k => firstLine.toLowerCase().includes(k)));

    let rawLines: string[] = [];

    if (isStructured) {
      if (lines.length > 1) {
        // Improved CSV cell splitting that handles basic quotes
        const splitCsvLine = (line: string) => {
          const result = [];
          let current = "";
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') inQuotes = !inQuotes;
            else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = "";
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };

        const headers = splitCsvLine(lines[0]);
        const firstDataRow = splitCsvLine(lines[1]);
        let winnerIdx = -1;

        // 1) Primary Search: Check every column against all 3 tests
        for (let idx = 0; idx < headers.length; idx++) {
          const header = headers[idx].toLowerCase();
          const firstVal = (firstDataRow[idx] || "").trim();

          const test1_Keyword = targetKeywords.some(k => header === k || header.includes(k));
          const simScore = Math.max(getSimilarity(header, "query"), getSimilarity(header, "prompt"));
          const test2_Similarity = simScore >= 0.5;
          const test3_Length = firstVal.length >= 3;

          if (test1_Keyword && test2_Similarity && test3_Length) {
            winnerIdx = idx;
            break;
          }
        }

        // 2) Secondary Search fallback
        if (winnerIdx === -1) {
          let highestRelevance = -1;
          for (let idx = 0; idx < headers.length; idx++) {
            const firstVal = (firstDataRow[idx] || "").trim();
            if (firstVal.length >= 3) {
              const header = headers[idx].toLowerCase();
              const relevance = targetKeywords.some(k => header.includes(k)) ? 10 : 0;
              const sim = Math.max(getSimilarity(header, "query"), getSimilarity(header, "prompt"));
              const totalRel = relevance + (sim * 10);

              if (totalRel > highestRelevance) {
                highestRelevance = totalRel;
                winnerIdx = idx;
              }
            }
          }
        }

        const bestColumnIndex = winnerIdx !== -1 ? winnerIdx : 0;
        rawLines = lines.slice(1).map(line => {
          const cells = splitCsvLine(line);
          return cells[bestColumnIndex]?.replace(/^["']|["']$/g, '').trim();
        }).filter(q => q && q.length > 0);
      } else {
        // Just one line
        rawLines = lines[0].split(',').map(s => s.trim()).filter(s => s.length > 0);
      }
    } else {
      rawLines = lines
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'));
    }

    const processed = rawLines.map((text, i) => {
      let engine: "perplexity" | "google" | "chatgpt";
      const lowerText = text.toLowerCase();
      const isChatgptEnabled = process.env.NEXT_PUBLIC_CHATGPT_PIPELINE === 'true';

      if (lowerText.includes('google') || lowerText.includes('search')) engine = "google";
      else if (isChatgptEnabled && (lowerText.includes('chat') || lowerText.includes('gpt') || lowerText.includes('prompt'))) engine = "chatgpt";
      else if (lowerText.includes('perplexity') || lowerText.includes('research')) engine = "perplexity";
      else {
        if (isChatgptEnabled) {
          const engines: ("perplexity" | "google" | "chatgpt")[] = ["perplexity", "google", "chatgpt"];
          engine = engines[i % 3];
        } else {
          const engines: ("perplexity" | "google")[] = ["perplexity", "google"];
          engine = engines[i % 2];
        }
      }
      return { text, engine, selected: true };
    });

    setExtractedQueries(processed);
    setModalStep("review");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      smartExtractQueries(content, file.name);
      setIsParsingFile(false);
    };
    reader.onerror = () => {
      setServerError("Failed to read file");
      setIsParsingFile(false);
    };
    reader.readAsText(file);
  };

  const handleCreateManualBatch = async () => {
    if (!user) return;

    const selectedQueries = extractedQueries
      .filter(q => q.selected)
      .map(q => ({ text: q.text, engine: q.engine }));

    if (selectedQueries.length === 0) {
      setServerError("Please select at least one query");
      return;
    }

    setServerError(null);
    setIsGeneratingQuery(true);

    let productId = currentProductId;

    try {
      if (!productId) {
        const id = typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2);

        const productRecord = {
          id,
          name: formData.product_name?.trim() || "Untitled Product",
          description: formData.description?.trim() || "No description provided.",
          createdAt: new Date().toISOString(),
          formData: JSON.parse(JSON.stringify(formData)),
          analysis: null,
          googleOverviewAnalysis: null,
          combinedAnalysis: null,
          sourceLinks: [],
          processedSources: [],
        };

        productId = await saveProductToSupabase(productRecord as any, user.id);
        if (!productId) throw new Error("Could not initialize product session.");
      }

      const response = await fetch("/api/create-manual-batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId: productId,
          batchName: newBatchName.trim() || `Imported Batch - ${new Date().toLocaleDateString()}`,
          queries: selectedQueries
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create manual batch");
      }

      const { batch } = await response.json();
      if (loadQueryBatches) await loadQueryBatches();
      if (batch?.id) {
        if (onBatchCreated) await onBatchCreated(batch.id);
        setSelectedBatchId(batch.id);
      }
      handleClose();
    } catch (error: any) {
      setServerError(error.message);
    } finally {
      setIsGeneratingQuery(false);
    }
  };

  return (
    <Modal open={isGenerateBatchModalOpen} onClose={handleClose} slotProps={{ backdrop: { sx: modalBackdropSx } }}>
      <ModalDialog
        variant="outlined"
        sx={{
          ...modalDialogBaseSx,
          maxWidth: modalStep === "review" ? 700 : 500,
          width: "95%",
          border: "1px solid rgba(46, 212, 122, 0.2)",
          boxShadow: "0 40px 120px rgba(46, 212, 122, 0.1)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ModalClose onClick={handleClose} />

        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography level="h3" sx={{ color: "rgba(242, 245, 250, 0.9)", display: "flex", alignItems: "center", gap: 1.5 }}>
            {modalStep === "choice" && "New Query Batch"}
            {modalStep === "ai_setup" && "AI Search Strategy"}
            {modalStep === "upload" && "Import from File"}
            {modalStep === "review" && "Review Imported Queries"}
          </Typography>
          <Typography level="body-sm" sx={{ color: textSecondary, mt: 0.5 }}>
            {modalStep === "choice" && "Select how you would like to generate or add search queries."}
            {modalStep === "ai_setup" && "Our AI will generate optimized queries based on your product's DNA."}
            {modalStep === "upload" && "Upload a .txt or .csv file containing your search queries."}
            {modalStep === "review" && `Detected ${extractedQueries.length} queries. Please select the ones you want to import.`}
          </Typography>
        </Box>

        {/* Content Area */}
        <Box sx={{ flex: 1, overflowY: "auto", pr: 0.5, mb: 3, minHeight: modalStep === "review" ? 300 : "auto" }}>
          {modalStep === "choice" && (
            <Stack spacing={2}>
              <Card
                variant="outlined"
                onClick={() => setModalStep("ai_setup")}
                sx={{
                  p: 3,
                  cursor: "pointer",
                  backgroundColor: "rgba(46, 212, 122, 0.04)",
                  borderColor: "rgba(46, 212, 122, 0.15)",
                  "&:hover": { borderColor: accentColor, backgroundColor: "rgba(46, 212, 122, 0.08)" },
                  transition: "all 0.2s ease",
                }}
              >
                <Stack direction="row" spacing={3} alignItems="center">
                  <Box sx={{ color: accentColor }}>
                    <HugeiconsIcon icon={AiInnovationIcon} size={32} />
                  </Box>
                  <Box>
                    <Typography level="title-lg" sx={{ color: textPrimary }}>AI Search Strategist</Typography>
                    <Typography level="body-sm" sx={{ color: textSecondary }}>Auto-generate 15 optimized queries using Trending keywords.</Typography>
                  </Box>
                </Stack>
              </Card>

              <Card
                variant="outlined"
                onClick={() => setModalStep("upload")}
                sx={{
                  p: 3,
                  cursor: "pointer",
                  backgroundColor: "rgba(242, 245, 250, 0.02)",
                  borderColor: "rgba(242, 245, 250, 0.1)",
                  "&:hover": { borderColor: accentColor, backgroundColor: "rgba(242, 245, 250, 0.05)" },
                  transition: "all 0.2s ease",
                }}
              >
                <Stack direction="row" spacing={3} alignItems="center">
                  <Box sx={{ color: "rgba(162, 167, 180, 0.6)" }}>
                    <HugeiconsIcon icon={File01Icon} size={32} />
                  </Box>
                  <Box>
                    <Typography level="title-lg" sx={{ color: textPrimary }}>Bulk File Import</Typography>
                    <Typography level="body-sm" sx={{ color: textSecondary }}>Upload your own list of queries in .txt or .csv format.</Typography>
                  </Box>
                </Stack>
              </Card>
            </Stack>
          )}

          {modalStep === "ai_setup" && (
            <FormControl>
              <FormLabel sx={{ color: textPrimary, mb: 1 }}>Batch Name (Optional)</FormLabel>
              <Input
                autoFocus
                placeholder="e.g., Competitor Analysis v2"
                value={newBatchName}
                onChange={(e) => setNewBatchName(e.target.value)}
                sx={{
                  backgroundColor: "rgba(17, 19, 24, 0.6)",
                  borderColor: "rgba(242, 245, 250, 0.2)",
                  color: textPrimary,
                  height: 48,
                  "&.Mui-focused": { borderColor: accentColor },
                }}
              />
            </FormControl>
          )}

          {modalStep === "upload" && (
            <Box
              onClick={() => fileInputRef.current?.click()}
              sx={{
                py: 6,
                px: 4,
                border: "2px dashed rgba(46, 212, 122, 0.2)",
                borderRadius: "12px",
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: "rgba(46, 212, 122, 0.03)",
                "&:hover": { borderColor: accentColor, backgroundColor: "rgba(46, 212, 122, 0.06)" },
                transition: "all 0.2s ease",
              }}
            >
              <input type="file" hidden ref={fileInputRef} accept=".txt,.csv" onChange={handleFileUpload} />
              <Box sx={{ mb: 2, color: accentColor, opacity: 0.8 }}>
                <HugeiconsIcon icon={Upload01Icon} size={48} />
              </Box>
              <Typography level="title-md" sx={{ color: textPrimary, mb: 0.5 }}>
                {isParsingFile ? "Reading file..." : "Click to select a file"}
              </Typography>
              <Typography level="body-xs" sx={{ color: textSecondary }}>Supported formats: .txt, .csv</Typography>
            </Box>
          )}

          {modalStep === "review" && (
            <Stack spacing={2}>
              <FormControl>
                <FormLabel sx={{ color: textPrimary, mb: 1 }}>Batch Name</FormLabel>
                <Input
                  placeholder="e.g., Imported Queries - March 14"
                  value={newBatchName}
                  onChange={(e) => setNewBatchName(e.target.value)}
                  sx={{
                    backgroundColor: "rgba(17, 19, 24, 0.6)",
                    borderColor: "rgba(242, 245, 250, 0.2)",
                    color: textPrimary,
                    mb: 2,
                    "&.Mui-focused": { borderColor: accentColor },
                  }}
                />
              </FormControl>

              <Box sx={{ border: "1px solid rgba(242, 245, 250, 0.1)", borderRadius: "8px", overflow: "hidden", backgroundColor: "rgba(0,0,0,0.2)" }}>
                <Box sx={{ p: 1.5, backgroundColor: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(242, 245, 250, 0.1)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Checkbox
                    size="sm"
                    label="Select All"
                    checked={extractedQueries.every(q => q.selected)}
                    indeterminate={extractedQueries.some(q => q.selected) && !extractedQueries.every(q => q.selected)}
                    onChange={(e) => setExtractedQueries(prev => prev.map(q => ({ ...q, selected: e.target.checked })))}
                    sx={{ color: textSecondary }}
                  />
                  <Typography level="body-xs" sx={{ color: textSecondary }}>{extractedQueries.filter(q => q.selected).length} selected</Typography>
                </Box>
                <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                  {extractedQueries.map((query, idx) => (
                    <Box key={idx} sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 2, borderBottom: idx === extractedQueries.length - 1 ? "none" : "1px solid rgba(255,255,255,0.05)", "&:hover": { backgroundColor: "rgba(255,255,255,0.02)" } }}>
                      <Checkbox
                        size="sm"
                        checked={query.selected}
                        onChange={(e) => {
                          const newQueries = [...extractedQueries];
                          newQueries[idx].selected = e.target.checked;
                          setExtractedQueries(newQueries);
                        }}
                      />
                      <Typography sx={{ color: textPrimary, flex: 1, fontSize: "0.9rem" }}>{query.text}</Typography>
                      <select
                        value={query.engine}
                        onChange={(e) => {
                          const newQueries = [...extractedQueries];
                          newQueries[idx].engine = e.target.value as any;
                          setExtractedQueries(newQueries);
                        }}
                        style={{ backgroundColor: "rgba(46, 212, 122, 0.1)", color: accentColor, border: "1px solid rgba(46, 212, 122, 0.3)", borderRadius: "4px", padding: "2px 4px", fontSize: "0.75rem", outline: "none" }}
                      >
                        <option value="perplexity">Perplexity</option>
                        <option value="google">Google</option>
                        {process.env.NEXT_PUBLIC_CHATGPT_PIPELINE === 'true' && (
                          <option value="chatgpt">ChatGPT</option>
                        )}
                      </select>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Stack>
          )}
        </Box>

        {/* Footer Area */}
        <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", pt: 2, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {modalStep !== "choice" && (
            <Button
              variant="plain"
              onClick={() => {
                if (modalStep === "review") setModalStep("upload");
                else setModalStep("choice");
              }}
              disabled={isGeneratingQuery}
              sx={{ color: textSecondary, "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" } }}
            >
              Back
            </Button>
          )}

          <Button variant="outlined" onClick={handleClose} sx={{ borderColor: "rgba(255,255,255,0.1)", color: textSecondary }}>Cancel</Button>

          {modalStep === "ai_setup" && (
            <Button onClick={handleGenerateAI} loading={isGeneratingQuery} sx={{ backgroundColor: "rgba(46, 212, 122, 0.15)", color: accentColor, fontWeight: 600, px: 4, border: "1px solid rgba(46, 212, 122, 0.3)", "&:hover": { backgroundColor: "rgba(46, 212, 122, 0.25)" } }}>
              Generate
            </Button>
          )}

          {modalStep === "review" && (
            <Button onClick={handleCreateManualBatch} loading={isGeneratingQuery} sx={{ backgroundColor: "rgba(46, 212, 122, 0.15)", color: accentColor, fontWeight: 600, px: 4, border: "1px solid rgba(46, 212, 122, 0.3)", "&:hover": { backgroundColor: "rgba(46, 212, 122, 0.25)" } }}>
              Import Selected
            </Button>
          )}
        </Stack>

        {serverError && (
          <Typography level="body-xs" sx={{ color: "#F35B64", mt: 2, textAlign: "center" }}>{serverError}</Typography>
        )}
      </ModalDialog>
    </Modal>
  );
}
