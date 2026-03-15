"use client";

import * as React from "react";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Modal,
  ModalClose,
  ModalDialog,
  Stack,
  Tooltip,
  Typography,
  FormControl,
  FormLabel,
  Input,
  Switch,
} from "@mui/joy";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";
import { useProductStore } from "@/app/optimize/store";
import { fetchUsedQueriesFromAnalysisClient } from "@/lib/analysis-queries";

const accentColor = "#2ED47A";
const surfaceBase = "rgba(13, 15, 20, 0.85)";
const borderColor = "rgba(46, 212, 122, 0.22)";
const textPrimary = "#F2F5FA";
const textSecondary = "rgba(162, 167, 180, 0.88)";
const accentSoft = "rgba(46, 212, 122, 0.08)";

const modalBackdropSx = {
  backgroundColor: "rgba(0, 0, 0, 0.75)",
  backdropFilter: "blur(6px)",
};

function parsePositiveInt(value: unknown, fallback: number) {
  const num = typeof value === "string" ? Number.parseInt(value, 10) : Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
}

const modalDialogBaseSx = {
  backgroundColor: "rgba(17, 19, 24, 0.92)",
  borderRadius: "16px",
  border: "1px solid rgba(242, 245, 250, 0.14)",
  boxShadow: "0 50px 140px rgba(0, 0, 0, 0.65)",
  p: 3,
};

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function DashboardQueryBatchesCard() {
  const router = useRouter();
  const { user } = useAuth();

  const currentProductId = useProductStore((s) => s.currentProductId);
  const selectedBatchId = useProductStore((s) => s.selectedBatchId);
  const setSelectedBatchId = useProductStore((s) => s.setSelectedBatchId);

  const allPerplexityQueries = useProductStore((s) => s.allPerplexityQueries);
  const allGoogleQueries = useProductStore((s) => s.allGoogleQueries);
  const allChatgptQueries = useProductStore((s) => s.allChatgptQueries);

  const selectedPerplexityQueries = useProductStore((s) => s.selectedPerplexityQueries);
  const selectedGoogleQueries = useProductStore((s) => s.selectedGoogleQueries);
  const selectedChatgptQueries = useProductStore((s) => s.selectedChatgptQueries);
  const usedPerplexityQueries = useProductStore((s) => s.usedPerplexityQueries);
  const usedGoogleQueries = useProductStore((s) => s.usedGoogleQueries);
  const usedChatgptQueries = useProductStore((s) => s.usedChatgptQueries);

  const setAllPerplexityQueries = useProductStore((s) => s.setAllPerplexityQueries);
  const setAllGoogleQueries = useProductStore((s) => s.setAllGoogleQueries);
  const setAllChatgptQueries = useProductStore((s) => s.setAllChatgptQueries);
  const setSelectedPerplexityQueries = useProductStore((s) => s.setSelectedPerplexityQueries);
  const setSelectedGoogleQueries = useProductStore((s) => s.setSelectedGoogleQueries);
  const setSelectedChatgptQueries = useProductStore((s) => s.setSelectedChatgptQueries);
  const setUsedPerplexityQueries = useProductStore((s) => s.setUsedPerplexityQueries);
  const setUsedGoogleQueries = useProductStore((s) => s.setUsedGoogleQueries);
  const setUsedChatgptQueries = useProductStore((s) => s.setUsedChatgptQueries);

  const isGeneratingQuery = useProductStore((s) => s.isGeneratingQuery);
  const setIsGeneratingQuery = useProductStore((s) => s.setIsGeneratingQuery);
  const setQueryGenerationError = useProductStore((s) => s.setQueryGenerationError);

  const products = useProductStore((s) => s.products);
  const userCredits = useProductStore((s) => s.userCredits);

  const maxPerplexityQueries = parsePositiveInt(process.env.NEXT_PUBLIC_MAX_PERPLEXITY_QUERIES, 1);
  const maxGoogleQueries = parsePositiveInt(process.env.NEXT_PUBLIC_MAX_GOOGLE_QUERIES, 1);
  const maxChatgptQueries = 5;

  const [queryBatches, setQueryBatches] = React.useState<any[]>([]);
  const [isLoadingBatches, setIsLoadingBatches] = React.useState(false);
  const [isLoadingBatchQueries, setIsLoadingBatchQueries] = React.useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = React.useState<string | null>(null);

  const [isGeneratingChatgptQueries, setIsGeneratingChatgptQueries] = React.useState(false);
  const [loadingResultKey, setLoadingResultKey] = React.useState<string | null>(null);
  const [resultMenuAnchor, setResultMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const [editingQuery, setEditingQuery] = React.useState<{
    pipeline: "perplexity" | "google_overview" | "chatgpt";
    index: number;
    value: string;
  } | null>(null);
  const [editedQueries, setEditedQueries] = React.useState<{ perplexity: string[]; google: string[]; chatgpt: string[] }>({
    perplexity: [],
    google: [],
    chatgpt: [],
  });
  const [editingQueryLoading, setEditingQueryLoading] = React.useState(false);

  const isGenerateBatchModalOpen = useProductStore((s) => s.isGenerateBatchModalOpen);
  const setGenerateBatchModalOpen = useProductStore((s) => s.setGenerateBatchModalOpen);
  const [isNewBatchEnabled, setIsNewBatchEnabled] = React.useState(false);

  const hasUsedSelected =
    selectedPerplexityQueries.some((q) => usedPerplexityQueries.includes(q)) ||
    selectedGoogleQueries.some((q) => usedGoogleQueries.includes(q)) ||
    selectedChatgptQueries.some((q) => usedChatgptQueries.includes(q));

  const requiredCredits =
    selectedPerplexityQueries.length + selectedGoogleQueries.length + selectedChatgptQueries.length;

  const loadQueryBatches = React.useCallback(async () => {
    if (!user?.id || !currentProductId) return;

    setIsLoadingBatches(true);
    try {
      const response = await fetch(`/api/query-batches?userId=${user.id}&productId=${currentProductId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load batches");
      }
      const data = await response.json();
      setQueryBatches(Array.isArray(data?.batches) ? data.batches : []);
    } catch (error) {
      if ((process.env.NODE_ENV as string) === 'debug') {
        console.error("[Dashboard Query Batches] Failed to load:", error);
      }
    } finally {
      setIsLoadingBatches(false);
    }
  }, [user?.id, currentProductId]);

  const loadQueriesForBatch = React.useCallback(async (batchId: string) => {
    if (!user?.id || !currentProductId) return null;

    setIsLoadingBatchQueries(true);
    try {
      const response = await fetch(`/api/queries?userId=${user.id}&productId=${currentProductId}&batchId=${batchId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load batch queries");
      }

      const data = await response.json();
      const rows = Array.isArray(data?.queries) ? data.queries : [];

      if (rows.length > 0 && rows[0]?.product_id && rows[0].product_id !== currentProductId) {
        setSelectedBatchId(null);
        return null;
      }

      const perplexity = rows
        .filter((q: any) => q?.suggested_engine === "perplexity" || q?.suggested_engine === null)
        .map((q: any) => q?.query_text)
        .filter((q: any) => typeof q === "string" && q.trim().length > 0);

      const google = rows
        .filter((q: any) => q?.suggested_engine === "google")
        .map((q: any) => q?.query_text)
        .filter((q: any) => typeof q === "string" && q.trim().length > 0);

      const chatgpt = rows
        .filter((q: any) => q?.suggested_engine === "chatgpt")
        .map((q: any) => q?.query_text)
        .filter((q: any) => typeof q === "string" && q.trim().length > 0);

      setAllPerplexityQueries(perplexity);
      setAllGoogleQueries(google);
      setAllChatgptQueries(chatgpt);
      setSelectedPerplexityQueries([]);
      setSelectedGoogleQueries([]);
      setSelectedChatgptQueries([]);

      const {
        google: analysisGoogleQueries,
        perplexity: analysisPerplexityQueries,
        chatgpt: analysisChatgptQueries,
      } = await fetchUsedQueriesFromAnalysisClient(currentProductId);

      setUsedPerplexityQueries(analysisPerplexityQueries);
      setUsedGoogleQueries(analysisGoogleQueries);
      setUsedChatgptQueries(analysisChatgptQueries);

      setSelectedBatchId(batchId);

      return { perplexity, google, chatgpt };
    } catch (error) {
      if ((process.env.NODE_ENV as string) === 'debug') {
        console.error("[Dashboard Batch Queries] Failed to load:", error);
      }
      return null;
    } finally {
      setIsLoadingBatchQueries(false);
    }
  }, [user?.id, currentProductId, setAllPerplexityQueries, setAllGoogleQueries, setAllChatgptQueries, setSelectedPerplexityQueries, setSelectedGoogleQueries, setSelectedChatgptQueries, setUsedPerplexityQueries, setUsedGoogleQueries, setUsedChatgptQueries, setSelectedBatchId]);

  const handleGenerateChatgptQueriesForBatch = React.useCallback(async () => {
    if (!user || !currentProductId || !selectedBatchId) return;

    setIsGeneratingChatgptQueries(true);
    setQueryGenerationError(null);

    try {
      const response = await fetch("/api/generate-batch-chatgpt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId: currentProductId,
          batchId: selectedBatchId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate ChatGPT queries");
      }

      await loadQueriesForBatch(selectedBatchId);
    } catch (error: any) {
      setQueryGenerationError(error?.message || "Failed to generate ChatGPT queries");
    } finally {
      setIsGeneratingChatgptQueries(false);
    }
  }, [currentProductId, loadQueriesForBatch, selectedBatchId, setQueryGenerationError, user]);
  
  const handleToggleDailyTracking = React.useCallback(async (batchId: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/query-batches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batchId, daily_tracker: !currentStatus }),
      });
      
      if (!response.ok) throw new Error("Failed to update tracking");
      
      // Update local state
      setQueryBatches(prev => prev.map(b => b.id === batchId ? { ...b, daily_tracker: !currentStatus } : b));
    } catch (error) {
      setServerError("Failed to update daily tracking");
    }
  }, []);

  const getAnalysesForQuery = React.useCallback(
    (query: string, pipeline: "perplexity" | "google_overview" | "chatgpt") => {
      if (!currentProductId) return [];

      const currentProduct = products.find((p) => p.id === currentProductId);
      if (!currentProduct || !(currentProduct as any).analyses) return [];

      return (currentProduct as any).analyses
        .filter((analysis: any) => {
          if (pipeline === "perplexity") {
            const analysisQuery = analysis.optimization_query;
            return analysisQuery && (analysisQuery === query || analysisQuery.toLowerCase() === query.toLowerCase());
          }

          if (pipeline === "google_overview") {
            const analysisQuery = analysis.google_search_query;
            return analysisQuery && (analysisQuery === query || analysisQuery.toLowerCase() === query.toLowerCase());
          }

          const analysisQuery = analysis.chatgpt_search_query || analysis.chatgpt_prompt;
          return analysisQuery && (analysisQuery === query || analysisQuery.toLowerCase() === query.toLowerCase());
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          return dateB - dateA;
        });
    },
    [currentProductId, products]
  );

  const getTrendIndicator = React.useCallback((analyses: any[]) => {
    if (analyses.length < 2) return null;

    const latest = analyses[0];
    const previous = analyses[1];

    const extractVisibilityFromText = (text: string) => {
      const patterns = [
        /client_product_visibility["\s]*[:=]["\s]*(Featured|Not Featured)/i,
        /visibility["\s]*[:=]["\s]*(Featured|Not Featured)/i,
        /(Featured|Not Featured)/i,
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      return "Unknown";
    };

    const getVisibilityStatus = (analysis: any) => {
      try {
        const analysisData = analysis.optimization_analysis || analysis.google_overview_analysis || "";

        let parsedData;
        try {
          parsedData = typeof analysisData === "string" ? JSON.parse(analysisData) : analysisData;
        } catch {
          return extractVisibilityFromText(analysisData);
        }

        if (parsedData && typeof parsedData === "object") {
          if ((parsedData as any).client_product_visibility) {
            return (parsedData as any).client_product_visibility;
          }

          for (const key in parsedData as any) {
            if ((parsedData as any)[key] && (parsedData as any)[key].client_product_visibility) {
              return (parsedData as any)[key].client_product_visibility;
            }
          }
        }

        return extractVisibilityFromText(analysisData);
      } catch {
        return "Unknown";
      }
    };

    const latestVisibility = getVisibilityStatus(latest);
    const previousVisibility = getVisibilityStatus(previous);

    const getVisibilityRank = (visibility: any) => {
      if (!visibility || typeof visibility !== "string") {
        return 0;
      }

      const normalized = visibility.toLowerCase().trim();
      if (normalized.includes("featured")) return 2;
      if (normalized.includes("not featured")) return 1;
      return 0;
    };

    const latestRank = getVisibilityRank(latestVisibility);
    const previousRank = getVisibilityRank(previousVisibility);

    if (latestRank > previousRank) {
      return { direction: "up", icon: "↗" };
    }
    if (latestRank < previousRank) {
      return { direction: "down", icon: "↘" };
    }
    return { direction: "same", icon: "-" };
  }, []);

  const handleResultMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setResultMenuAnchor(event.currentTarget);
  };

  const handleResultMenuClose = () => {
    setResultMenuAnchor(null);
  };

  const handleViewAnalysisById = async (analysisId: string, pipeline: "perplexity" | "google_overview" | "chatgpt") => {
    handleResultMenuClose();

    if (!currentProductId) {
      setServerError("No product selected. Please select a product first.");
      return;
    }

    if (!user) {
      setServerError("User not authenticated. Please sign in.");
      return;
    }

    if (pipeline === "perplexity") {
      router.push(`/results/perplexity/${analysisId}`);
    } else if (pipeline === "google_overview") {
      router.push(`/results/google/${analysisId}`);
    } else {
      router.push(`/results/chatgpt/${analysisId}`);
    }
  };

  const handleViewAnalysisResult = async (query: string, pipeline: "perplexity" | "google_overview" | "chatgpt") => {
    setServerError(null);

    if (!currentProductId) {
      setServerError("No product selected. Please select a product first.");
      return;
    }

    if (!user) {
      setServerError("User not authenticated. Please sign in.");
      return;
    }

    const resultKey = `${pipeline}-${query}`;
    setLoadingResultKey(resultKey);

    try {
      let currentProduct: any = products.find((p) => p.id === currentProductId);

      if (!currentProduct || !currentProduct.analyses || currentProduct.analyses.length === 0) {
        const response = await fetch(`/api/products/${currentProductId}`);
        if (response.ok) {
          currentProduct = await response.json();
        } else {
          throw new Error("Failed to fetch product data");
        }
      }

      if (!currentProduct || !currentProduct.analyses) {
        setServerError("Analysis history not found for this product.");
        return;
      }

      const matchingAnalysis = currentProduct.analyses.find((analysis: any) => {
        if (pipeline === "perplexity") {
          const analysisQuery = analysis.optimization_query;
          return analysisQuery && (analysisQuery === query || analysisQuery.toLowerCase() === query.toLowerCase());
        }

        if (pipeline === "google_overview") {
          const analysisQuery = analysis.google_search_query;
          return analysisQuery && (analysisQuery === query || analysisQuery.toLowerCase() === query.toLowerCase());
        }

        const analysisQuery = analysis.chatgpt_search_query || analysis.chatgpt_prompt;
        return analysisQuery && (analysisQuery === query || analysisQuery.toLowerCase() === query.toLowerCase());
      });

      if (!matchingAnalysis) {
        setServerError(`Analysis result not found for this ${pipeline} query.`);
        return;
      }

      if (pipeline === "perplexity") {
        router.push(`/results/perplexity/${matchingAnalysis.id}`);
      } else if (pipeline === "google_overview") {
        router.push(`/results/google/${matchingAnalysis.id}`);
      } else {
        router.push(`/results/chatgpt/${matchingAnalysis.id}`);
      }
    } catch (error) {
      setServerError("Failed to load analysis result. Please try again.");
      setLoadingResultKey(null);
    }
  };

  const handleQuerySelection = (query: string, pipeline: "perplexity" | "google_overview" | "chatgpt") => {
    if (pipeline === "perplexity") {
      if (selectedPerplexityQueries.includes(query)) {
        setSelectedPerplexityQueries(selectedPerplexityQueries.filter((q) => q !== query));
        return;
      }
      setSelectedPerplexityQueries([...selectedPerplexityQueries, query]);
      return;
    }

    if (pipeline === "google_overview") {
      if (selectedGoogleQueries.includes(query)) {
        setSelectedGoogleQueries(selectedGoogleQueries.filter((q) => q !== query));
        return;
      }
      setSelectedGoogleQueries([...selectedGoogleQueries, query]);
      return;
    }

    if (selectedChatgptQueries.includes(query)) {
      setSelectedChatgptQueries(selectedChatgptQueries.filter((q) => q !== query));
      return;
    }
    setSelectedChatgptQueries([...selectedChatgptQueries, query]);
  };

  const handleEditQuery = (query: string, index: number, pipeline: "perplexity" | "google_overview" | "chatgpt") => {
    setEditingQuery({ pipeline, index, value: query });
  };

  const handleSaveEditedQuery = async () => {
    if (!editingQuery) return;

    const { pipeline, index, value } = editingQuery;
    const cleanNewValue = value.trim();

    if (pipeline === "google_overview") {
      const wordCount = cleanNewValue.split(/\s+/).length;
      if (wordCount < 6) {
        setServerError(
          `Google queries must have at least 6 words to effectively invoke AI Overview. Current: ${wordCount} words.`
        );
        return;
      }
    }

    let oldQueryValue = "";
    if (pipeline === "perplexity") {
      oldQueryValue = allPerplexityQueries[index];
    } else if (pipeline === "google_overview") {
      oldQueryValue = allGoogleQueries[index];
    } else {
      oldQueryValue = allChatgptQueries[index];
    }

    const cleanOldQueryValue = oldQueryValue ? oldQueryValue.trim() : "";

    setEditingQueryLoading(true);

    if (pipeline === "perplexity") {
      const newEdited = [...editedQueries.perplexity];
      newEdited[index] = cleanNewValue;
      setEditedQueries({ ...editedQueries, perplexity: newEdited });
    } else if (pipeline === "google_overview") {
      const newEdited = [...editedQueries.google];
      newEdited[index] = cleanNewValue;
      setEditedQueries({ ...editedQueries, google: newEdited });
    } else {
      const newEdited = [...editedQueries.chatgpt];
      newEdited[index] = cleanNewValue;
      setEditedQueries({ ...editedQueries, chatgpt: newEdited });
    }

    try {
      if (!user || !currentProductId) {
        setEditingQuery(null);
        return;
      }

      const response = await fetch("/api/queries", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          productId: currentProductId,
          oldQueryText: cleanOldQueryValue,
          newQueryText: cleanNewValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update query in database");
      }

      if (pipeline === "perplexity") {
        const updatedAllPerplexity = allPerplexityQueries.map((q, i) => (i === index ? cleanNewValue : q));
        setAllPerplexityQueries(updatedAllPerplexity);

        const updatedUsed = usedPerplexityQueries.map((q) => (q.trim() === cleanOldQueryValue ? cleanNewValue : q));
        setUsedPerplexityQueries(updatedUsed);

        if (selectedPerplexityQueries.includes(oldQueryValue)) {
          const newSelection = selectedPerplexityQueries.filter((q) => q !== oldQueryValue);
          newSelection.push(cleanNewValue);
          setSelectedPerplexityQueries(newSelection);
        }
      } else if (pipeline === "google_overview") {
        const updatedAllGoogle = allGoogleQueries.map((q, i) => (i === index ? cleanNewValue : q));
        setAllGoogleQueries(updatedAllGoogle);

        const updatedUsed = usedGoogleQueries.map((q) => (q.trim() === cleanOldQueryValue ? cleanNewValue : q));
        setUsedGoogleQueries(updatedUsed);

        if (selectedGoogleQueries.includes(oldQueryValue)) {
          const newSelection = selectedGoogleQueries.filter((q) => q !== oldQueryValue);
          newSelection.push(cleanNewValue);
          setSelectedGoogleQueries(newSelection);
        }
      } else {
        const updatedAllChatgpt = allChatgptQueries.map((q, i) => (i === index ? cleanNewValue : q));
        setAllChatgptQueries(updatedAllChatgpt);

        const updatedUsed = usedChatgptQueries.map((q) => (q.trim() === cleanOldQueryValue ? cleanNewValue : q));
        setUsedChatgptQueries(updatedUsed);

        if (selectedChatgptQueries.includes(oldQueryValue)) {
          const newSelection = selectedChatgptQueries.filter((q) => q !== oldQueryValue);
          newSelection.push(cleanNewValue);
          setSelectedChatgptQueries(newSelection);
        }
      }
    } catch {
      setServerError("Failed to save query changes. Please try again.");
    } finally {
      setEditingQuery(null);
      setEditingQueryLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingQuery(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void handleSaveEditedQuery();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const checkBatchGenerationEligibility = React.useCallback(async () => {
    if (!currentProductId) return;

    if (queryBatches.length === 0) {
      setIsNewBatchEnabled(true);
      return;
    }

    const latestBatch = queryBatches[0];

    try {
      const { supabase } = await import("@/lib/supabase");
      const { data, error } = await supabase
        .from("sov_product_snapshots")
        .select("scraped_generative_dna")
        .eq("product_id", currentProductId)
        .eq("batch_id", latestBatch.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        setIsNewBatchEnabled(false);
        return;
      }

      setIsNewBatchEnabled(!!data?.scraped_generative_dna);
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[Dashboard Batch Eligibility] Unexpected error:", error);
      }
      setIsNewBatchEnabled(false);
    }
  }, [currentProductId, queryBatches, setIsNewBatchEnabled]);

  React.useEffect(() => {
    void loadQueryBatches();
  }, [loadQueryBatches]);

  React.useEffect(() => {
    void checkBatchGenerationEligibility();
  }, [checkBatchGenerationEligibility]);

  const handleDeleteBatch = React.useCallback(
    async (batchId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      if (!user || !confirm("Are you sure you want to delete this batch?")) return;

      setIsDeletingBatch(batchId);
      try {
        const response = await fetch(`/api/query-batches?batchId=${batchId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete batch");
        }

        await loadQueryBatches();

        if (selectedBatchId === batchId) {
          setSelectedBatchId(null);
          setAllPerplexityQueries([]);
          setAllGoogleQueries([]);
          setAllChatgptQueries([]);
          setSelectedPerplexityQueries([]);
          setSelectedGoogleQueries([]);
          setSelectedChatgptQueries([]);
          setUsedPerplexityQueries([]);
          setUsedGoogleQueries([]);
          setUsedChatgptQueries([]);
        }
      } catch (error: any) {
        if (process.env.NODE_ENV !== "production") {
          console.error("[Dashboard] Error deleting batch:", error);
        }
        alert(error?.message);
      } finally {
        setIsDeletingBatch(null);
      }
    },
    [user, loadQueryBatches, selectedBatchId, setSelectedBatchId, setAllPerplexityQueries, setAllGoogleQueries, setAllChatgptQueries, setSelectedPerplexityQueries, setSelectedGoogleQueries, setSelectedChatgptQueries, setUsedPerplexityQueries, setUsedGoogleQueries, setUsedChatgptQueries]
  ); // All modal helper functions removed as they are now in QueryGenerationModal

  if (!currentProductId) return null;

  const handleBackToBatches = () => {
    setSelectedBatchId(null);
    setAllPerplexityQueries([]);
    setAllGoogleQueries([]);
    setAllChatgptQueries([]);
    setSelectedPerplexityQueries([]);
    setSelectedGoogleQueries([]);
    setSelectedChatgptQueries([]);
    setUsedPerplexityQueries([]);
    setUsedGoogleQueries([]);
    setUsedChatgptQueries([]);
  };

  return (
    <>
      {/* Generated Query Section (replicates /optimize: Batches view -> Open -> Queries view) */}
      <Card
        variant="outlined"
        sx={{
          flex: 1,
          p: 4,
          mb: 4,
          background: "linear-gradient(to bottom right, rgba(13, 15, 20, 0.8), rgba(17, 19, 24, 0.9))",
          backdropFilter: "blur(20px)",
          border: `1px solid ${borderColor}`,
          borderRadius: "16px",
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6)",
        }}
      >
        {!selectedBatchId ? (
          <Box sx={{ mb: 4 }}>
            <Card
              variant="outlined"
              sx={{
                p: 2.5,
                mb: 3,
                backgroundColor: "rgba(17, 19, 24, 0.55)",
                border: "1px dashed rgba(46, 212, 122, 0.35)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                <Typography level="title-md" sx={{ color: textPrimary }}>
                  Batches
                </Typography>
                <Tooltip
                  title={
                    isNewBatchEnabled
                      ? "Generate a new batch of queries"
                      : "Previous batch analysis must be complete (DNA generated) before creating a new one"
                  }
                  placement="top"
                  arrow
                >
                  <span>
                    <Button
                      size="sm"
                      onClick={() => setGenerateBatchModalOpen(true)}
                      loading={isGeneratingQuery}
                      disabled={!isNewBatchEnabled}
                      sx={{
                        backgroundColor: "transparent",
                        border: "1px solid rgba(242, 245, 250, 0.25)",
                        color: "rgba(242, 245, 250, 0.5)",
                        fontWeight: 600,
                        cursor: isNewBatchEnabled ? "pointer" : "not-allowed",
                        "&:hover": {
                          backgroundColor: "transparent",
                          borderColor: "rgba(242, 245, 250, 0.35)",
                          color: "rgba(242, 245, 250, 0.75)",
                        },
                      }}
                    >
                      Generate New Batch
                    </Button>
                  </span>
                </Tooltip>
              </Box>
              <Typography level="body-xs" sx={{ mt: 1, color: "rgba(242, 245, 250, 0.65)" }}>
                this will generate new set of query
              </Typography>
            </Card>

            {isLoadingBatches ? (
              <Typography level="body-sm" sx={{ color: textSecondary, textAlign: "center", mt: 2 }}>
                Loading batches...
              </Typography>
            ) : queryBatches.length === 0 ? (
              <Typography level="body-sm" sx={{ color: textSecondary, textAlign: "center", mt: 2 }}>
                No batches yet. Generate a new batch to see queries.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {queryBatches.map((batch: any) => (
                  <Card
                    key={batch.id}
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      backgroundColor: "rgba(17, 19, 24, 0.45)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(46, 212, 122, 0.18)",
                      borderRadius: "12px",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        borderColor: "rgba(46, 212, 122, 0.4)",
                        backgroundColor: "rgba(17, 19, 24, 0.6)",
                      }
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
                          <Typography
                            level="title-md"
                            sx={{
                              color: textPrimary,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {batch.name}
                          </Typography>
                          {batch.created_at && (
                            <Typography
                              level="body-xs"
                              sx={{ color: "rgba(162, 167, 180, 0.5)", whiteSpace: "nowrap", pt: 0.2 }}
                            >
                              {formatRelativeTime(batch.created_at)}
                            </Typography>
                          )}
                        </Box>
                        {batch.description ? (
                          <Typography
                            level="body-xs"
                            sx={{
                              color: textSecondary,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {batch.description}
                          </Typography>
                        ) : null}
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Tooltip
                          title={batch.has_used_queries ? "Cannot delete batch with used queries" : "Delete Batch"}
                          placement="top"
                          arrow
                        >
                          <span>
                            <IconButton
                              size="sm"
                              variant="outlined"
                              onClick={(e) => {
                                void handleDeleteBatch(batch.id, e);
                              }}
                              disabled={isDeletingBatch === batch.id || batch.has_used_queries}
                              sx={{
                                borderColor: "rgba(243, 91, 100, 0.25)",
                                color: "#F35B64",
                                minWidth: 32,
                                minHeight: 32,
                                "&:hover": {
                                  backgroundColor: "rgba(243, 91, 100, 0.1)",
                                  borderColor: "rgba(243, 91, 100, 0.4)",
                                },
                                "&:disabled": {
                                  color: "rgba(243, 91, 100, 0.4)",
                                  borderColor: "rgba(243, 91, 100, 0.1)",
                                  cursor: "not-allowed",
                                },
                              }}
                            >
                              {isDeletingBatch === batch.id ? (
                                <CircularProgress size="sm" sx={{ "--CircularProgress-size": "16px", color: "#F35B64" }} />
                              ) : (
                                <DeleteOutlineIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Button
                          size="sm"
                          variant="outlined"
                          loading={isLoadingBatchQueries && selectedBatchId === batch.id}
                          onClick={() => {
                            void loadQueriesForBatch(batch.id);
                          }}
                          sx={{
                            borderColor: "rgba(46, 212, 122, 0.3)",
                            color: accentColor,
                            fontWeight: 600,
                            minWidth: 80,
                            "&:hover": {
                              backgroundColor: "rgba(46, 212, 122, 0.1)",
                              borderColor: "rgba(46, 212, 122, 0.5)",
                            },
                          }}
                        >
                          Open
                        </Button>
                      </Box>
                    </Box>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <IconButton
                variant="plain"
                onClick={handleBackToBatches}
                sx={{
                  color: textSecondary,
                  "&:hover": {
                    backgroundColor: "rgba(242, 245, 250, 0.08)",
                    color: textPrimary,
                  },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
            </Box>
            <Typography level="h2" sx={{ mb: 3, color: textPrimary, textAlign: "center" }}>
              Generated Search Queries
            </Typography>

            <Box sx={{ mb: 4, textAlign: "center" }}>
              <Chip
                size="md"
                variant="soft"
                sx={{
                  backgroundColor: "rgba(46, 212, 122, 0.12)",
                  color: "#2ED47A",
                  fontWeight: 600,
                  px: 3,
                }}
              >
                Generated Queries
              </Chip>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 3 }}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography level="title-md" sx={{ color: textPrimary }}>
                    {queryBatches.find((b: any) => b.id === selectedBatchId)?.name || "Batch"}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={3} alignItems="center">
                  {(() => {
                    const batch = queryBatches.find((b: any) => b.id === selectedBatchId);
                    return (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Typography level="body-sm" sx={{ color: textSecondary, fontWeight: 500 }}>
                          Daily Tracking
                        </Typography>
                        <Switch
                          size="sm"
                          checked={batch?.daily_tracker || false}
                          onChange={() => handleToggleDailyTracking(selectedBatchId!, batch?.daily_tracker || false)}
                          sx={{
                            "--Switch-trackBackground": "rgba(255, 255, 255, 0.1)",
                            "&.Mui-checked": {
                              "--Switch-trackBackground": accentColor,
                            },
                          }}
                        />
                      </Box>
                    );
                  })()}
                  <Button
                    size="sm"
                    variant="outlined"
                    onClick={handleBackToBatches}
                    sx={{
                      borderColor: "rgba(242, 245, 250, 0.25)",
                      color: textPrimary,
                      "&:hover": {
                        backgroundColor: "rgba(242, 245, 250, 0.08)",
                        borderColor: "rgba(242, 245, 250, 0.35)",
                      },
                    }}
                  >
                    Back to Batches
                  </Button>
                </Stack>
              </Box>
            </Box>

            {serverError && (
              <Card
                variant="outlined"
                sx={{
                  mb: 3,
                  p: 2,
                  backgroundColor: "rgba(243, 91, 100, 0.08)",
                  borderColor: "rgba(243, 91, 100, 0.25)",
                }}
              >
                <Typography level="body-sm" sx={{ color: "#F35B64", fontWeight: 600 }}>
                  {serverError}
                </Typography>
              </Card>
            )}

            {selectedBatchId && allPerplexityQueries.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ mb: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography level="title-md" sx={{ color: textPrimary }}>
                      🔍 Perplexity Search Queries
                    </Typography>
                    <Chip
                      size="sm"
                      variant="soft"
                      sx={{ backgroundColor: "rgba(46, 212, 122, 0.12)", color: "#2ED47A" }}
                    >
                      {selectedPerplexityQueries.length}/{maxPerplexityQueries} selected
                    </Chip>
                  </Box>

                  {(() => {
                    const unusedPerplexity = allPerplexityQueries.filter((q) => !usedPerplexityQueries.includes(q));
                    const unusedGoogle = allGoogleQueries.filter((q) => !usedGoogleQueries.includes(q));
                    const unusedChatgpt = allChatgptQueries.filter((q) => !usedChatgptQueries.includes(q));
                    const hasUnused =
                      unusedPerplexity.length > 0 || unusedGoogle.length > 0 || unusedChatgpt.length > 0;

                    if (!hasUnused) return null;

                    const allUnusedSelected =
                      unusedPerplexity.every((q) => selectedPerplexityQueries.includes(q)) &&
                      unusedGoogle.every((q) => selectedGoogleQueries.includes(q)) &&
                      unusedChatgpt.every((q) => selectedChatgptQueries.includes(q));

                    return (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: "auto" }}>
                        <Checkbox
                          size="sm"
                          variant="outlined"
                          checked={allUnusedSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPerplexityQueries([
                                ...new Set([...selectedPerplexityQueries, ...unusedPerplexity]),
                              ]);
                              setSelectedGoogleQueries([...new Set([...selectedGoogleQueries, ...unusedGoogle])]);
                              setSelectedChatgptQueries([...new Set([...selectedChatgptQueries, ...unusedChatgpt])]);
                            } else {
                              setSelectedPerplexityQueries(
                                selectedPerplexityQueries.filter((q) => !unusedPerplexity.includes(q))
                              );
                              setSelectedGoogleQueries(
                                selectedGoogleQueries.filter((q) => !unusedGoogle.includes(q))
                              );
                              setSelectedChatgptQueries(
                                selectedChatgptQueries.filter((q) => !unusedChatgpt.includes(q))
                              );
                            }
                          }}
                          label={
                            <Typography sx={{ color: "#2ED47A", fontWeight: 600, fontSize: "0.875rem" }}>
                              Select Unused
                            </Typography>
                          }
                          sx={{
                            "& .MuiCheckbox-checkbox": {
                              borderColor: "rgba(255, 255, 255, 0.45) !important",
                              borderWidth: "2px",
                              backgroundColor: "transparent",
                              transition: "all 0.2s ease",
                            },
                            "&:hover .MuiCheckbox-checkbox": {
                              borderColor: "rgba(46, 212, 122, 0.8) !important",
                            },
                            "&.Mui-checked .MuiCheckbox-checkbox": {
                              backgroundColor: "#2ED47A",
                              borderColor: "#2ED47A !important",
                            },
                            "& .MuiCheckbox-root": {
                              color: "#2ED47A",
                            },
                          }}
                        />
                      </Box>
                    );
                  })()}
                </Box>
                <Stack spacing={2}>
                  {allPerplexityQueries.map((query, index) => {
                    return (
                      <Card
                        key={`perplexity-${index}`}
                        variant="outlined"
                        sx={{
                          p: 2,
                          backgroundColor: "rgba(17, 19, 24, 0.4)",
                          backdropFilter: "blur(6px)",
                          borderRadius: "12px",
                          border: selectedPerplexityQueries.includes(query)
                            ? "2px solid rgba(46, 212, 122, 0.6)"
                            : "1px solid rgba(46, 212, 122, 0.15)",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            backgroundColor: "rgba(17, 19, 24, 0.55)",
                          }
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                          <Checkbox
                            checked={
                              selectedPerplexityQueries.includes(query) || usedPerplexityQueries.includes(query)
                            }
                            disabled={usedPerplexityQueries.includes(query)}
                            onChange={() => handleQuerySelection(query, "perplexity")}
                            variant="outlined"
                            sx={{
                              "& .MuiCheckbox-checkbox": {
                                borderColor: usedPerplexityQueries.includes(query) ? "rgba(108, 117, 125, 0.3) !important" : "rgba(255, 255, 255, 0.45) !important",
                                borderWidth: "2px",
                                backgroundColor: "transparent",
                                transition: "all 0.2s ease",
                              },
                              "&.Mui-checked .MuiCheckbox-checkbox": {
                                backgroundColor: "#2ED47A",
                                borderColor: "#2ED47A !important",
                              },
                              "& .MuiCheckbox-root": {
                                color: usedPerplexityQueries.includes(query) ? "#6c757d" : "#2ED47A",
                              },
                              "& .MuiCheckbox-disabled": {
                                color: "#6c757d",
                              },
                              "&:hover:not(.Mui-disabled) .MuiCheckbox-checkbox": {
                                borderColor: "#2ED47A !important",
                              }
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            {editingQuery?.pipeline === "perplexity" && editingQuery?.index === index ? (
                              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                <Input
                                  value={editingQuery.value}
                                  onChange={(e) => setEditingQuery({ ...editingQuery, value: e.target.value })}
                                  onKeyDown={handleEditKeyDown}
                                  sx={{
                                    flex: 1,
                                    "&::before": {
                                      display: "none",
                                    },
                                    "&::after": {
                                      display: "none",
                                    },
                                    "&.Mui-focused": {
                                      backgroundColor: "rgba(46, 212, 122, 0.05)",
                                    },
                                  }}
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    void handleSaveEditedQuery();
                                  }}
                                  loading={editingQueryLoading}
                                  disabled={editingQueryLoading}
                                  sx={{
                                    minWidth: 60,
                                    backgroundColor: "#2ED47A",
                                    color: "#0D0F14",
                                    fontWeight: 600,
                                    "&:hover": {
                                      backgroundColor: "#26B869",
                                    },
                                  }}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outlined"
                                  onClick={handleCancelEdit}
                                  sx={{
                                    minWidth: 60,
                                    borderColor: "rgba(243, 91, 100, 0.4)",
                                    color: "#F35B64",
                                    "&:hover": {
                                      backgroundColor: "rgba(243, 91, 100, 0.1)",
                                    },
                                  }}
                                >
                                  Cancel
                                </Button>
                              </Box>
                            ) : (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography level="body-md" sx={{ color: textSecondary, flex: 1 }}>
                                  "{query}"
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  {usedPerplexityQueries.includes(query) && (
                                    <Chip
                                      size="sm"
                                      variant="soft"
                                      sx={{
                                        backgroundColor: "rgba(108, 117, 125, 0.12)",
                                        color: "#6c757d",
                                        fontSize: "0.75rem",
                                        fontWeight: 500,
                                      }}
                                    >
                                      Used
                                    </Chip>
                                  )}
                                  {usedPerplexityQueries.includes(query) ? (() => {
                                    const analyses = getAnalysesForQuery(query, "perplexity");
                                    const analysisCount = analyses.length;
                                    const trend = getTrendIndicator(analyses);

                                    return (
                                      <Box sx={{ position: "relative" }}>
                                        <Tooltip title="View Perplexity analysis result" placement="top">
                                          <Button
                                            size="sm"
                                            variant="outlined"
                                            loading={loadingResultKey === `perplexity-${query}`}
                                            disabled={loadingResultKey === `perplexity-${query}`}
                                            onClick={() => {
                                              void handleViewAnalysisResult(query, "perplexity");
                                            }}
                                            onContextMenu={handleResultMenuOpen}
                                            sx={{
                                              minWidth: analysisCount > 1 ? 110 : 90,
                                              borderColor: "rgba(46, 212, 122, 0.3)",
                                              color: "#2ED47A",
                                              fontWeight: 600,
                                              fontSize: "0.75rem",
                                              position: "relative",
                                              boxShadow:
                                                analysisCount > 1
                                                  ? "0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)"
                                                  : "none",
                                              "&:hover": {
                                                backgroundColor: "rgba(46, 212, 122, 0.1)",
                                                borderColor: "rgba(46, 212, 122, 0.5)",
                                              },
                                            }}
                                          >
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                              <Typography sx={{ fontSize: "0.75rem" }}>📄 Result</Typography>
                                              {analysisCount > 1 && (
                                                <Chip
                                                  size="sm"
                                                  variant="solid"
                                                  sx={{
                                                    ml: 0.5,
                                                    backgroundColor: "rgba(46, 212, 122, 0.2)",
                                                    color: "#2ED47A",
                                                    fontSize: "0.7rem",
                                                    fontWeight: 600,
                                                    minWidth: 20,
                                                    height: 20,
                                                    borderRadius: "10px",
                                                  }}
                                                >
                                                  {analysisCount}
                                                </Chip>
                                              )}
                                              {trend && (
                                                <Typography
                                                  sx={{
                                                    fontSize: "0.8rem",
                                                    color:
                                                      trend.direction === "up"
                                                        ? "#2ED47A"
                                                        : trend.direction === "down"
                                                          ? "#F35B64"
                                                          : "#6c757d",
                                                  }}
                                                >
                                                  {trend.icon}
                                                </Typography>
                                              )}
                                            </Box>
                                          </Button>
                                        </Tooltip>
                                        {analysisCount > 1 && (
                                          <Menu
                                            anchorEl={resultMenuAnchor}
                                            open={Boolean(resultMenuAnchor)}
                                            onClose={handleResultMenuClose}
                                            sx={{
                                              "& .MuiList-root": {
                                                py: 0.5,
                                              },
                                            }}
                                          >
                                            <Box
                                              sx={{
                                                px: 1.5,
                                                py: 1,
                                                borderBottom: "1px solid rgba(255,255,255,0.1)",
                                              }}
                                            >
                                              <Typography
                                                level="title-sm"
                                                sx={{ color: "#2ED47A", fontWeight: 600 }}
                                              >
                                                Analysis History
                                              </Typography>
                                            </Box>
                                            {analyses.map((analysis: any, analysisIndex: number) => (
                                              <MenuItem
                                                key={analysis.id}
                                                onClick={() => {
                                                  void handleViewAnalysisById(analysis.id, "perplexity");
                                                }}
                                                sx={{
                                                  py: 0.75,
                                                  px: 1.5,
                                                  display: "flex",
                                                  justifyContent: "space-between",
                                                  alignItems: "center",
                                                  "&:hover": {
                                                    backgroundColor: "rgba(46, 212, 122, 0.1)",
                                                  },
                                                }}
                                              >
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                  <Typography level="body-sm" sx={{ fontSize: "0.8rem" }}>
                                                    {analysisIndex === 0
                                                      ? "Latest"
                                                      : analysisIndex === 1
                                                        ? "v2"
                                                        : `v${analysisIndex + 1}`}
                                                  </Typography>
                                                  {analysisIndex === 0 && trend && (
                                                    <Typography
                                                      sx={{
                                                        fontSize: "0.8rem",
                                                        color:
                                                          trend.direction === "up"
                                                            ? "#2ED47A"
                                                            : trend.direction === "down"
                                                              ? "#F35B64"
                                                              : "#6c757d",
                                                      }}
                                                    >
                                                      {trend.icon}
                                                    </Typography>
                                                  )}
                                                </Box>
                                                <Typography
                                                  level="body-sm"
                                                  sx={{ fontSize: "0.75rem", color: "#9ca3af" }}
                                                >
                                                  {formatRelativeTime(analysis.created_at)}
                                                </Typography>
                                              </MenuItem>
                                            ))}
                                          </Menu>
                                        )}
                                      </Box>
                                    );
                                  })() : (
                                    <Tooltip title="Edit query" placement="top">
                                      <IconButton
                                        size="sm"
                                        variant="outlined"
                                        onClick={() => handleEditQuery(query, index, "perplexity")}
                                        sx={{
                                          borderColor: "rgba(46, 212, 122, 0.3)",
                                          color: "#2ED47A",
                                          "&:hover": {
                                            backgroundColor: "rgba(46, 212, 122, 0.1)",
                                            borderColor: "rgba(46, 212, 122, 0.5)",
                                          },
                                        }}
                                      >
                                        <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {selectedBatchId && allGoogleQueries.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography level="title-md" sx={{ color: textPrimary }}>
                    🌐 Google AI Overview Queries
                  </Typography>
                  <Chip
                    size="sm"
                    variant="soft"
                    sx={{ backgroundColor: "rgba(46, 212, 122, 0.12)", color: "#2ED47A" }}
                  >
                    {selectedGoogleQueries.length}/{maxGoogleQueries} selected
                  </Chip>
                </Box>
                <Stack spacing={2}>
                  {allGoogleQueries.map((query, index) => {
                    return (
                      <Card
                        key={`google-${index}`}
                        variant="outlined"
                        sx={{
                          p: 2,
                          backgroundColor: "rgba(17, 19, 24, 0.6)",
                          border: selectedGoogleQueries.includes(query)
                            ? "2px solid rgba(46, 212, 122, 0.5)"
                            : "1px solid rgba(46, 212, 122, 0.2)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                          <Checkbox
                            checked={selectedGoogleQueries.includes(query) || usedGoogleQueries.includes(query)}
                            disabled={usedGoogleQueries.includes(query)}
                            onChange={() => handleQuerySelection(query, "google_overview")}
                            variant="outlined"
                            sx={{
                              "& .MuiCheckbox-checkbox": {
                                borderColor: usedGoogleQueries.includes(query) ? "rgba(108, 117, 125, 0.3) !important" : "rgba(255, 255, 255, 0.45) !important",
                                borderWidth: "2px",
                                backgroundColor: "transparent",
                                transition: "all 0.2s ease",
                              },
                              "&.Mui-checked .MuiCheckbox-checkbox": {
                                backgroundColor: "#2ED47A",
                                borderColor: "#2ED47A !important",
                              },
                              "& .MuiCheckbox-root": {
                                color: usedGoogleQueries.includes(query) ? "#6c757d" : "#2ED47A",
                              },
                              "& .MuiCheckbox-disabled": {
                                color: "#6c757d",
                              },
                              "&:hover:not(.Mui-disabled) .MuiCheckbox-checkbox": {
                                borderColor: "#2ED47A !important",
                              }
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            {editingQuery?.pipeline === "google_overview" && editingQuery?.index === index ? (
                              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <Typography
                                  level="body-xs"
                                  sx={{
                                    color: "#94a3b8",
                                    px: 1,
                                    fontStyle: "italic",
                                    mb: 0.5,
                                  }}
                                >
                                  💡 These queries are designed to invoke AI Overview. Please maintain the consistency and
                                  structure of the query.
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                  <Input
                                    value={editingQuery.value}
                                    onChange={(e) => setEditingQuery({ ...editingQuery, value: e.target.value })}
                                    onKeyDown={handleEditKeyDown}
                                    sx={{
                                      flex: 1,
                                      "&::before": {
                                        display: "none",
                                      },
                                      "&::after": {
                                        display: "none",
                                      },
                                      "&.Mui-focused": {
                                        backgroundColor: "rgba(46, 212, 122, 0.05)",
                                      },
                                    }}
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      void handleSaveEditedQuery();
                                    }}
                                    loading={editingQueryLoading}
                                    disabled={
                                      editingQueryLoading || editingQuery.value.trim().split(/\s+/).length < 6
                                    }
                                    sx={{
                                      minWidth: 60,
                                      backgroundColor:
                                        editingQuery.value.trim().split(/\s+/).length >= 6 ? "#2ED47A" : "transparent",
                                      color:
                                        editingQuery.value.trim().split(/\s+/).length >= 6 ? "#0D0F14" : "#6c757d",
                                      fontWeight: 600,
                                      border:
                                        editingQuery.value.trim().split(/\s+/).length >= 6
                                          ? "none"
                                          : "1px solid rgba(108, 117, 125, 0.3)",
                                      "&:hover": {
                                        backgroundColor:
                                          editingQuery.value.trim().split(/\s+/).length >= 6
                                            ? "#26B869"
                                            : "rgba(108, 117, 125, 0.1)",
                                      },
                                      "&:disabled": {
                                        backgroundColor: "transparent",
                                        color: "#6c757d",
                                        border: "1px solid rgba(108, 117, 125, 0.2)",
                                      },
                                    }}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outlined"
                                    onClick={handleCancelEdit}
                                    sx={{
                                      minWidth: 60,
                                      borderColor: "rgba(243, 91, 100, 0.4)",
                                      color: "#F35B64",
                                      "&:hover": {
                                        backgroundColor: "rgba(243, 91, 100, 0.1)",
                                      },
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </Box>
                                <Typography
                                  level="body-xs"
                                  sx={{
                                    color:
                                      editingQuery.value.trim().split(/\s+/).length >= 6 ? "#2ED47A" : "#F35B64",
                                    px: 1,
                                    fontStyle: "italic",
                                  }}
                                >
                                  Word count: {editingQuery.value.trim().split(/\s+/).length} / 6 (minimum for AI Overview)
                                </Typography>
                              </Box>
                            ) : (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography level="body-md" sx={{ color: textSecondary, flex: 1 }}>
                                  "{query}"
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  {usedGoogleQueries.includes(query) && (
                                    <Chip
                                      size="sm"
                                      variant="soft"
                                      sx={{
                                        backgroundColor: "rgba(108, 117, 125, 0.12)",
                                        color: "#6c757d",
                                        fontSize: "0.75rem",
                                        fontWeight: 500,
                                      }}
                                    >
                                      Used
                                    </Chip>
                                  )}
                                  {usedGoogleQueries.includes(query) ? (() => {
                                    const analyses = getAnalysesForQuery(query, "google_overview");
                                    const analysisCount = analyses.length;
                                    const trend = getTrendIndicator(analyses);

                                    return (
                                      <Box sx={{ position: "relative" }}>
                                        <Tooltip title="View Google AI Overview analysis result" placement="top">
                                          <Button
                                            size="sm"
                                            variant="outlined"
                                            loading={loadingResultKey === `google_overview-${query}`}
                                            disabled={loadingResultKey === `google_overview-${query}`}
                                            onClick={() => {
                                              void handleViewAnalysisResult(query, "google_overview");
                                            }}
                                            onContextMenu={handleResultMenuOpen}
                                            sx={{
                                              minWidth: analysisCount > 1 ? 110 : 90,
                                              borderColor: "rgba(66, 133, 244, 0.3)",
                                              color: "#4285F4",
                                              fontWeight: 600,
                                              fontSize: "0.75rem",
                                              position: "relative",
                                              boxShadow:
                                                analysisCount > 1
                                                  ? "0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)"
                                                  : "none",
                                              "&:hover": {
                                                backgroundColor: "rgba(66, 133, 244, 0.1)",
                                                borderColor: "rgba(66, 133, 244, 0.5)",
                                              },
                                            }}
                                          >
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                              <Typography sx={{ fontSize: "0.75rem" }}>🌐 Result</Typography>
                                              {analysisCount > 1 && (
                                                <Chip
                                                  size="sm"
                                                  variant="solid"
                                                  sx={{
                                                    ml: 0.5,
                                                    backgroundColor: "rgba(66, 133, 244, 0.2)",
                                                    color: "#4285F4",
                                                    fontSize: "0.7rem",
                                                    fontWeight: 600,
                                                    minWidth: 20,
                                                    height: 20,
                                                    borderRadius: "10px",
                                                  }}
                                                >
                                                  {analysisCount}
                                                </Chip>
                                              )}
                                              {trend && (
                                                <Typography
                                                  sx={{
                                                    fontSize: "0.8rem",
                                                    color:
                                                      trend.direction === "up"
                                                        ? "#4285F4"
                                                        : trend.direction === "down"
                                                          ? "#F35B64"
                                                          : "#6c757d",
                                                  }}
                                                >
                                                  {trend.icon}
                                                </Typography>
                                              )}
                                            </Box>
                                          </Button>
                                        </Tooltip>
                                        {analysisCount > 1 && (
                                          <Menu
                                            anchorEl={resultMenuAnchor}
                                            open={Boolean(resultMenuAnchor)}
                                            onClose={handleResultMenuClose}
                                            sx={{
                                              "& .MuiList-root": {
                                                py: 0.5,
                                              },
                                            }}
                                          >
                                            <Box
                                              sx={{
                                                px: 1.5,
                                                py: 1,
                                                borderBottom: "1px solid rgba(255,255,255,0.1)",
                                              }}
                                            >
                                              <Typography
                                                level="title-sm"
                                                sx={{ color: "#4285F4", fontWeight: 600 }}
                                              >
                                                Analysis History
                                              </Typography>
                                            </Box>
                                            {analyses.map((analysis: any, analysisIndex: number) => (
                                              <MenuItem
                                                key={analysis.id}
                                                onClick={() => {
                                                  void handleViewAnalysisById(analysis.id, "google_overview");
                                                }}
                                                sx={{
                                                  py: 0.75,
                                                  px: 1.5,
                                                  display: "flex",
                                                  justifyContent: "space-between",
                                                  alignItems: "center",
                                                  "&:hover": {
                                                    backgroundColor: "rgba(66, 133, 244, 0.1)",
                                                  },
                                                }}
                                              >
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                  <Typography level="body-sm" sx={{ fontSize: "0.8rem" }}>
                                                    {analysisIndex === 0
                                                      ? "Latest"
                                                      : analysisIndex === 1
                                                        ? "v2"
                                                        : `v${analysisIndex + 1}`}
                                                  </Typography>
                                                  {analysisIndex === 0 && trend && (
                                                    <Typography
                                                      sx={{
                                                        fontSize: "0.8rem",
                                                        color:
                                                          trend.direction === "up"
                                                            ? "#4285F4"
                                                            : trend.direction === "down"
                                                              ? "#F35B64"
                                                              : "#6c757d",
                                                      }}
                                                    >
                                                      {trend.icon}
                                                    </Typography>
                                                  )}
                                                </Box>
                                                <Typography
                                                  level="body-sm"
                                                  sx={{ fontSize: "0.75rem", color: "#9ca3af" }}
                                                >
                                                  {formatRelativeTime(analysis.created_at)}
                                                </Typography>
                                              </MenuItem>
                                            ))}
                                          </Menu>
                                        )}
                                      </Box>
                                    );
                                  })() : (
                                    <Tooltip title="Edit query (minimum 6 words for AI Overview)" placement="top">
                                      <IconButton
                                        size="sm"
                                        variant="outlined"
                                        onClick={() => handleEditQuery(query, index, "google_overview")}
                                        sx={{
                                          borderColor: "rgba(46, 212, 122, 0.3)",
                                          color: "#2ED47A",
                                          "&:hover": {
                                            backgroundColor: "rgba(46, 212, 122, 0.1)",
                                            borderColor: "rgba(46, 212, 122, 0.5)",
                                          },
                                        }}
                                      >
                                        <EditOutlinedIcon />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {selectedBatchId && allChatgptQueries.length === 0 && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography level="title-md" sx={{ color: textPrimary }}>
                    💬 ChatGPT Queries
                  </Typography>
                </Box>
                <Card
                  variant="outlined"
                  sx={{
                    p: 3,
                    backgroundColor: "rgba(255, 193, 7, 0.04)",
                    border: "1px solid rgba(255, 193, 7, 0.2)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                    <Box component="span" sx={{ fontSize: "1.4rem", lineHeight: 1, mt: 0.3 }}>
                      ℹ️
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        level="title-sm"
                        sx={{ color: "rgba(255, 193, 7, 0.85)", mb: 1, fontWeight: 600 }}
                      >
                        No ChatGPT queries in this batch
                      </Typography>
                      <Typography level="body-sm" sx={{ color: textSecondary, mb: 2, lineHeight: 1.6 }}>
                        This batch was created before the ChatGPT pipeline was available. You can generate ChatGPT-specific
                        queries for this batch now — they will be added alongside the existing Perplexity and Google
                        queries.
                      </Typography>
                      <Button
                        size="sm"
                        variant="outlined"
                        loading={isGeneratingChatgptQueries}
                        disabled={isGeneratingChatgptQueries || !currentProductId}
                        onClick={handleGenerateChatgptQueriesForBatch}
                        sx={{
                          borderColor: "rgba(255, 193, 7, 0.3)",
                          color: "rgba(255, 193, 7, 0.9)",
                          fontWeight: 600,
                          px: 3,
                          "&:hover": {
                            backgroundColor: "rgba(255, 193, 7, 0.08)",
                            borderColor: "rgba(255, 193, 7, 0.4)",
                          },
                        }}
                      >
                        {isGeneratingChatgptQueries ? "Generating..." : "✨ Generate ChatGPT Queries"}
                      </Button>
                    </Box>
                  </Box>
                </Card>
              </Box>
            )}

            {selectedBatchId && allChatgptQueries.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography level="title-md" sx={{ color: textPrimary }}>
                    💬 ChatGPT Queries
                  </Typography>
                  <Chip
                    size="sm"
                    variant="soft"
                    sx={{ backgroundColor: "rgba(46, 212, 122, 0.12)", color: "#2ED47A" }}
                  >
                    {selectedChatgptQueries.length}/{maxChatgptQueries} selected
                  </Chip>
                </Box>
                <Stack spacing={2}>
                  {allChatgptQueries.map((query, index) => {
                    return (
                      <Card
                        key={`chatgpt-${index}`}
                        variant="outlined"
                        sx={{
                          p: 2,
                          backgroundColor: "rgba(17, 19, 24, 0.6)",
                          border: selectedChatgptQueries.includes(query)
                            ? "2px solid rgba(46, 212, 122, 0.5)"
                            : "1px solid rgba(46, 212, 122, 0.2)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                          <Checkbox
                            checked={selectedChatgptQueries.includes(query) || usedChatgptQueries.includes(query)}
                            disabled={usedChatgptQueries.includes(query)}
                            onChange={() => handleQuerySelection(query, "chatgpt")}
                            variant="outlined"
                            sx={{
                              "& .MuiCheckbox-checkbox": {
                                borderColor: usedChatgptQueries.includes(query) ? "rgba(108, 117, 125, 0.3) !important" : "rgba(255, 255, 255, 0.45) !important",
                                borderWidth: "2px",
                                backgroundColor: "transparent",
                                transition: "all 0.2s ease",
                              },
                              "&.Mui-checked .MuiCheckbox-checkbox": {
                                backgroundColor: "#2ED47A",
                                borderColor: "#2ED47A !important",
                              },
                              "& .MuiCheckbox-root": {
                                color: usedChatgptQueries.includes(query) ? "#6c757d" : "#2ED47A",
                              },
                              "& .MuiCheckbox-disabled": {
                                color: "#6c757d",
                              },
                              "&:hover:not(.Mui-disabled) .MuiCheckbox-checkbox": {
                                borderColor: "#2ED47A !important",
                              }
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            {editingQuery?.pipeline === "chatgpt" && editingQuery?.index === index ? (
                              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                <Input
                                  value={editingQuery.value}
                                  onChange={(e) => setEditingQuery({ ...editingQuery, value: e.target.value })}
                                  onKeyDown={handleEditKeyDown}
                                  sx={{
                                    flex: 1,
                                    "&::before": {
                                      display: "none",
                                    },
                                    "&::after": {
                                      display: "none",
                                    },
                                    "&.Mui-focused": {
                                      backgroundColor: "rgba(46, 212, 122, 0.05)",
                                    },
                                  }}
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    void handleSaveEditedQuery();
                                  }}
                                  loading={editingQueryLoading}
                                  disabled={editingQueryLoading}
                                  sx={{
                                    minWidth: 60,
                                    backgroundColor: "#2ED47A",
                                    color: "#0D0F14",
                                    fontWeight: 600,
                                    "&:hover": {
                                      backgroundColor: "#26B869",
                                    },
                                  }}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outlined"
                                  onClick={handleCancelEdit}
                                  sx={{
                                    minWidth: 60,
                                    borderColor: "rgba(243, 91, 100, 0.4)",
                                    color: "#F35B64",
                                    "&:hover": {
                                      backgroundColor: "rgba(243, 91, 100, 0.1)",
                                    },
                                  }}
                                >
                                  Cancel
                                </Button>
                              </Box>
                            ) : (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography level="body-md" sx={{ color: textSecondary, flex: 1 }}>
                                  "{query}"
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  {usedChatgptQueries.includes(query) && (
                                    <Chip
                                      size="sm"
                                      variant="soft"
                                      sx={{
                                        backgroundColor: "rgba(108, 117, 125, 0.12)",
                                        color: "#6c757d",
                                        fontSize: "0.75rem",
                                        fontWeight: 500,
                                      }}
                                    >
                                      Used
                                    </Chip>
                                  )}
                                  {usedChatgptQueries.includes(query) ? (() => {
                                    const analyses = getAnalysesForQuery(query, "chatgpt");
                                    const analysisCount = analyses.length;
                                    const trend = getTrendIndicator(analyses);

                                    return (
                                      <Box sx={{ position: "relative" }}>
                                        <Tooltip title="View ChatGPT analysis result" placement="top">
                                          <Button
                                            size="sm"
                                            variant="outlined"
                                            loading={loadingResultKey === `chatgpt-${query}`}
                                            disabled={loadingResultKey === `chatgpt-${query}`}
                                            onClick={() => {
                                              void handleViewAnalysisResult(query, "chatgpt");
                                            }}
                                            onContextMenu={handleResultMenuOpen}
                                            sx={{
                                              minWidth: analysisCount > 1 ? 110 : 90,
                                              borderColor: "rgba(46, 212, 122, 0.3)",
                                              color: "#2ED47A",
                                              fontWeight: 600,
                                              fontSize: "0.75rem",
                                              position: "relative",
                                              boxShadow:
                                                analysisCount > 1
                                                  ? "0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)"
                                                  : "none",
                                              "&:hover": {
                                                backgroundColor: "rgba(46, 212, 122, 0.1)",
                                                borderColor: "rgba(46, 212, 122, 0.5)",
                                              },
                                            }}
                                          >
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                              <Typography sx={{ fontSize: "0.75rem" }}>📄 Result</Typography>
                                              {analysisCount > 1 && (
                                                <Chip
                                                  size="sm"
                                                  variant="solid"
                                                  sx={{
                                                    ml: 0.5,
                                                    backgroundColor: "rgba(46, 212, 122, 0.2)",
                                                    color: "#2ED47A",
                                                    fontSize: "0.7rem",
                                                    fontWeight: 600,
                                                    minWidth: 20,
                                                    height: 20,
                                                    borderRadius: "10px",
                                                  }}
                                                >
                                                  {analysisCount}
                                                </Chip>
                                              )}
                                              {trend && (
                                                <Typography
                                                  sx={{
                                                    fontSize: "0.8rem",
                                                    color:
                                                      trend.direction === "up"
                                                        ? "#2ED47A"
                                                        : trend.direction === "down"
                                                          ? "#F35B64"
                                                          : "#6c757d",
                                                  }}
                                                >
                                                  {trend.icon}
                                                </Typography>
                                              )}
                                            </Box>
                                          </Button>
                                        </Tooltip>
                                        {analysisCount > 1 && (
                                          <Menu
                                            anchorEl={resultMenuAnchor}
                                            open={Boolean(resultMenuAnchor)}
                                            onClose={handleResultMenuClose}
                                            sx={{
                                              "& .MuiList-root": {
                                                py: 0.5,
                                              },
                                            }}
                                          >
                                            <Box
                                              sx={{
                                                px: 1.5,
                                                py: 1,
                                                borderBottom: "1px solid rgba(255,255,255,0.1)",
                                              }}
                                            >
                                              <Typography
                                                level="title-sm"
                                                sx={{ color: "#2ED47A", fontWeight: 600 }}
                                              >
                                                Analysis History
                                              </Typography>
                                            </Box>
                                            {analyses.map((analysis: any, analysisIndex: number) => (
                                              <MenuItem
                                                key={analysis.id}
                                                onClick={() => {
                                                  void handleViewAnalysisById(analysis.id, "chatgpt");
                                                }}
                                                sx={{
                                                  py: 0.75,
                                                  px: 1.5,
                                                  display: "flex",
                                                  justifyContent: "space-between",
                                                  alignItems: "center",
                                                  "&:hover": {
                                                    backgroundColor: "rgba(46, 212, 122, 0.1)",
                                                  },
                                                }}
                                              >
                                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                  <Typography level="body-sm" sx={{ fontSize: "0.8rem" }}>
                                                    {analysisIndex === 0
                                                      ? "Latest"
                                                      : analysisIndex === 1
                                                        ? "v2"
                                                        : `v${analysisIndex + 1}`}
                                                  </Typography>
                                                  {analysisIndex === 0 && trend && (
                                                    <Typography
                                                      sx={{
                                                        fontSize: "0.8rem",
                                                        color:
                                                          trend.direction === "up"
                                                            ? "#2ED47A"
                                                            : trend.direction === "down"
                                                              ? "#F35B64"
                                                              : "#6c757d",
                                                      }}
                                                    >
                                                      {trend.icon}
                                                    </Typography>
                                                  )}
                                                </Box>
                                                <Typography
                                                  level="body-sm"
                                                  sx={{ fontSize: "0.75rem", color: "#9ca3af" }}
                                                >
                                                  {formatRelativeTime(analysis.created_at)}
                                                </Typography>
                                              </MenuItem>
                                            ))}
                                          </Menu>
                                        )}
                                      </Box>
                                    );
                                  })() : (
                                    <Tooltip title="Edit query" placement="top">
                                      <IconButton
                                        size="sm"
                                        variant="outlined"
                                        onClick={() => handleEditQuery(query, index, "chatgpt")}
                                        sx={{
                                          borderColor: "rgba(46, 212, 122, 0.3)",
                                          color: "#2ED47A",
                                          "&:hover": {
                                            backgroundColor: "rgba(46, 212, 122, 0.1)",
                                            borderColor: "rgba(46, 212, 122, 0.5)",
                                          },
                                        }}
                                      >
                                        <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Card>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {selectedBatchId && (allPerplexityQueries.length > 0 || allGoogleQueries.length > 0 || allChatgptQueries.length > 0) && (
              <Box sx={{ mt: 6, textAlign: "center" }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    size="lg"
                    variant="outlined"
                    disabled={!hasUsedSelected}
                    onClick={() => {
                      router.push("/optimize");
                    }}
                    sx={{
                      borderColor: "rgba(255, 193, 7, 0.35)",
                      color: "rgba(255, 193, 7, 0.95)",
                      fontWeight: 700,
                      px: 4,
                      py: 1.25,
                      "&:hover": {
                        backgroundColor: "rgba(255, 193, 7, 0.08)",
                        borderColor: "rgba(255, 193, 7, 0.5)",
                      },
                      "&:disabled": {
                        borderColor: "rgba(255, 193, 7, 0.14)",
                        color: "rgba(255, 193, 7, 0.35)",
                      },
                    }}
                  >
                    Check implementation
                  </Button>

                  <Button
                    size="lg"
                    disabled={requiredCredits === 0 || hasUsedSelected || (typeof userCredits === "number" && userCredits < requiredCredits)}
                    onClick={() => {
                      router.push("/optimize");
                    }}
                    sx={{
                      backgroundColor: "#2ED47A",
                      color: "#0D0F14",
                      fontWeight: 800,
                      px: 4,
                      py: 1.25,
                      boxShadow: "0 18px 40px rgba(46, 212, 122, 0.22)",
                      "&:hover": {
                        backgroundColor: "#26B869",
                        boxShadow: "0 22px 55px rgba(46, 212, 122, 0.3)",
                        transform: "translateY(-1px)",
                      },
                      "&:disabled": {
                        backgroundColor: "rgba(46, 212, 122, 0.25)",
                        color: "rgba(13, 15, 20, 0.55)",
                      },
                    }}
                  >
                    Optimize for AI Search ({requiredCredits})
                  </Button>
                </Box>

                {typeof userCredits === "number" && userCredits < requiredCredits && requiredCredits > 0 && (
                  <Typography sx={{ mt: 2, color: "rgba(243, 91, 100, 0.95)", fontWeight: 600 }}>
                    Insufficient credits. Required: {requiredCredits}, Available: {userCredits}
                  </Typography>
                )}

                {hasUsedSelected && (
                  <Typography sx={{ mt: 2, color: "rgba(255, 193, 7, 0.95)", fontWeight: 600 }}>
                    Used queries selected. Use "Check implementation" to re-optimize.
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
      </Card>
    </>
  );
}
