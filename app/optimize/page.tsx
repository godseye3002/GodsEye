"use client";

import {
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  List,
  ListItem,
  Menu,
  MenuItem,
  Modal,
  ModalClose,
  ModalDialog,
  Option,
  Select,
  Sheet,
  Stack,
  Switch,
  Textarea,
  Tooltip,
  Typography,
} from "@mui/joy";
import { keyframes } from "@mui/system";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
// API route handles query generation now
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import axios from 'axios';
import { useRouter } from "next/navigation";
import { useProductStore } from "./store";
import type { QueryData } from "./store";
import SOVPerformanceCard from "@/components/SOVPerformanceCard";
import DeepAnalysisCard from "@/components/DeepAnalysisCard";
import { warmupService } from "@/lib/warmupService";
import { fetchUsedQueriesFromAnalysisClient } from "@/lib/analysis-queries";
import { callAIScraper } from "@/lib/ai-scraper";
import {
  Feature,
  OptimizationAnalysis,
  OptimizedProduct,
  ProductContext,
  ProductFormData,
  createEmptyProductFormData,
} from "./types";

// Function to call the Perplexity scraper API
async function callPerplexityScraper(query: string, location: string = 'India') {
  try {
    // const response = await axios.post('http://127.0.0.1:8001/scrape', {
    //   query,
    //   location,
    //   keep_open: false,
    // });
    // const response = await axios.post('https://perplexity-scraper-new-production.up.railway.app/scrape', {
    //   query,
    //   location,
    //   keep_open: false,
    // });
    const response = await axios.post(`${process.env.NEXT_PUBLIC_PERPLEXITY_SCRAPER}`, {
      query,
      location,
      keep_open: false,
    });
    console.log('Scraper response:', response.data);

    // Validate Perplexity response
    const data = response.data;
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid Perplexity scraper response format');
    }

    // Check if ai_overview_text is empty or too short
    if (!data.ai_overview_text || data.ai_overview_text.length <= 1) {
      throw new Error('Perplexity scraper returned empty or insufficient content');
    }

    return data;
  } catch (error: any) {
    let status: number | undefined;
    let humanMessage = 'We were unable to reach the AI-powered scraping service. Please try again in a moment.';
    let technicalDetails: unknown = error;

    if (axios.isAxiosError(error)) {
      status = error.response?.status;
      technicalDetails = error.response?.data ?? error.message;

      const responseData = error.response?.data;
      if (responseData && typeof responseData === 'object' && 'error' in responseData) {
        const apiMessage = (responseData as { error?: string }).error;
        if (apiMessage && apiMessage.trim().length > 0) {
          humanMessage = apiMessage;
        }
      } else if (typeof responseData === 'string' && responseData.trim().length > 0) {
        humanMessage = responseData.trim();
      } else if (status === 404) {
        humanMessage = 'Scraper endpoint was not found. Ensure the local scraper service is running.';
      } else if (status === 429) {
        humanMessage = 'The scraping service is receiving too many requests. Please wait a bit before retrying.';
      } else if (status === 500) {
        humanMessage = 'The scraping service encountered an internal error. Please try again shortly.';
      }
    } else if (error instanceof Error) {
      humanMessage = error.message;
    }

    const logPayload: Record<string, unknown> = {
      status,
      message: humanMessage,
    };

    if (!(technicalDetails && typeof technicalDetails === 'object' && Object.keys(technicalDetails as Record<string, unknown>).length === 0)) {
      logPayload.details = technicalDetails;
    }

    console.error('Perplexity scraper error:', logPayload);

    const scraperError = new Error(humanMessage);
    scraperError.name = 'ScraperError';
    (scraperError as any).status = status;
    throw scraperError;
  }
}

function parsePositiveInt(value: unknown, fallback: number) {
  const num = typeof value === 'string' ? Number.parseInt(value, 10) : Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
}

function serializeQueriesForHistory(queries: string[]) {
  const cleaned = queries
    .map((q) => (typeof q === 'string' ? q.trim() : ''))
    .filter((q) => q.length > 0);
  if (cleaned.length <= 1) return cleaned[0] || null;
  return JSON.stringify(cleaned);
}

const analyzingDotPulse = keyframes`
  0%, 80%, 100% { transform: scale(0.65); opacity: 0.35; }
  40% { transform: scale(1); opacity: 1; }
`;

const pulse = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
`;

function OptimizePageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    formData,
    setFormData,
    originalScrapedData,
    setOriginalScrapedData,
    missingFields,
    setMissingFields,
    showMissingFieldsWarning,
    setShowMissingFieldsWarning,
    lastExtractionMethod,
    setLastExtractionMethod,
    generatedQuery,
    setGeneratedQuery,
    queryGenerationError,
    setQueryGenerationError,
    // New query array states
    allPerplexityQueries,
    allGoogleQueries,
    selectedPerplexityQueries,
    selectedGoogleQueries,
    usedPerplexityQueries,
    usedGoogleQueries,
    queryData,
    setAllPerplexityQueries,
    setAllGoogleQueries,
    setSelectedPerplexityQueries,
    setSelectedGoogleQueries,
    setUsedPerplexityQueries,
    setUsedGoogleQueries,
    setQueryData,
    optimizationAnalysis,
    setOptimizationAnalysis,
    analysisError,
    setAnalysisError,
    scrapingError,
    setScrapingError,
    serverError,
    setServerError,
    isScraping,
    setIsScraping,
    isGeneratingQuery,
    setIsGeneratingQuery,
    isAnalyzing,
    setIsAnalyzing,
    addProduct,
    saveProductToSupabase,
    updateProductInSupabase,
    loadProductsFromSupabase,
    saveQueriesToSupabase,
    setUserInfo,
    setUserCredits,
    adjustUserCredits,
    userInfo,
    userCredits,
    setProcessedSources,
    setSourceLinks,
    sourceLinks,
    processedSources,
    googleOverviewAnalysis,
    setGoogleOverviewAnalysis,
    currentProductId,
    selectedPipeline,
    setSelectedPipeline,
    setCurrentProductId,
    isNewProductSession,
    setIsNewProductSession,
    products,
    // Store UI State
    activeSection,
    setActiveSection,
    showSOVCards,
    setShowSOVCards,
    showDeepAnalysis,
    setShowDeepAnalysis,
    sovCardEngine,
    setSovCardEngine,
    selectedBatchId,
    setSelectedBatchId,
  } = useProductStore();

  const [isClient, setIsClient] = useState(false);
  const [isHeaderProductIdCopied, setIsHeaderProductIdCopied] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("India");
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [checkImplementationModalOpen, setCheckImplementationModalOpen] = useState(false);
  const [checkImplementationIncompleteModalOpen, setCheckImplementationIncompleteModalOpen] = useState(false);
  const [newAttribute, setNewAttribute] = useState("");
  // const [activeSection, setActiveSection] = useState<"product" | "perplexity" | "google" | "query">("product"); // Replaced by store
  const [specKeyEdits, setSpecKeyEdits] = useState<Record<string, string>>({});
  const [specKeyEditing, setSpecKeyEditing] = useState<Record<string, boolean>>({});

  const [queryBatches, setQueryBatches] = useState<any[]>([]);
  // const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null); // Replaced by useProductStore
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [isLoadingBatchQueries, setIsLoadingBatchQueries] = useState(false);
  const [currentSnapshotId, setCurrentSnapshotId] = useState<string | null>(null);
  const [isGenerateBatchModalOpen, setGenerateBatchModalOpen] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");
  const [isDeletingBatch, setIsDeletingBatch] = useState<string | null>(null);
  const [isNewBatchEnabled, setIsNewBatchEnabled] = useState(false);

  // Loading states for individual scrapers
  const [isPerplexityScraping, setIsPerplexityScraping] = useState(false);
  const [isGoogleScraping, setIsGoogleScraping] = useState(false);
  const [isLoadingQueries, setIsLoadingQueries] = useState(false);
  const [hasLoadedQueriesForProduct, setHasLoadedQueriesForProduct] = useState(false);
  const [loadingResultKey, setLoadingResultKey] = useState<string | null>(null);
  const lastLoadedProductIdRef = useRef<string | null>(null);

  // Result button dropdown menu state
  const [resultMenuAnchor, setResultMenuAnchor] = useState<null | HTMLElement>(null);

  // SOV card state management
  // const [showSOVCards, setShowSOVCards] = useState(false); // Replaced by store
  // const [sovCardEngine, setSovCardEngine] = useState<'google' | 'perplexity'>('google'); // Replaced by store

  // Deep Analysis state management
  // const [showDeepAnalysis, setShowDeepAnalysis] = useState(false); // Replaced by store

  // Navigation state
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);

  // Input mode state
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url');
  const [productText, setProductText] = useState('');
  const [isTextProcessing, setIsTextProcessing] = useState(false);

  const maxPerplexityQueries = parsePositiveInt(process.env.NEXT_PUBLIC_MAX_PERPLEXITY_QUERIES, 1);
  const maxGoogleQueries = parsePositiveInt(process.env.NEXT_PUBLIC_MAX_GOOGLE_QUERIES, 1);

  const formatSpecificationKeyForDisplay = useCallback((key: string) =>
    key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
    , []);

  const normalizeSpecificationKey = useCallback((key: string) =>
    key
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
    , []);

  const loadQueryBatches = useCallback(async () => {
    if (!user?.id || !currentProductId) return;

    setIsLoadingBatches(true);
    try {
      const response = await fetch(`/api/query-batches?userId=${user.id}&productId=${currentProductId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load batches');
      }
      const data = await response.json();
      setQueryBatches(Array.isArray(data?.batches) ? data.batches : []);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Query Batches] Failed to load:', error);
      }
    } finally {
      setIsLoadingBatches(false);
    }
  }, [user?.id, currentProductId]);

  const loadQueriesForBatch = useCallback(async (batchId: string) => {
    if (!user?.id || !currentProductId) return;

    setIsLoadingBatchQueries(true);
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Frontend] Loading queries for batch:', { batchId, userId: user.id, productId: currentProductId });
      }

      const response = await fetch(
        `/api/queries?userId=${user.id}&productId=${currentProductId}&batchId=${batchId}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load batch queries');
      }

      const data = await response.json();
      const rows = Array.isArray(data?.queries) ? data.queries : [];

      if (process.env.NODE_ENV !== 'production') {
        console.log('[Frontend] Batch queries response:', {
          batchId,
          rowsCount: rows.length,
          rows: rows.slice(0, 3)
        });
      }

      const perplexity = rows
        .filter((q: any) => q?.suggested_engine === 'perplexity' || q?.suggested_engine === null)
        .map((q: any) => q?.query_text)
        .filter((q: any) => typeof q === 'string' && q.trim().length > 0);

      const google = rows
        .filter((q: any) => q?.suggested_engine === 'google')
        .map((q: any) => q?.query_text)
        .filter((q: any) => typeof q === 'string' && q.trim().length > 0);

      if (process.env.NODE_ENV !== 'production') {
        console.log('[Frontend] Filtered queries:', {
          batchId,
          perplexityCount: perplexity.length,
          googleCount: google.length,
          perplexitySample: perplexity.slice(0, 2),
          googleSample: google.slice(0, 2)
        });
      }

      setAllPerplexityQueries(perplexity);
      setAllGoogleQueries(google);
      setSelectedPerplexityQueries([]);
      setSelectedGoogleQueries([]);

      const { google: analysisGoogleQueries, perplexity: analysisPerplexityQueries } =
        await fetchUsedQueriesFromAnalysisClient(currentProductId);

      setUsedPerplexityQueries(analysisPerplexityQueries);
      setUsedGoogleQueries(analysisGoogleQueries);

      setSelectedBatchId(batchId);

      return {
        perplexity,
        google,
        usedPerplexity: analysisPerplexityQueries,
        usedGoogle: analysisGoogleQueries
      };
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Batch Queries] Failed to load:', error);
      }
      return null;
    } finally {
      setIsLoadingBatchQueries(false);
    }
  }, [user?.id, currentProductId, setAllPerplexityQueries, setAllGoogleQueries, setSelectedPerplexityQueries, setSelectedGoogleQueries, setUsedPerplexityQueries, setUsedGoogleQueries]);


  useEffect(() => {
    if (activeSection !== 'query') return;
    if (!user?.id || !currentProductId) return;
    loadQueryBatches();
  }, [activeSection, user?.id, currentProductId, loadQueryBatches]);

  // Check if we can generate a new batch (only if latest batch has DNA)
  const checkBatchGenerationEligibility = useCallback(async () => {
    if (!currentProductId) return;

    // If no batches exist, we can definitely create the first one
    if (queryBatches.length === 0) {
      setIsNewBatchEnabled(true);
      return;
    }

    // Assume Query Batches are returned sorted (Newest First) or we find the latest
    // For safety, let's sort by created_at if available, or just take the first one if we assume API sort.
    // Let's assume the first one is the latest for now.
    const latestBatch = queryBatches[0];

    try {
      const { supabase } = await import('@/lib/supabase');
      // Query for the latest snapshot of the latest batch
      const { data, error } = await supabase
        .from('sov_product_snapshots')
        .select('scraped_generative_dna')
        .eq('product_id', currentProductId)
        .eq('batch_id', latestBatch.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is "Row not found"
          console.error('[Batch Eligibility] Error checking snapshot:', error);
        }
        // If no snapshot or error, disable to be safe (or enable if we assume standard flow? User said "only when... non null")
        // So if row missing -> null -> disable.
        setIsNewBatchEnabled(false);
        return;
      }

      if (data && data.scraped_generative_dna) {
        setIsNewBatchEnabled(true);
      } else {
        setIsNewBatchEnabled(false);
      }

    } catch (error) {
      console.error('[Batch Eligibility] Unexpected error:', error);
      setIsNewBatchEnabled(false);
    }
  }, [currentProductId, queryBatches]);

  useEffect(() => {
    checkBatchGenerationEligibility();
  }, [checkBatchGenerationEligibility]);

  // Hydrate selected batch queries on mount if persisted
  useEffect(() => {
    if (activeSection === 'query' && selectedBatchId && user?.id && currentProductId && !isLoadingBatchQueries) {
      // Only load if we don't have queries in memory (reloaded page case)
      if (allPerplexityQueries.length === 0 && allGoogleQueries.length === 0) {
        loadQueriesForBatch(selectedBatchId);
      }
    }
  }, [activeSection, selectedBatchId, user?.id, currentProductId, isLoadingBatchQueries, allPerplexityQueries.length, allGoogleQueries.length, loadQueriesForBatch]);

  useEffect(() => {
    setIsClient(true);
    // Clear any stale server errors on component mount
    setServerError(null);

    // Start warmup service to prevent cold starts
    warmupService.start();

    // Cleanup on unmount
    return () => {
      warmupService.stop();
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    loadProductsFromSupabase(user.id);
  }, [user?.id, loadProductsFromSupabase]);

  useEffect(() => {
    if (openModal !== "specifications") {
      setSpecKeyEdits({});
      return;
    }

    setSpecKeyEdits((prev) => {
      const next: Record<string, string> = {};
      Object.entries(formData.specifications)
        .filter(([key, value]) => key !== "formulation_attributes" && !Array.isArray(value))
        .forEach(([key]) => {
          next[key] = Object.prototype.hasOwnProperty.call(prev, key)
            ? prev[key]
            : formatSpecificationKeyForDisplay(key);
        });
      return next;
    });

    setSpecKeyEditing((prev) => {
      const next: Record<string, boolean> = {};
      Object.entries(formData.specifications)
        .filter(([key, value]) => key !== "formulation_attributes" && !Array.isArray(value))
        .forEach(([key]) => {
          next[key] = Object.prototype.hasOwnProperty.call(prev, key)
            ? prev[key]
            : false;
        });
      return next;
    });
  }, [openModal, formData.specifications, formatSpecificationKeyForDisplay]);

  useEffect(() => {
    if (user) {
      setUserInfo({
        name: user.user_metadata?.user_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || 'Unknown',
        avatarUrl: user.user_metadata?.avatar_url || null,
      });
    } else {
      setUserInfo(null);
      setUserCredits(null);
    }
  }, [user, setUserInfo, setUserCredits]);

  // When starting from a brand new product with no associated productId,
  // make sure we don't carry over any stale analysis or generated queries
  useEffect(() => {
    if (!currentProductId && !isAnalyzing && !isScraping && !isGeneratingQuery) {
      if (optimizationAnalysis || googleOverviewAnalysis || generatedQuery) {
        setOptimizationAnalysis(null);
        setGoogleOverviewAnalysis(null);
        setGeneratedQuery(null);
      }
    }
  }, [currentProductId, isAnalyzing, isScraping, isGeneratingQuery, optimizationAnalysis, googleOverviewAnalysis, generatedQuery, setOptimizationAnalysis, setGoogleOverviewAnalysis, setGeneratedQuery]);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) return;
      try {
        const response = await fetch('/api/analyze/check-credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch credits (${response.status})`);
        }
        const data = await response.json();
        if (typeof data.currentCredits === 'number') {
          setUserCredits(data.currentCredits);
        }
      } catch (error) {
        console.error('Failed to fetch user credits:', error);
        // Don't block the app, just log the error
      }
    };

    fetchCredits();
  }, [user, setUserCredits]);

  const createProductRecord = (
    perplexityAnalysis: OptimizationAnalysis | null,
    googleAnalysis: OptimizationAnalysis | null
  ): OptimizedProduct => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

    const formCopy = JSON.parse(JSON.stringify(formData)) as ProductFormData;
    const perplexityCopy =
      perplexityAnalysis && typeof perplexityAnalysis === "object"
        ? (JSON.parse(JSON.stringify(perplexityAnalysis)) as OptimizationAnalysis)
        : null;
    const googleCopy =
      googleAnalysis && typeof googleAnalysis === "object"
        ? (JSON.parse(JSON.stringify(googleAnalysis)) as OptimizationAnalysis)
        : null;

    return {
      id,
      name: formData.product_name?.trim() || "Untitled Product",
      description: formData.description?.trim() || "No description provided.",
      createdAt: new Date().toISOString(),
      formData: formCopy,
      // Primary analysis field used for optimization_analysis: Perplexity only
      analysis: perplexityCopy,
      // Separate Google AI Overview analysis for dedicated storage and UI
      googleOverviewAnalysis: googleCopy,
      // Optional combined view when both analyses exist
      combinedAnalysis:
        perplexityCopy && googleCopy
          ? { perplexity: perplexityCopy, google: googleCopy }
          : null,
      sourceLinks: sourceLinks || [],
      processedSources: processedSources || [],
    };
  };

  async function persistProductWithGeneratedQueries(queryData: QueryData) {
    if (!user) return;

    try {
      // First, ensure we have a product
      if (!currentProductId) {
        const productRecord = createProductRecord(null, null);
        const newProductId = await saveProductToSupabase(productRecord, user.id);
        if (newProductId) {
          setCurrentProductId(newProductId);
        }
      }

      // Save queries to the new queries table
      await saveQueriesToSupabase(user.id);

      if (process.env.NODE_ENV !== 'production') {
        console.log('[Page] Queries saved to queries table successfully');
      }
    } catch (error: any) {
      const isNotFound =
        error?.message === 'PRODUCT_NOT_FOUND' || (typeof error?.status === 'number' && error.status === 404);

      if (isNotFound) {
        try {
          const productRecord = createProductRecord(null, null);
          const newProductId = await saveProductToSupabase(productRecord, user.id);
          if (newProductId) {
            setCurrentProductId(newProductId);
            // Retry saving queries after creating product
            await saveQueriesToSupabase(user.id);
          }
        } catch (creationError) {
          console.error('[Persist Queries] Failed to create product after not found:', creationError);
        }
        return;
      }

      console.error('[Persist Queries] Failed to persist product with queries:', error);
    }
  }

  // Helper function to create or reuse an analysis snapshot using Supabase directly
  async function createAnalysisSnapshot(productId: string, batchId: string, totalNumberOfQueries: number = 0): Promise<string | null> {
    try {
      const { supabase } = await import('@/lib/supabase');
      const supabaseClient = supabase;

      // Check if an existing snapshot exists for this product_id and batch_id
      const { data: existingSnapshot, error: fetchError } = await supabaseClient
        .from('analysis_snapshots')
        .select('*')
        .eq('product_id', productId)
        .eq('batch_id', batchId)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is expected
        console.error('[Snapshot] Failed to check for existing snapshot:', fetchError);
        throw new Error(fetchError.message || 'Failed to check for existing snapshot');
      }

      if (existingSnapshot) {
        // Reuse existing snapshot
        console.log('[Snapshot] Reusing existing snapshot:', existingSnapshot.id);

        // Check if all queries have been analyzed
        const allQueriesAnalyzed = existingSnapshot.no_of_query === existingSnapshot.total_no_of_query;

        if (allQueriesAnalyzed) {
          console.log('[Snapshot] All queries already analyzed for this batch, creating new snapshot:', {
            existingSnapshotId: existingSnapshot.id,
            no_of_query: existingSnapshot.no_of_query,
            total_no_of_query: existingSnapshot.total_no_of_query
          });

          // Create new snapshot when all queries are already analyzed
          const { data: newSnapshot, error: createError } = await supabaseClient
            .from('analysis_snapshots')
            .insert({
              product_id: productId,
              batch_id: batchId,
              status: 'running',
              started_at: new Date().toISOString(),
              no_of_query: 0,
              total_no_of_query: totalNumberOfQueries,
            })
            .select()
            .single();

          if (createError) {
            console.error('[Snapshot] Failed to create new snapshot:', createError);
            throw new Error(createError.message || 'Failed to create new analysis snapshot');
          }

          console.log('[Snapshot] Created new snapshot after completed analysis:', newSnapshot.id);
          return newSnapshot.id;
        }

        // Reset status to running and update started_at only if analysis is incomplete
        const { error: updateError } = await supabaseClient
          .from('analysis_snapshots')
          .update({
            status: 'running',
            started_at: new Date().toISOString(),
            completed_at: null,
          })
          .eq('id', existingSnapshot.id);

        if (updateError) {
          console.error('[Snapshot] Failed to update existing snapshot:', updateError);
          throw new Error(updateError.message || 'Failed to update existing snapshot');
        }

        return existingSnapshot.id;
      }

      // No existing snapshot found, create a new one
      const { data, error } = await supabaseClient
        .from('analysis_snapshots')
        .insert({
          product_id: productId,
          batch_id: batchId,
          status: 'running',
          started_at: new Date().toISOString(),
          no_of_query: 0,
          total_no_of_query: totalNumberOfQueries,
        })
        .select()
        .single();

      if (error) {
        console.error('[Snapshot] Failed to create snapshot:', error);
        throw new Error(error.message || 'Failed to create analysis snapshot');
      }

      console.log('[Snapshot] Created new snapshot with total queries:', {
        id: data.id,
        total_no_of_query: totalNumberOfQueries
      });
      return data.id;
    } catch (error: any) {
      console.error('[Snapshot] Failed to create/reuse snapshot:', error);
      throw new Error('Failed to initialize analysis tracking. Please try again.');
    }
  }

  // Helper function to update snapshot status and no_of_query using Supabase directly
  async function updateSnapshotStatus(
    snapshotId: string | null,
    status: 'completed' | 'failed',
    noOfQueries: number = 0
  ): Promise<void> {
    if (!snapshotId) return;

    try {
      const { supabase } = await import('@/lib/supabase');
      const supabaseClient = supabase;

      // Fetch existing snapshot to get current no_of_query
      const { data: existingSnapshot, error: fetchError } = await supabaseClient
        .from('analysis_snapshots')
        .select('no_of_query')
        .eq('id', snapshotId)
        .single();

      if (fetchError) {
        console.error('[Snapshot] Failed to fetch existing snapshot:', fetchError);
        // Continue with the provided noOfQueries if fetch fails
      }

      // Calculate new no_of_query by adding to existing value
      const existingNoOfQueries = existingSnapshot?.no_of_query || 0;
      const newNoOfQueries = existingNoOfQueries + noOfQueries;

      const { error } = await supabaseClient
        .from('analysis_snapshots')
        .update({
          status,
          completed_at: status === 'completed' ? new Date().toISOString() : null,
          no_of_query: newNoOfQueries,
        })
        .eq('id', snapshotId);

      if (error) {
        console.error('[Snapshot] Failed to update snapshot status:', error);
      } else {
        console.log('[Snapshot] Updated snapshot status:', {
          snapshotId,
          status,
          existingNoOfQueries,
          addedQueries: noOfQueries,
          totalNoOfQueries: newNoOfQueries
        });
      }
    } catch (error) {
      console.error('[Snapshot] Error updating snapshot status:', error);
    }
  }

  const accentColor = "#2ED47A";
  const accentSoft = "rgba(46, 212, 122, 0.1)";
  const surfaceBase = "rgba(17, 19, 24, 0.95)";
  const surfaceRaised = "rgba(13, 15, 19, 0.96)";
  const borderColor = "rgba(46, 212, 122, 0.14)";
  const borderColorHover = "rgba(46, 212, 122, 0.24)";
  const textPrimary = "#F2F5FA";
  const textSecondary = "rgba(162, 167, 180, 0.88)";
  const textMuted = "rgba(129, 135, 146, 0.75)";
  const dangerColor = "#F35B64";
  const dangerSoft = "rgba(243, 91, 100, 0.12)";

  const LOCATION_OPTIONS: string[] = [
    "USA",
    "Mexico",
    "India",
    "Indonesia",
    "Japan",
    "South Korea",
    "Philippines",
    "Germany",
    "UK",
    "France",
    "Spain",
    "Netherlands",
    "Serbia",
    "Kenya",
  ];

  const ANALYSIS_PIPELINE_OPTIONS: { label: string; value: "perplexity" | "google_overview" | "all" }[] = [
    { label: "Perplexity Only", value: "perplexity" },
    { label: "Google AI Overview Only", value: "google_overview" },
    { label: "All", value: "all" },
  ];

  const modalBackdropSx = {
    backdropFilter: "blur(18px)",
    backgroundColor: "rgba(6, 8, 12, 0.75)",
  };

  const modalDialogBaseSx = {
    background: "linear-gradient(135deg, rgba(16, 21, 28, 0.98), rgba(9, 12, 20, 0.96))",
    borderRadius: "24px",
    border: "1px solid rgba(46, 212, 122, 0.22)",
    boxShadow: "0 50px 120px rgba(0, 0, 0, 0.65)",
    backdropFilter: "blur(14px)",
    minWidth: { xs: "auto", sm: 460 },
    maxWidth: 720,
    width: "100%",
    p: 3,
    gap: 2,
    overflow: "hidden",
  };

  const modalContentScrollStyles = {
    maxHeight: "calc(85vh - 100px)",
    overflowY: "auto",
    overflowX: "hidden",
    pr: { xs: 1, sm: 1.5 },
    mr: -0.5,
    "&::-webkit-scrollbar": {
      width: "8px",
    },
    "&::-webkit-scrollbar-track": {
      background: "rgba(46, 212, 122, 0.08)",
      borderRadius: "4px",
    },
    "&::-webkit-scrollbar-thumb": {
      background: "rgba(46, 212, 122, 0.35)",
      borderRadius: "4px",
      "&:hover": {
        background: "rgba(46, 212, 122, 0.5)",
      },
    },
  };

  const modalFieldStyles = {
    width: "100%",
    background: "linear-gradient(135deg, rgba(18, 24, 32, 0.92), rgba(13, 17, 25, 0.92))",
    border: "1px solid rgba(46, 212, 122, 0.18)",
    borderRadius: "14px",
    backdropFilter: "blur(8px)",
    transition: "border-color 0.3s ease, background 0.3s ease",
    "&:focus-within": {
      border: "1px solid rgba(46, 212, 122, 0.32)",
      background: "linear-gradient(135deg, rgba(26, 33, 42, 0.96), rgba(17, 22, 31, 0.94))",
    },
  } as const;

  const openEditModal = (modalName: string) => {
    setOpenModal(modalName);
  };

  const closeEditModal = () => {
    setOpenModal(null);
  };

  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecificationChange = (field: string, value: string) => {
    setFormData(prev => {
      const updatedSpecifications = { ...prev.specifications, [field]: value };

      // Keep top-level references synced for known keys
      const updatedFormData: ProductFormData = {
        ...prev,
        specifications: updatedSpecifications,
      };

      if (field === 'general_product_type') {
        updatedFormData.general_product_type = value;
      }

      if (field === 'specific_product_type') {
        updatedFormData.specific_product_type = value;
      }

      return updatedFormData;
    });
  };

  const handleRemoveSpecification = (field: string) => {
    setFormData(prev => {
      const updatedSpecifications = { ...prev.specifications };
      delete updatedSpecifications[field];

      const updatedFormData: ProductFormData = {
        ...prev,
        specifications: updatedSpecifications,
      };

      if (field === 'general_product_type') {
        updatedFormData.general_product_type = '';
      }

      if (field === 'specific_product_type') {
        updatedFormData.specific_product_type = '';
      }

      return updatedFormData;
    });

    setSpecKeyEdits((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });

    setSpecKeyEditing((prev) => {
      if (!prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSpecificationKeyChange = (oldKey: string, newKey: string): string | null => {
    const safeNewKey = newKey.trim();
    if (!safeNewKey) {
      return null;
    }

    const normalizedKey = normalizeSpecificationKey(safeNewKey);
    if (!normalizedKey) {
      return null;
    }

    if (normalizedKey === oldKey) {
      return oldKey;
    }

    let duplicateKeyDetected = false;
    setFormData((prev) => {
      const { [oldKey]: oldValue, ...rest } = prev.specifications;
      if (normalizedKey !== oldKey && Object.prototype.hasOwnProperty.call(rest, normalizedKey)) {
        duplicateKeyDetected = true;
        return prev;
      }
      const updatedSpecifications = {
        ...rest,
        [normalizedKey]: oldValue,
      };

      const updatedFormData: ProductFormData = {
        ...prev,
        specifications: updatedSpecifications,
      };

      if (oldKey === 'general_product_type') {
        delete updatedFormData.general_product_type;
      }
      if (oldKey === 'specific_product_type') {
        delete updatedFormData.specific_product_type;
      }

      if (normalizedKey === 'general_product_type') {
        updatedFormData.general_product_type = typeof oldValue === 'string' ? oldValue : '';
      }

      if (normalizedKey === 'specific_product_type') {
        updatedFormData.specific_product_type = typeof oldValue === 'string' ? oldValue : '';
      }

      return updatedFormData;
    });

    if (duplicateKeyDetected) {
      console.warn(`Specification key "${normalizedKey}" already exists. Rename skipped.`);
      return null;
    }

    return normalizedKey;
  };

  const commitSpecificationKeyChange = (originalKey: string): string => {
    const pending = specKeyEdits[originalKey];
    if (pending === undefined) {
      setSpecKeyEditing((prev) => ({
        ...prev,
        [originalKey]: false,
      }));
      return originalKey;
    }

    const normalizedKey = handleSpecificationKeyChange(originalKey, pending);
    if (!normalizedKey) {
      setSpecKeyEdits((prev) => ({
        ...prev,
        [originalKey]: formatSpecificationKeyForDisplay(originalKey),
      }));
      return originalKey;
    }

    setSpecKeyEdits((prev) => {
      const updated = { ...prev };
      const displayLabel = formatSpecificationKeyForDisplay(normalizedKey);
      delete updated[originalKey];
      updated[normalizedKey] = displayLabel;
      return updated;
    });

    setSpecKeyEditing((prev) => {
      const updated = { ...prev };
      const wasEditing = updated[originalKey];
      delete updated[originalKey];
      updated[normalizedKey] = Boolean(wasEditing) ? false : updated[normalizedKey] ?? false;
      return updated;
    });

    return normalizedKey;
  };

  const revertSpecificationKeyEdit = (originalKey: string) => {
    setSpecKeyEdits((prev) => ({
      ...prev,
      [originalKey]: formatSpecificationKeyForDisplay(originalKey),
    }));
    setSpecKeyEditing((prev) => ({
      ...prev,
      [originalKey]: false,
    }));
  };

  const handleSpecKeyInputChange = (originalKey: string, value: string) => {
    setSpecKeyEdits((prev) => ({
      ...prev,
      [originalKey]: value,
    }));
  };

  const handleSpecKeyInputBlur = (originalKey: string) => {
    const finalKey = commitSpecificationKeyChange(originalKey);
    setSpecKeyEditing((prev) => ({
      ...prev,
      [finalKey]: false,
    }));
  };

  const handleSpecKeyInputKeyDown = (originalKey: string) => (
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const finalKey = commitSpecificationKeyChange(originalKey);
      setSpecKeyEditing((prev) => ({
        ...prev,
        [finalKey]: false,
      }));
      if (event.currentTarget) {
        event.currentTarget.blur();
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      revertSpecificationKeyEdit(originalKey);
    }
  };

  const handleCheckImplementationIncompleteBatch = async () => {
    setQueryGenerationError(null);
    setServerError(null);

    if (!selectedBatchId) {
      setQueryGenerationError('No batch selected for re-optimization.');
      return;
    }

    const batchUsedPerplexityQueries = usedPerplexityQueries.filter(query =>
      allPerplexityQueries.includes(query)
    );
    const batchUsedGoogleQueries = usedGoogleQueries.filter(query =>
      allGoogleQueries.includes(query)
    );

    const finalPerplexityQueries = batchUsedPerplexityQueries.filter(query =>
      !hasQueryBeenReanalyzed(query, 'perplexity')
    );
    const finalGoogleQueries = batchUsedGoogleQueries.filter(query =>
      !hasQueryBeenReanalyzed(query, 'google_overview')
    );

    const allUsedQueries = [...finalPerplexityQueries, ...finalGoogleQueries];
    const hasValidUsedQueries = allUsedQueries.some(query => query && query.trim().length > 0);

    if (!hasValidUsedQueries) {
      setQueryGenerationError('No non-odd used queries available for re-optimization in the selected batch.');
      return;
    }

    const requiredCredits = allUsedQueries.length;
    if (!userCredits || userCredits < requiredCredits) {
      setQueryGenerationError(`Insufficient credits for re-optimization. Required: ${requiredCredits}, Available: ${userCredits || 0}`);
      return;
    }

    let snapshotId: string | null = null;
    if (selectedBatchId && currentProductId) {
      try {
        const totalQueries = allPerplexityQueries.length + allGoogleQueries.length;
        snapshotId = await createAnalysisSnapshot(currentProductId, selectedBatchId, totalQueries);
        setCurrentSnapshotId(snapshotId);
      } catch (snapshotError: any) {
        console.error('[Re-Optimization] Failed to create snapshot:', snapshotError);
        setServerError(snapshotError.message || 'Failed to initialize re-optimization. Please try again.');
        return;
      }
    }

    let mode: 'all' | 'perplexity' | 'google_overview' | null = null;
    const hasUsedPerplexity = finalPerplexityQueries.length > 0;
    const hasUsedGoogle = finalGoogleQueries.length > 0;

    if (hasUsedPerplexity && hasUsedGoogle) {
      mode = 'all';
    } else if (hasUsedPerplexity) {
      mode = 'perplexity';
    } else if (hasUsedGoogle) {
      mode = 'google_overview';
    }

    if (!mode) {
      setQueryGenerationError('No non-odd used queries available for re-optimization in the selected batch.');
      return;
    }

    try {
      if (mode === 'all') {
        await startAnalysisWithBothQueries(snapshotId, finalPerplexityQueries, finalGoogleQueries);
      } else if (mode === 'perplexity') {
        await startAnalysisWithSelectedQueries('perplexity', snapshotId, finalPerplexityQueries);
      } else if (mode === 'google_overview') {
        await startAnalysisWithSelectedQueries('google_overview', snapshotId, finalGoogleQueries);
      }
    } catch (error) {
      console.error('[Re-Optimization] Error:', error);
      await updateSnapshotStatus(snapshotId, 'failed', 0);
      setServerError('Failed to start re-optimization. Please try again.');
    }
  };

  const startSpecKeyEditing = (key: string) => {
    setSpecKeyEdits((prev) => ({
      ...prev,
      [key]: prev[key] ?? formatSpecificationKeyForDisplay(key),
    }));
    setSpecKeyEditing((prev) => ({
      ...prev,
      [key]: true,
    }));
  };

  const handleFeatureChange = (index: number, field: keyof Feature, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((feature, i) =>
        i === index ? { ...feature, [field]: value } : feature
      )
    }));
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, { name: "", description: "" }]
    }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const addAttribute = () => {
    if (newAttribute.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          formulation_attributes: [
            ...(Array.isArray(prev.specifications.formulation_attributes) ? prev.specifications.formulation_attributes : []),
            newAttribute.trim()
          ]
        }
      }));
      setNewAttribute("");
    }
  };

  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        formulation_attributes: Array.isArray(prev.specifications.formulation_attributes)
          ? prev.specifications.formulation_attributes.filter((_, i: number) => i !== index)
          : []
      }
    }));
  };

  const normalizeAnalysisText = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (value == null) return "";
    try {
      if (typeof value === "object") {
        return JSON.stringify(value, null, 2);
      }
      return String(value);
    } catch (error) {
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

    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/\n/g, '<br />');

    return html;
  };

  const formatMissingFieldName = (fieldKey: string) => {
    const customLabels: Record<string, string> = {
      product_name: "Product Name",
      description: "Description",
      general_product_type: "General Product Type",
      specific_product_type: "Specific Product Type",
      specifications: "Specifications",
      features: "Features",
      targeted_market: "Targeted Market",
      problem_product_is_solving: "Problem Solved"
    };

    if (customLabels[fieldKey]) return customLabels[fieldKey];

    if (fieldKey.includes('.')) {
      const [root, ...rest] = fieldKey.split('.');
      const formattedRoot = customLabels[root] ?? root
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const formattedRest = rest
        .map(part =>
          part
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
        )
        .join(' → ');

      return formattedRest ? `${formattedRoot} → ${formattedRest}` : formattedRoot;
    }

    return fieldKey
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const { ignoredMissingFields, setIgnoredMissingFields } = useProductStore();
  const ignoredNormalized = Array.isArray(ignoredMissingFields) ? ignoredMissingFields : [];
  const pendingMissingFields = missingFields.filter((f) => {
    const l = String(f).toLowerCase();
    const ignoredLower = ignoredNormalized.map((x) => String(x).toLowerCase());
    if (ignoredLower.includes(l)) return false;
    if (l.startsWith('specifications') && ignoredLower.includes('specifications')) return false;
    return true;
  });

  const specificationMissingLabels = Array.from(new Set(
    pendingMissingFields
      .filter(field => field.toLowerCase().startsWith('specifications'))
      .map(field => formatMissingFieldName(field))
  ));
  const hasSpecificationMissing = specificationMissingLabels.length > 0;
  const featuresCount = formData.features.filter(f => f.name && f.name.trim()).length;
  const hasFeaturesMissing = pendingMissingFields.some(f => {
    const l = f.toLowerCase();
    return l === 'features' || l.startsWith('features');
  });
  const hasFormBlockingMissing = hasSpecificationMissing || hasFeaturesMissing;

  // Track if user has dismissed the warning in this session using sessionStorage
  const [hasDismissedWarning, setHasDismissedWarning] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return sessionStorage.getItem('godseye-missing-fields-warning-dismissed') === 'true';
    } catch {
      return false;
    }
  });

  // Professional warning modal logic: Only show when there are actual missing fields
  // and user hasn't dismissed it in this session
  useEffect(() => {
    const hasMissingFields = pendingMissingFields.length > 0;

    // Always ensure warning state matches reality
    if (!hasMissingFields) {
      // No missing fields - ensure warning is hidden and reset dismissal state
      if (showMissingFieldsWarning) {
        setShowMissingFieldsWarning(false);
      }
      // Reset dismissal state when all fields are fixed
      if (hasDismissedWarning) {
        setHasDismissedWarning(false);
        try {
          sessionStorage.removeItem('godseye-missing-fields-warning-dismissed');
        } catch (e) {
          console.warn('Failed to clear sessionStorage:', e);
        }
      }
      return;
    }

    // We have missing fields - check if we should show warning
    if (hasMissingFields && !hasDismissedWarning && !showMissingFieldsWarning) {
      // Only auto-show once when missing fields are detected
      setShowMissingFieldsWarning(true);
    } else if (hasMissingFields && hasDismissedWarning && showMissingFieldsWarning) {
      // User dismissed it, so hide it
      setShowMissingFieldsWarning(false);
    }
  }, [pendingMissingFields.length, hasDismissedWarning, showMissingFieldsWarning, setShowMissingFieldsWarning]);

  // Handle manual show warning (when clicking the warning button)
  const handleShowWarning = useCallback(() => {
    // Clear dismissal state when manually showing
    setHasDismissedWarning(false);
    try {
      sessionStorage.removeItem('godseye-missing-fields-warning-dismissed');
    } catch (e) {
      console.warn('Failed to clear sessionStorage:', e);
    }
    setShowMissingFieldsWarning(true);
  }, [setShowMissingFieldsWarning]);

  // Handle dismissing the warning
  const handleDismissWarning = useCallback(() => {
    setShowMissingFieldsWarning(false);
    setHasDismissedWarning(true);
    try {
      sessionStorage.setItem('godseye-missing-fields-warning-dismissed', 'true');
    } catch (e) {
      console.warn('Failed to save to sessionStorage:', e);
    }
  }, [setShowMissingFieldsWarning]);

  const scrapeProductData = async (retryCount = 0) => {
    const MAX_RETRIES = 2;
    const RETRY_DELAYS = [2000, 5000]; // 2 seconds, then 5 seconds

    // Validate input based on mode
    if (inputMode === 'url') {
      if (!formData.url.trim()) {
        setScrapingError("Please enter a valid URL");
        return;
      }

      // Validate URL format
      try {
        new URL(formData.url);
      } catch {
        setScrapingError("Please enter a valid URL format (e.g., https://example.com)");
        return;
      }
    } else {
      // Text mode validation
      if (!productText.trim()) {
        setScrapingError("Please enter product description text");
        return;
      }

      if (productText.trim().length < 50) {
        setScrapingError("Product text should be at least 50 characters for better results");
        return;
      }
    }

    setIsScraping(true);
    setScrapingError(null);
    setMissingFields([]);
    setIgnoredMissingFields([]);
    setShowMissingFieldsWarning(false);
    setLastExtractionMethod(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout

      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputMode === 'url'
          ? { url: formData.url, location: selectedLocation }
          : { text: productText.trim(), location: selectedLocation }
        ),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scrape product data');
      }

      const result = await response.json();

      if (result.success && result.data) {
        const scrapedData = result.data;

        const missing = Array.isArray(result.missingFields) ? result.missingFields : [];
        // Build enhanced data and filter erroneous 'specifications' missing flag if specs exist

        // Transform scraped data to match our form structure
        const enhancedData = {
          url: formData.url,
          product_name: scrapedData.product_name || "",
          description: scrapedData.description || "",
          specifications: {
            ...scrapedData.specifications,
            // Include general_product_type and specific_product_type in specifications for dynamic rendering
            general_product_type: scrapedData.general_product_type || "",
            specific_product_type: scrapedData.specific_product_type || ""
          },
          features: scrapedData.features || [{ name: "", description: "" }],
          targeted_market: scrapedData.targeted_market || "",
          problem_product_is_solving: scrapedData.problem_product_is_solving || ""
        };

        setFormData(enhancedData);
        // Store the original scraped data for reset functionality
        setOriginalScrapedData(enhancedData);
        console.log("Scraped data:", scrapedData);
        console.log("Token usage:", result.tokenUsage);

        const filteredMissing = Array.isArray(missing) ? missing : [];
        setMissingFields(filteredMissing);
        // Don't set warning directly here - let the useEffect handle it based on pendingMissingFields
        // This ensures ignored fields are properly accounted for
        setLastExtractionMethod(result.extractionMethod ?? null);
      } else {
        throw new Error('No data received from scraping service');
      }
    } catch (error: any) {
      console.error('Scraping error:', error);

      // Handle timeout with retry
      if (error.name === 'AbortError' && retryCount < MAX_RETRIES) {
        console.log(`Scraping timeout, retrying... (${retryCount + 1}/${MAX_RETRIES})`);
        setIsScraping(false);
        const delay = RETRY_DELAYS[retryCount] || 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return scrapeProductData(retryCount + 1);
      }

      // Handle Gemini API rate limit and key errors with retry
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRetryableError =
        errorMessage.includes('rate limit') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('too many requests') ||
        errorMessage.includes('429') ||
        errorMessage.includes('Resource exhausted') ||
        errorMessage.includes('GEMINI_API_KEY') ||
        errorMessage.includes('API key') ||
        errorMessage.includes('503') ||
        errorMessage.includes('Service unavailable');

      if (isRetryableError && retryCount < MAX_RETRIES) {
        console.log(`Gemini API error, retrying... (${retryCount + 1}/${MAX_RETRIES}): ${errorMessage}`);
        setIsScraping(false);
        const delay = RETRY_DELAYS[retryCount] || 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return scrapeProductData(retryCount + 1);
      }

      // User-friendly error messages for specific issues
      if (errorMessage.includes('GEMINI_API_KEY') || errorMessage.includes('API key')) {
        setScrapingError('AI service configuration error. Please contact support or try again later.');
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('quota') || errorMessage.includes('429')) {
        setScrapingError('AI service is temporarily busy due to high demand. Please try again in a few moments.');
      } else if (errorMessage.includes('Resource exhausted') || errorMessage.includes('503') || errorMessage.includes('Service unavailable')) {
        setScrapingError('AI service is temporarily unavailable. Please try again in a few moments.');
      } else if (error.name === 'AbortError') {
        setScrapingError('The request took too long. The website might be slow or blocking automated access. Please try again or enter product details manually.');
      } else if (errorMessage.includes('fetch')) {
        setScrapingError('Unable to connect to the scraping service. Please check your internet connection and try again.');
      } else {
        setScrapingError(errorMessage || 'Failed to scrape product data. You can enter the details manually below.');
      }
    } finally {
      setIsScraping(false);
    }
  };

  // File upload handler for .txt files
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.txt')) {
      setScrapingError('Please upload a .txt file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setScrapingError('File size must be less than 5MB');
      return;
    }

    try {
      const text = await file.text();
      if (text.trim().length < 50) {
        setScrapingError('File content must be at least 50 characters long');
        return;
      }
      setProductText(text);
      setScrapingError(null); // Clear any previous errors
    } catch (error) {
      setScrapingError('Failed to read file. Please try again.');
    }

    // Reset file input
    event.target.value = '';
  };

  // Helper function to generate a query for a specific pipeline
  const generateQueryForPipeline = async (
    data: ProductFormData,
    pipeline: 'perplexity' | 'google_overview',
    analysisId?: string
  ): Promise<{ queries: string[]; topQuery: string } | null> => {
    const productContext: ProductContext = {
      general_product_type: data.general_product_type || data.specifications.general_product_type || "",
      specific_product_type: data.specific_product_type || data.specifications.specific_product_type || "",
      targeted_market: data.targeted_market || "",
      problem_product_is_solving: data.problem_product_is_solving || ""
    };

    console.log(`Generating ${pipeline} search query with context:`, productContext);

    const response = await fetch('/api/generate-queries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...productContext,
        analysisId,
        pipeline,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to generate ${pipeline} search queries`);
    }

    const result = await response.json();

    if (result && result.topQuery) {
      console.log(`Generated ${pipeline} top query:`, result.topQuery);
      console.log(`Generated ${pipeline} all queries:`, result.queries);
      return {
        queries: result.queries || [result.topQuery],
        topQuery: result.topQuery
      };
    }

    return null;
  };

  const generateQueryFromData = async (data: ProductFormData, analysisId?: string) => {
    setIsGeneratingQuery(true);
    setQueryGenerationError(null);
    setMissingFields([]);
    setShowMissingFieldsWarning(false);
    setLastExtractionMethod(null);

    try {
      // Prepare product context for query generation
      const productContext: ProductContext = {
        general_product_type: data.general_product_type || data.specifications.general_product_type || "",
        specific_product_type: data.specific_product_type || data.specifications.specific_product_type || "",
        targeted_market: data.targeted_market || "",
        problem_product_is_solving: data.problem_product_is_solving || ""
      };

      console.log("Generating search queries with context:", productContext);

      // Always generate queries for both pipelines
      const [perplexityResult, googleResult] = await Promise.all([
        generateQueryForPipeline(data, 'perplexity', analysisId),
        generateQueryForPipeline(data, 'google_overview', analysisId),
      ]);

      // Store all queries in the new state fields
      if (perplexityResult) {
        setAllPerplexityQueries(perplexityResult.queries || [perplexityResult.topQuery]);
        // Don't auto-select - let the user manually select queries
      }
      if (googleResult) {
        setAllGoogleQueries(googleResult.queries || [googleResult.topQuery]);
        // Don't auto-select - let the user manually select queries
      }

      if (perplexityResult && googleResult) {
        // Use Perplexity query as the primary (for display/state)
        const primaryQuery = perplexityResult.topQuery;
        if (primaryQuery) {
          setGeneratedQuery(primaryQuery);
          console.log("Generated queries for both pipelines - Perplexity:", perplexityResult.topQuery, "Google:", googleResult.topQuery);

          // Store queries in memory only - they will be saved to Supabase when product is created during analysis
          const queryData: QueryData = {
            all: {
              perplexity: perplexityResult.queries || [perplexityResult.topQuery],
              google: googleResult.queries || [googleResult.topQuery],
            },
            used: {
              perplexity: [],
              google: [],
            },
          };
          setQueryData(queryData);
          await persistProductWithGeneratedQueries(queryData);

          // Return both queries for use in scraping
          return { perplexityQuery: perplexityResult.topQuery, googleQuery: googleResult.topQuery };
        }
        throw new Error('Failed to generate queries for both pipelines');
      } else {
        throw new Error('Failed to generate queries');
      }
    } catch (error) {
      console.error('Query generation error:', error);
      const friendly = 'A server error occurred while generating search queries. Please check your internet connection and try again. If the issue persists, please contact the provider.';
      const msg = (error instanceof Error && error.message && error.message.trim().length > 0)
        ? `${friendly}\n\nDetails: ${error.message}`
        : friendly;
      setQueryGenerationError(msg);
      return null;
    } finally {
      setIsGeneratingQuery(false);
    }
  };

  // -----------------------------------------------------------------------
  // Python Backend Bridge — runs when NEXT_PUBLIC_ENABLE_PYTHON_BACKEND=true
  // -----------------------------------------------------------------------
  const runPythonBackendOptimization = async (
    snapshotId: string | null,
    perplexityQueries: string[],
    googleQueries: string[],
  ) => {
    const backendUrl = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8000';
    const aiReadyData = prepareDataForAI(formData);

    setIsAnalyzing(true);
    if (perplexityQueries.length > 0) setIsPerplexityScraping(true);
    if (googleQueries.length > 0) setIsGoogleScraping(true);

    try {
      // 1) POST /api/v1/optimize/start
      console.log('[Python Backend] Starting optimization…', { backendUrl, perplexityQueries, googleQueries });
      const startResp = await fetch(`${backendUrl}/api/v1/optimize/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: currentProductId,
          user_id: user!.id,
          batch_id: selectedBatchId,
          perplexity_queries: perplexityQueries,
          google_queries: googleQueries,
          client_product_json: aiReadyData,
          debug: process.env.NODE_ENV !== 'production',
          total_no_of_query: perplexityQueries.length + googleQueries.length,
        }),
      });

      if (!startResp.ok) {
        const errBody = await startResp.json().catch(() => ({}));
        throw new Error((errBody as any)?.detail || `Backend returned status ${startResp.status}`);
      }

      const startData = await startResp.json();
      const backendSnapshotId: string = startData.snapshot_id;
      const totalQueries: number = startData.total_queries;
      console.log('[Python Backend] Optimization started — snapshot:', backendSnapshotId, 'total:', totalQueries);

      // 2) Poll /api/v1/optimize/status/{snapshot_id} until completed or failed
      const POLL_INTERVAL_MS = 3000; // 3 seconds
      const MAX_POLL_ATTEMPTS = 200; // ~10 minutes max
      let attempts = 0;

      while (attempts < MAX_POLL_ATTEMPTS) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

        const statusResp = await fetch(`${backendUrl}/api/v1/optimize/status/${backendSnapshotId}`);
        if (!statusResp.ok) {
          console.warn('[Python Backend] Status poll failed, retrying…', statusResp.status);
          continue;
        }

        const statusData = await statusResp.json();
        const { status, completed_queries, total_queries: totalQ } = statusData;

        if (process.env.NODE_ENV !== 'production') {
          console.log(`[Python Backend] Poll #${attempts} — status: ${status}, progress: ${completed_queries}/${totalQ}`);
        }

        if (status === 'completed') {
          console.log('[Python Backend] ✅ Optimization completed successfully');

          // Deduct credits for successful queries
          try {
            const creditResponse = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user!.id,
                creditsRequired: completed_queries || totalQ,
              }),
            });
            const creditData = await creditResponse.json();
            if (creditData.success) {
              console.log('[Python Backend] Credits deducted successfully');
              adjustUserCredits(-(completed_queries || totalQ));
            } else {
              console.error('[Python Backend] Credit deduction failed');
            }
          } catch (creditErr) {
            console.error('[Python Backend] Credit deduction error:', creditErr);
          }

          // Mark queries as used
          const usedPerplexity = [...new Set([...usedPerplexityQueries, ...perplexityQueries])];
          const usedGoogle = [...new Set([...usedGoogleQueries, ...googleQueries])];
          setUsedPerplexityQueries(usedPerplexity);
          setUsedGoogleQueries(usedGoogle);
          setSelectedPerplexityQueries(selectedPerplexityQueries.filter(q => !usedPerplexity.includes(q)));
          setSelectedGoogleQueries(selectedGoogleQueries.filter(q => !usedGoogle.includes(q)));

          // Update snapshot status if provided
          if (snapshotId) {
            await updateSnapshotStatus(snapshotId, 'completed', completed_queries || totalQ);
          }

          // Navigate to results
          // if (perplexityQueries.length > 0) {
          //   router.push('/results');
          // } else {
          //   router.push('/results/google');
          // }
          return;
        }

        if (status === 'failed') {
          throw new Error('Python backend optimization failed. Check backend logs for details.');
        }
      }

      // If we exhausted all poll attempts
      throw new Error('Optimization timed out. The backend is still processing — check status manually.');
    } catch (error) {
      console.error('[Python Backend] Error:', error);
      const friendly = 'An error occurred while running the Python backend optimization.';
      const msg = (error instanceof Error && error.message && error.message.trim().length > 0)
        ? `${friendly}\n\nDetails: ${error.message}`
        : friendly;
      setAnalysisError(msg);
      if (snapshotId) {
        await updateSnapshotStatus(snapshotId, 'failed', 0);
      }
    } finally {
      setIsAnalyzing(false);
      setIsPerplexityScraping(false);
      setIsGoogleScraping(false);
    }
  };

  const handleUseSelectedQueries = async () => {
    // Clear any previous errors
    setQueryGenerationError(null);
    setServerError(null);

    // Part 0: Create analysis snapshot before starting analysis
    let snapshotId: string | null = null;
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Snapshot Debug] handleUseSelectedQueries - Checking conditions:', {
        selectedBatchId,
        currentProductId,
        hasBatch: !!selectedBatchId,
        hasProduct: !!currentProductId
      });
    }

    if (selectedBatchId && currentProductId) {
      try {
        // Calculate total number of queries in the batch (not just selected)
        const totalQueries = allPerplexityQueries.length + allGoogleQueries.length;

        if (process.env.NODE_ENV !== 'production') {
          console.log('[Snapshot Debug] handleUseSelectedQueries - Creating snapshot with:', {
            productId: currentProductId,
            batchId: selectedBatchId,
            totalQueries,
            selectedPerplexityQueries: selectedPerplexityQueries.length,
            selectedGoogleQueries: selectedGoogleQueries.length,
            allPerplexityQueries: allPerplexityQueries.length,
            allGoogleQueries: allGoogleQueries.length
          });
        }
        snapshotId = await createAnalysisSnapshot(currentProductId, selectedBatchId, totalQueries);
        setCurrentSnapshotId(snapshotId);
        console.log('[Snapshot] Snapshot created:', snapshotId);
      } catch (snapshotError: any) {
        console.error('[Snapshot] Failed to create snapshot:', snapshotError);
        setServerError(snapshotError.message || 'Failed to initialize analysis tracking. Please try again.');
        return;
      }
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Snapshot Debug] handleUseSelectedQueries - Skipping snapshot creation - missing conditions:', {
          selectedBatchId,
          currentProductId,
          reason: !selectedBatchId ? 'No batch selected' : !currentProductId ? 'No current product' : 'Unknown'
        });
      }
    }

    // Prevent used queries from being re-run via the primary Optimize button.
    const hasUsedSelected =
      selectedPerplexityQueries.some(q => usedPerplexityQueries.includes(q)) ||
      selectedGoogleQueries.some(q => usedGoogleQueries.includes(q));

    if (hasUsedSelected) {
      setQueryGenerationError('You selected Used queries. Use "Check Implementation" to re-optimize those queries.');
      return;
    }

    // Auto-detect mode based on selected queries
    const mode = getAnalysisMode();

    if (!mode) {
      setQueryGenerationError('Please select at least one query to proceed with analysis.');
      return;
    }

    // Validate that selected queries are not empty
    const allSelectedQueries = [...selectedPerplexityQueries, ...selectedGoogleQueries];
    const hasValidQueries = allSelectedQueries.some(query => query && query.trim().length > 0);

    if (!hasValidQueries) {
      setQueryGenerationError('Selected queries appear to be empty. Please try generating queries again.');
      return;
    }

    // -----------------------------------------------------------------------
    // UNIFIED CREDIT CHECK — runs regardless of which backend is used
    // -----------------------------------------------------------------------
    if (!user) {
      setServerError('Please sign in to analyze products');
      router.push('/auth');
      return;
    }

    const perplexityQueriesToRun = selectedPerplexityQueries
      .filter(q => q && q.trim())
      .slice(0, maxPerplexityQueries);
    const googleQueriesToRun = selectedGoogleQueries
      .filter(q => q && q.trim())
      .slice(0, maxGoogleQueries);
    const totalRequiredCredits = perplexityQueriesToRun.length + googleQueriesToRun.length;

    try {
      const creditCheckResponse = await fetch('/api/analyze/check-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          creditsRequired: totalRequiredCredits,
        }),
      });

      if (!creditCheckResponse.ok) {
        throw new Error('Failed to check credits');
      }

      const creditCheckData = await creditCheckResponse.json();

      if (!creditCheckData.hasEnoughCredits) {
        setServerError(
          `Insufficient credits. Required: ${totalRequiredCredits}, Available: ${creditCheckData.currentCredits}. Please purchase more credits to continue.`
        );
        return;
      }
      if (typeof creditCheckData.currentCredits === 'number') {
        setUserCredits(creditCheckData.currentCredits);
      }
      console.log(`[Credit Check] Passed — required: ${totalRequiredCredits}, available: ${creditCheckData.currentCredits}`);
    } catch (creditError) {
      console.error('Credit check error:', creditError);
      setServerError('Failed to verify credits. Please try again.');
      return;
    }

    // -----------------------------------------------------------------------
    // FEATURE FLAG SWITCH — Python Backend vs Legacy Frontend Logic
    // -----------------------------------------------------------------------
    const usePythonBackend = process.env.NEXT_PUBLIC_ENABLE_PYTHON_BACKEND === 'true';

    if (usePythonBackend) {
      console.log('[Feature Flag] Using Python backend for optimization');
      await runPythonBackendOptimization(snapshotId, perplexityQueriesToRun, googleQueriesToRun);
      return;
    }

    // -----------------------------------------------------------------------
    // LEGACY PATH — existing Next.js frontend logic (unchanged)
    // -----------------------------------------------------------------------
    console.log('[Feature Flag] Using legacy frontend logic for optimization');

    try {
      // Update the main generatedQuery state with selected queries
      const selectedQueriesData = {
        perplexity: selectedPerplexityQueries.filter(q => q && q.trim()),
        google: selectedGoogleQueries.filter(q => q && q.trim()),
      };
      setGeneratedQuery(JSON.stringify(selectedQueriesData));

      // Start analysis based on detected mode
      if (mode === 'all') {
        // Both selected - run both analyses sequentially
        await startAnalysisWithBothQueries(snapshotId);
      } else if (mode === 'perplexity') {
        // Only Perplexity selected
        await startAnalysisWithSelectedQueries('perplexity', snapshotId);
      } else if (mode === 'google_overview') {
        // Only Google selected
        await startAnalysisWithSelectedQueries('google_overview', snapshotId);
      }
    } catch (error) {
      console.error('Error using selected queries:', error);
      // Update snapshot status to failed if an error occurs during analysis
      await updateSnapshotStatus(snapshotId, 'failed', 0);
      setServerError('Failed to start analysis with selected queries. Please try again.');
    }
  };

  // Load and restore query data from Supabase on component mount.
  // We intentionally do NOT trust any locally persisted query arrays; instead,
  // Supabase is the source of truth for generated queries on reload.
  useEffect(() => {
    if (!user?.id || !currentProductId || isNewProductSession) {
      lastLoadedProductIdRef.current = null;
      setHasLoadedQueriesForProduct(false);
      return;
    }

    if (lastLoadedProductIdRef.current === currentProductId) return;

    // Queries are now loaded via loadProductsFromSupabase, so no separate loading needed
    setHasLoadedQueriesForProduct(true);
  }, [user?.id, currentProductId, isNewProductSession]);

  // Handler for Back to Dashboard navigation
  const handleBackToDashboard = async () => {
    setIsNavigatingBack(true);
    router.push("/products");
  };

  // Helper function for backwards compatibility with existing query data format
  const parseQueryData = (generatedQuery: string | null): QueryData | null => {
    if (!generatedQuery) return null;

    try {
      const parsed = JSON.parse(generatedQuery);

      // Check if it's the new format (has 'all' and 'used' properties)
      if (parsed.all && parsed.used) {
        return parsed as QueryData;
      }

      // Handle old format with 'selected': {"all": {...}, "selected": {...}, "used": {...}}
      if (parsed.all && parsed.selected && parsed.used) {
        return {
          all: parsed.all,
          used: parsed.used,
        };
      }

      // Handle legacy format: {"perplexityQuery":["query"],"googleQuery":["query"]}
      if (parsed.perplexityQuery || parsed.googleQuery) {
        const perplexityQueries = parsed.perplexityQuery || [];
        const googleQueries = parsed.googleQuery || [];

        return {
          all: {
            perplexity: perplexityQueries,
            google: googleQueries,
          },
          used: {
            perplexity: perplexityQueries, // Assume all were used
            google: googleQueries,
          },
        };
      }

      // Handle single query format (string)
      if (typeof parsed === 'string') {
        return {
          all: {
            perplexity: [parsed],
            google: [],
          },
          used: {
            perplexity: [parsed],
            google: [],
          },
        };
      }

      return null;
    } catch (error) {
      console.error('Error parsing query data:', error);
      return null;
    }
  };

  // Auto-detect analysis mode based on selected queries
  const getAnalysisMode = () => {
    const hasPerplexity = selectedPerplexityQueries.length > 0;
    const hasGoogle = selectedGoogleQueries.length > 0;

    if (hasPerplexity && hasGoogle) {
      return 'all';
    } else if (hasPerplexity) {
      return 'perplexity';
    } else if (hasGoogle) {
      return 'google_overview';
    } else {
      return null;
    }
  };

  const getAnalysisModeDisplay = () => {
    const mode = getAnalysisMode();
    switch (mode) {
      case 'all':
        return { text: 'All Analysis', color: '#2ED47A' };
      case 'perplexity':
        return { text: 'Perplexity Analysis', color: '#2ED47A' };
      case 'google_overview':
        return { text: 'Google AI Overview Analysis', color: '#2ED47A' };
      default:
        return { text: 'No Analysis Mode', color: '#F35B64' };
    }
  };

  const handleReOptimizeSelectedQueries = async () => {
    setQueryGenerationError(null);
    setServerError(null);

    // Automatically use ALL used queries for re-optimization (filtered by selected batch)
    if (!selectedBatchId) {
      setQueryGenerationError('No batch selected for re-optimization.');
      return;
    }

    // Filter used queries to only include those from the selected batch
    const batchUsedPerplexityQueries = usedPerplexityQueries.filter(query =>
      allPerplexityQueries.includes(query)
    );
    const batchUsedGoogleQueries = usedGoogleQueries.filter(query =>
      allGoogleQueries.includes(query)
    );

    // Use all batch used queries
    const finalPerplexityQueries = batchUsedPerplexityQueries;
    const finalGoogleQueries = batchUsedGoogleQueries;

    const allUsedQueries = [...finalPerplexityQueries, ...finalGoogleQueries];
    const hasValidUsedQueries = allUsedQueries.some(query => query && query.trim().length > 0);

    if (!hasValidUsedQueries) {
      setQueryGenerationError('No used queries found in the selected batch to re-optimize.');
      return;
    }

    // Check credits before starting re-optimization
    const requiredCredits = allUsedQueries.length;
    if (!userCredits || userCredits < requiredCredits) {
      setQueryGenerationError(`Insufficient credits for re-optimization. Required: ${requiredCredits}, Available: ${userCredits || 0}`);
      return;
    }

    let snapshotId: string | null = null;
    if (selectedBatchId && currentProductId) {
      try {
        const totalQueries = allPerplexityQueries.length + allGoogleQueries.length;
        snapshotId = await createAnalysisSnapshot(currentProductId, selectedBatchId, totalQueries);
        setCurrentSnapshotId(snapshotId);
      } catch (snapshotError: any) {
        console.error('[Re-Optimization] Failed to create snapshot:', snapshotError);
        setServerError(snapshotError.message || 'Failed to initialize re-optimization. Please try again.');
        return;
      }
    }

    // Determine mode based on available used queries in the selected batch
    let mode: 'all' | 'perplexity' | 'google_overview' | null = null;
    const hasUsedPerplexity = finalPerplexityQueries.length > 0;
    const hasUsedGoogle = finalGoogleQueries.length > 0;

    if (hasUsedPerplexity && hasUsedGoogle) {
      mode = 'all';
    } else if (hasUsedPerplexity) {
      mode = 'perplexity';
    } else if (hasUsedGoogle) {
      mode = 'google_overview';
    }

    if (!hasValidUsedQueries) {
      if (hasValidUsedQueries) {
        setQueryGenerationError('No used queries manually selected for re-optimization in the selected batch.');
      } else {
        setQueryGenerationError('No used queries available for re-optimization in the selected batch.');
      }
      return;
    }

    // -----------------------------------------------------------------------
    // FEATURE FLAG SWITCH — Python Backend vs Legacy Frontend Logic
    // -----------------------------------------------------------------------
    const usePythonBackend = process.env.NEXT_PUBLIC_ENABLE_PYTHON_BACKEND === 'true';

    if (usePythonBackend) {
      console.log('[Feature Flag] Using Python backend for re-optimization');
      try {
        await runPythonBackendOptimization(snapshotId, finalPerplexityQueries, finalGoogleQueries);

        // Refresh component state to show updated "Used" checks
        if (selectedBatchId) {
          await loadQueriesForBatch(selectedBatchId);
        }
      } catch (error) {
        console.error('[Re-Optimization] Python backend error:', error);
        setServerError('Failed to run re-optimization with Python backend.');
      }
      return;
    }

    try {
      // Pass final used queries directly to avoid async state issues
      if (mode === 'all') {
        await startAnalysisWithBothQueries(snapshotId, finalPerplexityQueries, finalGoogleQueries);
      } else if (mode === 'perplexity') {
        await startAnalysisWithSelectedQueries('perplexity', snapshotId);
      } else if (mode === 'google_overview') {
        await startAnalysisWithSelectedQueries('google_overview', snapshotId);
      }
    } catch (error) {
      console.error('[Re-Optimization] Error:', error);
      await updateSnapshotStatus(snapshotId, 'failed', 0);
      setServerError('Failed to start re-optimization. Please try again.');
    }
  };

  // Handler functions for manual used query selection
  // Helper function to check if query is odd based on analysis count comparison across all queries
  const hasQueryBeenReanalyzed = (query: string, pipeline: 'perplexity' | 'google_overview'): boolean => {
    // Get analysis counts for all queries in the current batch (both pipelines)
    const allBatchQueries = [
      ...allPerplexityQueries.map(q => ({ query: q, pipeline: 'perplexity' as const })),
      ...allGoogleQueries.map(q => ({ query: q, pipeline: 'google_overview' as const }))
    ];

    // Calculate analysis counts for each query in the batch
    const queryCounts = allBatchQueries.map(({ query, pipeline }) => ({
      query,
      pipeline,
      count: getAnalysesForQuery(query, pipeline).length
    }));

    // Find the maximum count
    const maxCount = Math.max(...queryCounts.map(qc => qc.count));

    // If all queries have the same count, all are odd (no remaining analysis needed)
    const allSameCount = queryCounts.every(qc => qc.count === maxCount);
    if (allSameCount) {
      return true;
    }

    // Find the current query's count
    const currentQueryCount = queryCounts.find(qc => qc.query === query && qc.pipeline === pipeline)?.count || 0;

    // Queries with the highest count are odd, others are non-odd
    return currentQueryCount === maxCount;
  };

  const handleQuerySelection = (query: string, pipeline: 'perplexity' | 'google_overview') => {
    if (pipeline === 'perplexity') {
      if (selectedPerplexityQueries.includes(query)) {
        setSelectedPerplexityQueries(selectedPerplexityQueries.filter((q) => q !== query));
        return;
      }

      // Allow selection even at max limit - user is replacing one query with another
      setSelectedPerplexityQueries([...selectedPerplexityQueries, query]);
    } else {
      if (selectedGoogleQueries.includes(query)) {
        setSelectedGoogleQueries(selectedGoogleQueries.filter((q) => q !== query));
        return;
      }

      // Allow selection even at max limit - user is replacing one query with another
      setSelectedGoogleQueries([...selectedGoogleQueries, query]);
    }
  };

  // State for editing queries
  const [editingQuery, setEditingQuery] = useState<{ pipeline: 'perplexity' | 'google_overview', index: number, value: string } | null>(null);
  const [editedQueries, setEditedQueries] = useState<{ perplexity: string[], google: string[] }>({
    perplexity: [],
    google: []
  });

  const [editingQueryLoading, setEditingQueryLoading] = useState(false);

  // Start editing a query
  const handleEditQuery = (query: string, index: number, pipeline: 'perplexity' | 'google_overview') => {
    setEditingQuery({ pipeline, index, value: query });
  };

  // Save edited query
  const handleSaveEditedQuery = async () => {
    if (!editingQuery) return;

    const { pipeline, index, value } = editingQuery;
    const cleanNewValue = value.trim();

    // Validation for Google queries: minimum 6 words
    if (pipeline === 'google_overview') {
      const wordCount = cleanNewValue.split(/\s+/).length;
      if (wordCount < 6) {
        setServerError(`Google queries must have at least 6 words to effectively invoke AI Overview. Current: ${wordCount} words.`);
        return;
      }
    }

    // CRITICAL: Get old query value from CURRENT state arrays
    const oldQueryValue = pipeline === 'perplexity' ? allPerplexityQueries[index] : allGoogleQueries[index];
    const cleanOldQueryValue = oldQueryValue ? oldQueryValue.trim() : "";

    // Add loading state for query editing
    setEditingQueryLoading(true);

    // Update edited queries UI state immediately
    if (pipeline === 'perplexity') {
      const newEdited = [...editedQueries.perplexity];
      newEdited[index] = cleanNewValue;
      setEditedQueries({ ...editedQueries, perplexity: newEdited });
    } else {
      const newEdited = [...editedQueries.google];
      newEdited[index] = cleanNewValue;
      setEditedQueries({ ...editedQueries, google: newEdited });
    }

    // Immediately update the database
    try {
      if (!user || !currentProductId) {
        console.error('Cannot update database: missing user or product ID');
        setEditingQuery(null);
        return;
      }

      // Update query_text directly in the queries table
      const response = await fetch('/api/queries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId: currentProductId,
          oldQueryText: cleanOldQueryValue,
          newQueryText: cleanNewValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update query in database');
      }

      console.log('Query successfully updated in database');

      // Update the store state with the new query
      if (pipeline === 'perplexity') {
        const updatedAllPerplexity = allPerplexityQueries.map((q, i) =>
          i === index ? cleanNewValue : q
        );
        setAllPerplexityQueries(updatedAllPerplexity);

        // Also update used queries if the old query was used
        const updatedUsedPerplexity = usedPerplexityQueries.map((q) => {
          if (q.trim() === cleanOldQueryValue) {
            return cleanNewValue;
          }
          return q;
        });
        setUsedPerplexityQueries(updatedUsedPerplexity);

        // Update selection state
        if (selectedPerplexityQueries.includes(oldQueryValue)) {
          const newSelection = selectedPerplexityQueries.filter(q => q !== oldQueryValue);
          newSelection.push(cleanNewValue);
          setSelectedPerplexityQueries(newSelection);
        }
      } else {
        const updatedAllGoogle = allGoogleQueries.map((q, i) =>
          i === index ? cleanNewValue : q
        );
        setAllGoogleQueries(updatedAllGoogle);

        // Also update used queries if the old query was used
        const updatedUsedGoogle = usedGoogleQueries.map((q) => {
          if (q.trim() === cleanOldQueryValue) {
            return cleanNewValue;
          }
          return q;
        });
        setUsedGoogleQueries(updatedUsedGoogle);

        // Update selection state
        if (selectedGoogleQueries.includes(oldQueryValue)) {
          const newSelection = selectedGoogleQueries.filter(q => q !== oldQueryValue);
          newSelection.push(cleanNewValue);
          setSelectedGoogleQueries(newSelection);
        }
      }

    } catch (error) {
      console.error('Failed to update query in database:', error);
      setServerError('Failed to save query changes. Please try again.');

    } finally {
      // Exit editing mode and clear loading
      setEditingQuery(null);
      setEditingQueryLoading(false);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingQuery(null);
  };

  // Handle keyboard shortcuts
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEditedQuery();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  // Get all analyses for a specific query (sorted by date, newest first)
  const getAnalysesForQuery = (query: string, pipeline: 'perplexity' | 'google_overview') => {
    if (!currentProductId) return [];

    const currentProduct = products.find(p => p.id === currentProductId);
    if (!currentProduct || !currentProduct.analyses) return [];

    return currentProduct.analyses
      .filter((analysis: any) => {
        if (pipeline === 'perplexity') {
          const analysisQuery = analysis.optimization_query;
          return analysisQuery && (
            analysisQuery === query ||
            analysisQuery.toLowerCase() === query.toLowerCase()
          );
        } else {
          const analysisQuery = analysis.google_search_query;
          return analysisQuery && (
            analysisQuery === query ||
            analysisQuery.toLowerCase() === query.toLowerCase()
          );
        }
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA; // Newest first
      });
  };

  // Calculate trend indicator (compare latest vs previous analysis)
  const getTrendIndicator = (analyses: any[]) => {
    if (analyses.length < 2) return null;

    const latest = analyses[0];
    const previous = analyses[1];

    // Extract client_product_visibility from analysis data
    const getVisibilityStatus = (analysis: any) => {
      try {
        const analysisData = analysis.optimization_analysis || analysis.google_overview_analysis || '';

        // Try to parse as JSON first
        let parsedData;
        try {
          parsedData = typeof analysisData === 'string' ? JSON.parse(analysisData) : analysisData;
        } catch {
          // If not valid JSON, try to extract from text
          return extractVisibilityFromText(analysisData);
        }

        // Look for client_product_visibility in the parsed data
        if (parsedData && typeof parsedData === 'object') {
          if (parsedData.client_product_visibility) {
            return parsedData.client_product_visibility;
          }

          // Check nested objects
          for (const key in parsedData) {
            if (parsedData[key] && parsedData[key].client_product_visibility) {
              return parsedData[key].client_product_visibility;
            }
          }
        }

        return extractVisibilityFromText(analysisData);
      } catch (error) {
        console.error('Error extracting visibility:', error);
        return 'Unknown';
      }
    };

    const extractVisibilityFromText = (text: string) => {
      // Look for patterns like "client_product_visibility": "Featured" or similar
      const patterns = [
        /client_product_visibility["\s]*[:=]["\s]*(Featured|Not Featured)/i,
        /visibility["\s]*[:=]["\s]*(Featured|Not Featured)/i,
        /(Featured|Not Featured)/i
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      return 'Unknown';
    };

    const latestVisibility = getVisibilityStatus(latest);
    const previousVisibility = getVisibilityStatus(previous);

    // Define visibility hierarchy: Featured > Not Featured
    const getVisibilityRank = (visibility: any) => {
      if (!visibility || typeof visibility !== 'string') {
        return 0; // Unknown or invalid values
      }

      const normalized = visibility.toLowerCase().trim();
      if (normalized.includes('featured')) return 2;
      if (normalized.includes('not featured')) return 1;
      return 0; // Unknown or other values
    };

    const latestRank = getVisibilityRank(latestVisibility);
    const previousRank = getVisibilityRank(previousVisibility);

    if (latestRank > previousRank) {
      return { direction: 'up', icon: '↗' };
    } else if (latestRank < previousRank) {
      return { direction: 'down', icon: '↘' };
    } else {
      return { direction: 'same', icon: '-' };
    }
  };

  // Format relative time for display
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Handle opening result menu
  const handleResultMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setResultMenuAnchor(event.currentTarget);
  };

  // Handle closing result menu
  const handleResultMenuClose = () => {
    setResultMenuAnchor(null);
  };

  // Handle viewing a specific analysis from history
  const handleViewAnalysisById = async (analysisId: string, pipeline: 'perplexity' | 'google_overview') => {
    handleResultMenuClose();

    if (!currentProductId) {
      setServerError('No product selected. Please select a product first.');
      return;
    }

    if (!user) {
      setServerError('User not authenticated. Please sign in.');
      return;
    }

    // Navigate to the appropriate historical results page with analysis ID
    if (pipeline === 'perplexity') {
      router.push(`/results/perplexity/${analysisId}`);
    } else {
      router.push(`/results/google/${analysisId}`);
    }
  };

  // View analysis result for a used query
  const handleViewAnalysisResult = async (query: string, pipeline: 'perplexity' | 'google_overview') => {
    console.log('handleViewAnalysisResult called', { query, pipeline, currentProductId });
    // Clear any stale error that could otherwise show up later when returning to /optimize
    setServerError(null);

    if (!currentProductId) {
      setServerError('No product selected. Please select a product first.');
      return;
    }

    if (!user) {
      setServerError('User not authenticated. Please sign in.');
      return;
    }

    // Create a unique key for this specific button
    const resultKey = `${pipeline}-${query}`;
    setLoadingResultKey(resultKey);

    try {
      // Get current product data
      let currentProduct = products.find(p => p.id === currentProductId);
      console.log('Current product (initial):', currentProduct);

      // If no analyses found, fetch fresh data from database without card reload
      if (!currentProduct || !currentProduct.analyses || currentProduct.analyses.length === 0) {
        console.log('No analyses found, fetching fresh data from database...');
        try {
          // Fetch only this product's data from API without full refresh
          const response = await fetch(`/api/products/${currentProductId}`);
          if (response.ok) {
            const productData = await response.json();
            currentProduct = productData;
            console.log('Fresh product data loaded:', currentProduct);
          } else {
            throw new Error('Failed to fetch product data');
          }
        } catch (fetchError) {
          console.error('Error fetching fresh product data:', fetchError);
          setServerError('Failed to load analysis data. Please try again.');
          return;
        }
      }

      if (!currentProduct || !currentProduct.analyses) {
        setServerError('Analysis history not found for this product.');
        return;
      }

      console.log('Available analyses:', currentProduct.analyses);
      console.log('Looking for query:', JSON.stringify(query), 'in pipeline:', pipeline);
      console.log('Used queries for comparison:', {
        perplexity: usedPerplexityQueries,
        google: usedGoogleQueries
      });

      // Find the analysis record that matches this query and pipeline
      const matchingAnalysis = currentProduct.analyses.find((analysis: any) => {
        console.log('Checking analysis:', {
          id: analysis.id,
          optimization_query: analysis.optimization_query,
          google_search_query: analysis.google_search_query,
          has_optimization: !!analysis.optimization_analysis,
          has_google: !!analysis.google_overview_analysis,
        });

        if (pipeline === 'perplexity') {
          // Try exact match first, then case-insensitive match
          const analysisQuery = analysis.optimization_query;
          const exactMatch = analysisQuery === query;
          const caseInsensitiveMatch = analysisQuery &&
            analysisQuery.toLowerCase() === query.toLowerCase();

          console.log('Perplexity match results:', {
            exactMatch,
            caseInsensitiveMatch,
            analysisQuery,
            searchQuery: query,
            analysisQueryType: typeof analysisQuery,
            searchQueryType: typeof query
          });
          return exactMatch || caseInsensitiveMatch;
        }

        // Google pipeline matching
        const analysisQuery = analysis.google_search_query;
        const exactMatch = analysisQuery === query;
        const caseInsensitiveMatch = analysisQuery &&
          analysisQuery.toLowerCase() === query.toLowerCase();

        console.log('Google match results:', {
          exactMatch,
          caseInsensitiveMatch,
          analysisQuery,
          searchQuery: query,
          analysisQueryType: typeof analysisQuery,
          searchQueryType: typeof query
        });
        return exactMatch || caseInsensitiveMatch;
      });

      console.log('Matching analysis:', matchingAnalysis);

      if (!matchingAnalysis) {
        setServerError(`Analysis result not found for this ${pipeline} query.`);
        return;
      }

      console.log('Navigating to:', {
        perplexity: `/results/perplexity/${matchingAnalysis.id}`,
        google: `/results/google/${matchingAnalysis.id}`
      });

      // Navigate to the appropriate historical results page with analysis ID
      if (pipeline === 'perplexity') {
        router.push(`/results/perplexity/${matchingAnalysis.id}`);
      } else {
        router.push(`/results/google/${matchingAnalysis.id}`);
      }
    } catch (error) {
      console.error('Error loading analysis result:', error);
      setServerError('Failed to load analysis result. Please try again.');
      setLoadingResultKey(null); // Clear loading on error
    }
    // Don't clear loading on successful navigation - let the user see the loading state until navigation completes
  };

  const startAnalysisWithSelectedQueries = async (
    pipeline: 'perplexity' | 'google_overview',
    snapshotId: string | null,
    queriesParam?: string[]
  ) => {
    if (!user) {
      setServerError('Please sign in to analyze products');
      router.push('/auth');
      return;
    }

    // 2) Get the selected query for this pipeline
    const selectedQueries = queriesParam || (pipeline === 'perplexity' ? selectedPerplexityQueries : selectedGoogleQueries);
    const validQueries = selectedQueries.filter(q => q && q.trim().length > 0);

    if (validQueries.length === 0) {
      setQueryGenerationError(`No valid ${pipeline === 'perplexity' ? 'Perplexity' : 'Google'} queries selected.`);
      return;
    }

    const maxForPipeline = pipeline === 'perplexity' ? maxPerplexityQueries : maxGoogleQueries;
    const queriesToRun = validQueries.slice(0, maxForPipeline);

    const primaryQuery = queriesToRun[0];

    // Update the current query for analysis (legacy: store first query)
    setGeneratedQuery(primaryQuery);

    // 1) Check credits for this analysis (scaled by query count)
    const requiredCredits = queriesToRun.length;
    try {
      const creditCheckResponse = await fetch('/api/analyze/check-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          creditsRequired: requiredCredits,
        }),
      });

      if (!creditCheckResponse.ok) {
        throw new Error('Failed to check credits');
      }

      const creditCheckData = await creditCheckResponse.json();

      if (!creditCheckData.hasEnoughCredits) {
        setServerError(`Insufficient credits. Required: ${requiredCredits}, Available: ${creditCheckData.currentCredits}. Please purchase more credits to continue.`);
        return;
      }
      if (typeof creditCheckData.currentCredits === 'number') {
        setUserCredits(creditCheckData.currentCredits);
      }
    } catch (creditError) {
      console.error('Credit check error:', creditError);
      setServerError('Failed to verify credits. Please try again.');
      return;
    }

    // 3) Prepare current form data for analysis
    const aiReadyData = prepareDataForAI(formData);

    let scraperResponse: any = null;
    let successfulQueriesRun: string[] = [];
    let savedGoogleAnalysisId: string | null = null;
    let savedPerplexityAnalysisId: string | null = null;

    setIsAnalyzing(true);
    if (pipeline === 'perplexity') {
      setIsPerplexityScraping(true);
    } else {
      setIsGoogleScraping(true);
    }

    try {
      // 4) Mirror old behavior per query (run in parallel): scrape -> analyze (+sources)
      // NOTE: We only insert DB rows after we have a saved product_id.
      const perQuerySettled = await Promise.allSettled(
        queriesToRun.map(async (q, index) => {
          if (process.env.NODE_ENV !== 'production') {
            console.log(`[QUERY ANALYSIS] Starting analysis for query ${index + 1}/${queriesToRun.length}: "${q}"`);
            console.log(`[QUERY ANALYSIS] Pipeline: ${pipeline}, Location: ${selectedLocation}`);
          }

          try {
            // Step 1: Scrape the query
            if (process.env.NODE_ENV !== 'production') {
              console.log(`[QUERY ANALYSIS] Step 1: Starting scraper for query: "${q}"`);
            }
            const scrapeData = pipeline === 'perplexity'
              ? await callPerplexityScraper(q, selectedLocation)
              : await callAIScraper(q, selectedLocation);

            if (process.env.NODE_ENV !== 'production') {
              console.log(`[QUERY ANALYSIS] Step 1 Complete: Scrape data received:`, {
                success: scrapeData?.success,
                hasContent: !!scrapeData?.ai_overview_text,
                contentLength: scrapeData?.ai_overview_text?.length || 0,
                sourceLinksCount: scrapeData?.source_links?.length || 0,
                jobId: scrapeData?.job_id
              });
            }

            if (!scrapeData || !scrapeData.success) {
              throw new Error(`Scraper failed for query "${q}": ${scrapeData?.error || 'Unknown error'}`);
            }

            if (!scrapeData.ai_overview_text || scrapeData.ai_overview_text.length <= 1) {
              throw new Error(`Scraper returned empty content for query "${q}"`);
            }

            const scrapeWithQuery = { query: q, ...scrapeData };
            if (process.env.NODE_ENV !== 'production') {
              console.log(`[QUERY ANALYSIS] Step 2: Starting strategic analysis for query: "${q}"`);
            }

            // Step 2: Strategic analysis
            const analysisResp = await fetch('/api/strategic-analysis', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                aiSearchJson: scrapeWithQuery,
                clientProductJson: aiReadyData,
                analysisId: undefined,
                pipeline,
              }),
            });

            if (process.env.NODE_ENV !== 'production') {
              console.log(`[QUERY ANALYSIS] Step 2 Response: Status ${analysisResp.status} for query: "${q}"`);
            }

            if (!analysisResp.ok) {
              const analysisError = await analysisResp.json().catch(() => ({}));
              const userMessage = (analysisError as any)?.error || 'Failed to perform strategic analysis';
              if (process.env.NODE_ENV !== 'production') {
                console.error(`[QUERY ANALYSIS] Step 2 Failed:`, {
                  query: q,
                  status: analysisResp.status,
                  error: analysisError,
                  userMessage
                });
              }
              throw new Error(`Analysis failed for query "${q}": ${userMessage}`);
            }

            const analysisData = await analysisResp.json();
            if (process.env.NODE_ENV !== 'production') {
              console.log(`[QUERY ANALYSIS] Step 2 Complete: Analysis data received for query: "${q}"`, {
                hasAnalysis: !!analysisData,
                analysisKeys: Object.keys(analysisData || {})
              });
            }

            if (!analysisData || typeof analysisData !== 'object') {
              throw new Error(`Received invalid analysis data from server for query "${q}"`);
            }

            // Step 3: Process sources (for Perplexity only)
            let processedSourcesForRow: any[] | null = null;
            if (pipeline === 'perplexity') {
              if (process.env.NODE_ENV !== 'production') {
                console.log(`[QUERY ANALYSIS] Step 3: Processing sources for query: "${q}"`);
              }
              try {
                const sourcesResp = await fetch('/api/process-sources', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    sourceLinks: (scrapeWithQuery as any)?.source_links || [],
                    analysisId: undefined,
                    pipeline: 'perplexity',
                  }),
                });

                if (process.env.NODE_ENV !== 'production') {
                  console.log(`[QUERY ANALYSIS] Step 3 Response: Status ${sourcesResp.status} for query: "${q}"`);
                }

                if (sourcesResp.ok) {
                  const sourcesData = await sourcesResp.json().catch(() => null);
                  if (process.env.NODE_ENV !== 'production') {
                    console.log(`[QUERY ANALYSIS] Step 3 Complete: Sources data received for query: "${q}"`, {
                      success: sourcesData?.success,
                      sourcesCount: sourcesData?.sources?.length || 0
                    });
                  }

                  if (sourcesData && sourcesData.success && Array.isArray(sourcesData.sources)) {
                    processedSourcesForRow = sourcesData.sources;
                  }
                } else {
                  if (process.env.NODE_ENV !== 'production') {
                    console.warn(`[QUERY ANALYSIS] Step 3 Failed: Sources processing failed for query: "${q}", Status: ${sourcesResp.status}`);
                  }
                }
              } catch (e) {
                if (process.env.NODE_ENV !== 'production') {
                  console.error(`[QUERY ANALYSIS] Step 3 Error: Sources processing error for query: "${q}":`, e);
                }
                if (process.env.NODE_ENV !== 'production') {
                  console.warn('[Process Sources] Per-query failed:', e);
                }
              }
            }

            if (process.env.NODE_ENV !== 'production') {
              console.log(`[QUERY ANALYSIS] SUCCESS: Query "${q}" completed successfully`);
            }
            return {
              query: q,
              scrapeWithQuery,
              analysisData,
              processedSourcesForRow,
            };
          } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
              console.error(`[QUERY ANALYSIS] FAILED: Query "${q}" failed with error:`, error);
            }
            throw error;
          }
        })
      );

      const perQuerySuccess = perQuerySettled
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map((r) => r.value);

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[QUERY ANALYSIS] SUMMARY: ${perQuerySuccess.length}/${queriesToRun.length} queries succeeded`);
      }

      if (perQuerySuccess.length === 0) {
        const perQueryFailures = perQuerySettled
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map((r) => r.reason);

        if (process.env.NODE_ENV !== 'production') {
          console.error(`[QUERY ANALYSIS] COMPLETE FAILURE: All ${queriesToRun.length} queries failed:`, {
            totalQueries: queriesToRun.length,
            failedQueries: queriesToRun,
            errors: perQueryFailures,
            pipeline,
            location: selectedLocation
          });
        }

        throw new Error(`All selected queries failed. Please try again. Check console for details.`);
      }

      const perQueryFailures = perQuerySettled
        .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
        .map((r) => r.reason);

      if (perQueryFailures.length > 0) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[QUERY ANALYSIS] PARTIAL FAILURE: ${perQueryFailures.length}/${queriesToRun.length} queries failed:`, {
            failedQueries: perQueryFailures,
            pipeline,
            location: selectedLocation
          });
        }
      }

      successfulQueriesRun = perQuerySuccess
        .map((r: any) => (typeof r?.query === 'string' ? r.query : ''))
        .filter((q: string) => q && q.trim().length > 0);

      scraperResponse = perQuerySuccess[0]?.scrapeWithQuery ?? null;

      const primaryResult = perQuerySuccess[0];
      const analysisData = primaryResult?.analysisData;

      // 5) Update UI with a primary analysis (first successful query)
      let perplexityAnalysis: OptimizationAnalysis | null = null;
      let googleAnalysis: OptimizationAnalysis | null = null;

      if (pipeline === 'perplexity') {
        setOptimizationAnalysis(analysisData);
        perplexityAnalysis = analysisData as OptimizationAnalysis;
        if (Array.isArray(primaryResult?.processedSourcesForRow)) {
          setProcessedSources(primaryResult.processedSourcesForRow);
        }
      } else {
        setGoogleOverviewAnalysis(analysisData);
        googleAnalysis = analysisData as OptimizationAnalysis;
      }

      // IDs will be set after per-query inserts
      savedGoogleAnalysisId = null;
      savedPerplexityAnalysisId = null;

      // Clear any previous analysis error since analysis succeeded
      setAnalysisError(null);

      // 7) Credits will be deducted after successful per-query inserts

      // 8) Persist the analysis result as a product
      const productRecord = createProductRecord(
        pipeline === 'perplexity' ? (analysisData as OptimizationAnalysis) : null,
        pipeline === 'google_overview' ? (analysisData as OptimizationAnalysis) : null
      );
      addProduct(productRecord);

      // Prepare query data for saving
      let queryDataString = generatedQuery; // fallback to legacy

      if (queryData) {
        queryDataString = JSON.stringify(queryData);
      } else if (allPerplexityQueries.length > 0 || allGoogleQueries.length > 0) {
        // Create QueryData from current query arrays if queryData is missing
        const fallbackQueryData: QueryData = {
          all: {
            perplexity: allPerplexityQueries,
            google: allGoogleQueries,
          },
          used: {
            perplexity: usedPerplexityQueries,
            google: usedGoogleQueries,
          },
        };
        queryDataString = JSON.stringify(fallbackQueryData);
        setQueryData(fallbackQueryData);
      }

      let savedProductId: string | null = null;
      try {
        if (currentProductId) {
          // Existing product: update it with the latest form and analysis state
          await updateProductInSupabase(currentProductId, user.id);
          savedProductId = currentProductId;
        } else {
          // New product: create in Supabase and capture its ID
          savedProductId = await saveProductToSupabase(productRecord, user.id, queryDataString);
          console.log('Product saved to Supabase successfully with ID:', savedProductId);
          if (savedProductId) {
            setCurrentProductId(savedProductId);
          }
        }
      } catch (saveError) {
        console.error('Failed to save product to Supabase:', saveError);
      }

      // 9) Insert per-query rows (mirror old system, but parallel)
      let finalQueryData: QueryData | null = null;

      if (savedProductId) {
        try {
          const insertSettled = await Promise.allSettled(
            perQuerySuccess.map(async (r: any) => {
              const saveResp = await fetch('/api/product-analyses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  product_id: savedProductId,
                  optimization_query: pipeline === 'perplexity' ? r.query : null,
                  google_search_query: pipeline === 'google_overview' ? r.query : null,
                  optimization_analysis:
                    pipeline === 'perplexity' ? (r.analysisData as OptimizationAnalysis) : null,
                  google_overview_analysis:
                    pipeline === 'google_overview' ? (r.analysisData as OptimizationAnalysis) : null,
                  combined_analysis: null,
                  source_links: (productRecord.sourceLinks || []),
                  processed_sources:
                    r.processedSourcesForRow ?? (productRecord.processedSources || []),
                  perplexity_raw_serp_results:
                    pipeline === 'perplexity' ? r.scrapeWithQuery : null,
                  google_raw_serp_results:
                    pipeline === 'google_overview' ? r.scrapeWithQuery : null,
                  snapshot_id: snapshotId,
                }),
              });

              if (!saveResp.ok) {
                throw new Error(`Failed to save analysis history (status ${saveResp.status})`);
              }

              const saveData = await saveResp.json();
              return {
                query: r.query,
                savedGoogleId:
                  saveData.googleAnalysis?.id || saveData.analysis?.google_analysis_id || null,
                savedPerplexityId:
                  saveData.perplexityAnalysis?.id || saveData.analysis?.perplexity_analysis_id || null,
              };
            })
          );

          const insertSuccess = insertSettled
            .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
            .map((r) => r.value);

          if (insertSuccess.length === 0) {
            throw new Error('Failed to save any analysis rows. Please try again.');
          }

          successfulQueriesRun = insertSuccess
            .map((r: any) => (typeof r?.query === 'string' ? r.query : ''))
            .filter((q: string) => q && q.trim().length > 0);

          savedGoogleAnalysisId = insertSuccess
            .map((r: any) => r.savedGoogleId)
            .filter((id: any) => typeof id === 'string' && id.length > 0)
            .slice(-1)[0] ?? null;

          savedPerplexityAnalysisId = insertSuccess
            .map((r: any) => r.savedPerplexityId)
            .filter((id: any) => typeof id === 'string' && id.length > 0)
            .slice(-1)[0] ?? null;

          if (String(process.env.NODE_ENV) === 'debug' && process.env.NODE_ENV !== 'production') {
            console.log('[DEBUG][product-analyses] single-engine per-query inserts', {
              pipeline,
              product_id: savedProductId,
              queriesToRun,
              successfulQueriesRun,
              savedGoogleAnalysisId,
              savedPerplexityAnalysisId,
            });
          }

          // 10) Deduct credits based on successful inserts
          try {
            const creditsToDeduct = successfulQueriesRun.length;
            const creditResponse = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                creditsRequired: creditsToDeduct,
              }),
            });

            const creditData = await creditResponse.json();

            if (!creditData.success) {
              console.error('Failed to deduct credits after successful analysis');
            } else {
              console.log('Credit deducted successfully after analysis completion');
              adjustUserCredits(-creditsToDeduct);
            }
          } catch (creditError) {
            console.error('Credit deduction error after analysis:', creditError);
          }

          // 11) Mark the used queries - they are now tracked in analysis tables
          // The used status will be fetched from analysis tables on next load
          if (queryDataString) {
            // Update local state with used queries
            const usedPerplexity = pipeline === 'perplexity'
              ? [...new Set([...usedPerplexityQueries, ...successfulQueriesRun])]
              : usedPerplexityQueries;
            const usedGoogle = pipeline === 'google_overview'
              ? [...new Set([...usedGoogleQueries, ...successfulQueriesRun])]
              : usedGoogleQueries;

            setUsedPerplexityQueries(usedPerplexity);
            setUsedGoogleQueries(usedGoogle);

            // Remove used queries from selected queries
            setSelectedPerplexityQueries(selectedPerplexityQueries.filter((q: string) => !usedPerplexity.includes(q)));
            setSelectedGoogleQueries(selectedGoogleQueries.filter((q: string) => !usedGoogle.includes(q)));

            // Update queryData for consistency
            const updatedQueryData: QueryData = {
              all: {
                perplexity: allPerplexityQueries,
                google: allGoogleQueries,
              },
              used: {
                perplexity: usedPerplexity,
                google: usedGoogle,
              },
            };
            setQueryData(updatedQueryData);
            finalQueryData = updatedQueryData;
          }

          // Update analysis_history with product_id and available analysis IDs from the split tables
          try {
            await fetch('/api/analyze/update-history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                productId: savedProductId,
                googleAnalysisId: savedGoogleAnalysisId,
                perplexityAnalysisId: savedPerplexityAnalysisId,
              }),
            });
            console.log('Analysis history updated successfully');
          } catch (historyError) {
            console.error('Failed to update analysis history:', historyError);
          }

          // Update snapshot status to completed after successful save
          await updateSnapshotStatus(snapshotId, 'completed', successfulQueriesRun.length);
          console.log('[Snapshot] Snapshot status updated to completed:', snapshotId);
        } catch (analysisSaveError) {
          console.error('Failed to save analysis history to product_analysis tables:', analysisSaveError);
          // Update snapshot status to failed if save fails
          await updateSnapshotStatus(snapshotId, 'failed', successfulQueriesRun.length);
          console.error('[Snapshot] Snapshot status updated to failed due to save error:', snapshotId);
        }
      }

      // 11) Navigate to appropriate results page
      // Ensure generatedQuery contains the full QueryData structure for results pages
      if (finalQueryData) {
        setGeneratedQuery(JSON.stringify(finalQueryData));
      }

      if (pipeline === 'perplexity') {
        router.push('/results');
      } else {
        router.push('/results/google');
      }
    } catch (analysisError) {
      console.error('Analysis error:', analysisError);
      const friendly = 'A server error occurred while analyzing your product. Please check your internet connection and try again. If the issue persists, please contact the provider.';
      const msg = (analysisError instanceof Error && analysisError.message && analysisError.message.trim().length > 0)
        ? `${friendly}\n\nDetails: ${analysisError.message}`
        : friendly;
      setAnalysisError(msg);
    } finally {
      setIsAnalyzing(false);
      setIsPerplexityScraping(false);
      setIsGoogleScraping(false);
    }
  };

  const startAnalysisWithBothQueries = async (
    snapshotId: string | null,
    perplexityQueriesParam?: string[],
    googleQueriesParam?: string[]
  ) => {
    if (!user) {
      setServerError('Please sign in to analyze products');
      router.push('/auth');
      return;
    }

    // Use provided parameters or fall back to state
    const perplexityQueries = (perplexityQueriesParam || selectedPerplexityQueries).filter((q) => q && q.trim()).slice(0, maxPerplexityQueries);
    const googleQueries = (googleQueriesParam || selectedGoogleQueries).filter((q) => q && q.trim()).slice(0, maxGoogleQueries);

    const perplexityQuery = perplexityQueries[0] || null;
    const googleQuery = googleQueries[0] || null;

    if (perplexityQueries.length === 0 || googleQueries.length === 0) {
      setQueryGenerationError('Both Perplexity and Google queries must be selected for combined analysis.');
      return;
    }

    // 1) Check credits for running both analyses (scaled by query count)
    try {
      const requiredCredits = perplexityQueries.length + googleQueries.length;
      const creditCheckResponse = await fetch('/api/analyze/check-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          creditsRequired: requiredCredits,
        }),
      });

      if (!creditCheckResponse.ok) {
        throw new Error('Failed to check credits');
      }

      const creditCheckData = await creditCheckResponse.json();

      if (!creditCheckData.hasEnoughCredits) {
        setServerError(`Insufficient credits for combined analysis. Required: ${requiredCredits}, Available: ${creditCheckData.currentCredits}. Please purchase more credits to continue.`);
        return;
      }
      if (typeof creditCheckData.currentCredits === 'number') {
        setUserCredits(creditCheckData.currentCredits);
      }
    } catch (creditError) {
      console.error('Credit check error:', creditError);
      setServerError('Failed to verify credits. Please try again.');
      return;
    }

    // 2) Prepare current form data for analysis
    const aiReadyData = prepareDataForAI(formData);

    let perplexityScraperResponse: any = null;
    let googleScraperResponse: any = null;
    let perplexityScrapesForHistory: any[] = [];
    let googleScrapesForHistory: any[] = [];
    let perplexityQueriesRun: string[] = [];
    let googleQueriesRun: string[] = [];

    setIsAnalyzing(true);
    setIsPerplexityScraping(true);
    setIsGoogleScraping(true);

    try {
      // 3) Mirror old behavior per query (run in parallel): scrape -> analyze (+sources)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[BOTH QUERIES] Starting analysis - Perplexity: ${perplexityQueries.length}, Google: ${googleQueries.length}`);
      }

      const [perplexityPerQuery, googlePerQuery] = await Promise.all([
        Promise.allSettled(
          perplexityQueries.map(async (q, index) => {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`[BOTH QUERIES] Perplexity ${index + 1}/${perplexityQueries.length}: "${q}"`);
            }

            const scrapeData = await callPerplexityScraper(q, selectedLocation);
            if (process.env.NODE_ENV !== 'production') {
              console.log(`[BOTH QUERIES] Perplexity scrape complete for "${q}":`, {
                success: scrapeData?.success,
                hasContent: !!scrapeData?.ai_overview_text,
                contentLength: scrapeData?.ai_overview_text?.length || 0
              });
            }

            const scrapeWithQuery = { query: q, ...scrapeData };

            const analysisResp = await fetch('/api/strategic-analysis', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                aiSearchJson: scrapeWithQuery,
                clientProductJson: aiReadyData,
                analysisId: undefined,
                pipeline: 'perplexity',
              }),
            });

            if (process.env.NODE_ENV !== 'production') {
              console.log(`[BOTH QUERIES] Perplexity analysis response for "${q}": ${analysisResp.status}`);
            }

            if (!analysisResp.ok) {
              const analysisError = await analysisResp.json().catch(() => ({}));
              const userMessage = (analysisError as any)?.error || 'Failed to perform strategic analysis';
              if (process.env.NODE_ENV !== 'production') {
                console.error(`[BOTH QUERIES] Perplexity analysis failed for "${q}":`, userMessage);
              }
              throw new Error(userMessage);
            }

            const analysisData = await analysisResp.json();
            if (!analysisData || typeof analysisData !== 'object') {
              throw new Error('Received invalid Perplexity analysis data from server');
            }

            if (process.env.NODE_ENV !== 'production') {
              console.log(`[BOTH QUERIES] Perplexity analysis complete for "${q}"`);
            }

            let processedSourcesForRow: any[] | null = null;
            try {
              const sourcesResp = await fetch('/api/process-sources', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  sourceLinks: (scrapeWithQuery as any)?.source_links || [],
                  analysisId: undefined,
                  pipeline: 'perplexity',
                }),
              });

              if (sourcesResp.ok) {
                const sourcesData = await sourcesResp.json().catch(() => null);
                if (sourcesData && sourcesData.success && Array.isArray(sourcesData.sources)) {
                  processedSourcesForRow = sourcesData.sources;
                }
              }
            } catch (e) {
              if (process.env.NODE_ENV !== 'production') {
                console.warn('[Process Sources] Per-query failed:', e);
              }
            }

            return {
              query: q,
              scrapeWithQuery,
              analysisData,
              processedSourcesForRow,
            };
          })
        ),
        Promise.allSettled(
          googleQueries.map(async (q, index) => {
            if (process.env.NODE_ENV !== 'production') {
              console.log(`[BOTH QUERIES] Google ${index + 1}/${googleQueries.length}: "${q}"`);
            }

            const scrapeData = await callAIScraper(q, selectedLocation);
            if (process.env.NODE_ENV !== 'production') {
              console.log(`[BOTH QUERIES] Google scrape complete for "${q}":`, {
                success: scrapeData?.success,
                hasContent: !!scrapeData?.ai_overview_text,
                contentLength: scrapeData?.ai_overview_text?.length || 0,
                jobId: scrapeData?.job_id
              });
            }

            const scrapeWithQuery = { query: q, ...scrapeData };

            const analysisResp = await fetch('/api/strategic-analysis', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                aiSearchJson: scrapeWithQuery,
                clientProductJson: aiReadyData,
                analysisId: undefined,
                pipeline: 'google_overview',
              }),
            });

            if (process.env.NODE_ENV !== 'production') {
              console.log(`[BOTH QUERIES] Google analysis response for "${q}": ${analysisResp.status}`);
            }

            if (!analysisResp.ok) {
              const analysisError = await analysisResp.json().catch(() => ({}));
              const userMessage = (analysisError as any)?.error || 'Failed to perform strategic analysis';
              if (process.env.NODE_ENV !== 'production') {
                console.error(`[BOTH QUERIES] Google analysis failed for "${q}":`, userMessage);
              }
              throw new Error(userMessage);
            }

            const analysisData = await analysisResp.json();
            if (!analysisData || typeof analysisData !== 'object') {
              throw new Error('Received invalid Google analysis data from server');
            }

            if (process.env.NODE_ENV !== 'production') {
              console.log(`[BOTH QUERIES] Google analysis complete for "${q}"`);
            }

            return {
              query: q,
              scrapeWithQuery,
              analysisData,
              processedSourcesForRow: null,
            };
          })
        ),
      ]);

      const perplexitySuccess = perplexityPerQuery
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map((r) => r.value);
      const googleSuccess = googlePerQuery
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
        .map((r) => r.value);

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[BOTH QUERIES] SUMMARY: Perplexity: ${perplexitySuccess.length}/${perplexityQueries.length}, Google: ${googleSuccess.length}/${googleQueries.length}`);
      }

      if (perplexitySuccess.length === 0 && googleSuccess.length === 0) {
        const perplexityFailures = perplexityPerQuery
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map((r) => r.reason);
        const googleFailures = googlePerQuery
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map((r) => r.reason);

        if (process.env.NODE_ENV !== 'production') {
          console.error(`[BOTH QUERIES] COMPLETE FAILURE: All queries failed:`, {
            perplexityQueries,
            googleQueries,
            perplexityFailures,
            googleFailures,
            location: selectedLocation
          });
        }

        throw new Error('No successful analysis results were produced. Check console for details.');
      }

      if (perplexitySuccess.length < perplexityQueries.length) {
        const perplexityFailures = perplexityPerQuery
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map((r) => r.reason);
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[BOTH QUERIES] PARTIAL PERPLEXITY FAILURE:`, perplexityFailures);
        }
      }

      if (googleSuccess.length < googleQueries.length) {
        const googleFailures = googlePerQuery
          .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
          .map((r) => r.reason);
        if (process.env.NODE_ENV !== 'production') {
          console.warn(`[BOTH QUERIES] PARTIAL GOOGLE FAILURE:`, googleFailures);
        }
      }

      perplexityScrapesForHistory = perplexitySuccess.map((r: any) => r.scrapeWithQuery);
      googleScrapesForHistory = googleSuccess.map((r: any) => r.scrapeWithQuery);
      perplexityQueriesRun = perplexitySuccess.map((r: any) => r.query);
      googleQueriesRun = googleSuccess.map((r: any) => r.query);

      perplexityScraperResponse = perplexityScrapesForHistory[0] ?? null;
      googleScraperResponse = googleScrapesForHistory[0] ?? null;

      let primaryAnalysis: OptimizationAnalysis | null = null;
      let perplexityAnalysis: OptimizationAnalysis | null = null;
      let googleAnalysis: OptimizationAnalysis | null = null;

      if (perplexitySuccess.length > 0) {
        setOptimizationAnalysis(perplexitySuccess[0].analysisData);
        perplexityAnalysis = perplexitySuccess[0].analysisData as OptimizationAnalysis;
        primaryAnalysis = perplexityAnalysis;
        if (Array.isArray(perplexitySuccess[0].processedSourcesForRow)) {
          setProcessedSources(perplexitySuccess[0].processedSourcesForRow);
        }
      }

      if (googleSuccess.length > 0) {
        setGoogleOverviewAnalysis(googleSuccess[0].analysisData);
        googleAnalysis = googleSuccess[0].analysisData as OptimizationAnalysis;
        if (!primaryAnalysis) {
          primaryAnalysis = googleAnalysis;
        }
      }

      // Clear any previous analysis error since analysis succeeded
      setAnalysisError(null);

      if (!primaryAnalysis) {
        throw new Error('No successful analysis results were produced');
      }

      // 5) Credits will be deducted after successful per-query inserts

      // 6) Persist the analysis result as a product, keeping Perplexity and Google separate
      const productRecord = createProductRecord(perplexityAnalysis, googleAnalysis);
      addProduct(productRecord);

      // Prepare query data for saving
      let queryDataString = generatedQuery; // fallback to legacy

      if (queryData) {
        queryDataString = JSON.stringify(queryData);
      } else if (allPerplexityQueries.length > 0 || allGoogleQueries.length > 0) {
        // Create QueryData from current query arrays if queryData is missing
        const fallbackQueryData: QueryData = {
          all: {
            perplexity: allPerplexityQueries,
            google: allGoogleQueries,
          },
          used: {
            perplexity: usedPerplexityQueries,
            google: usedGoogleQueries,
          },
        };
        queryDataString = JSON.stringify(fallbackQueryData);
        setQueryData(fallbackQueryData);
      }

      // Save to Supabase if user is authenticated
      let savedProductId: string | null = null;
      try {
        if (currentProductId) {
          // Existing product: update it with latest form/analysis state
          await updateProductInSupabase(currentProductId, user.id);
          savedProductId = currentProductId;
        } else {
          // New product: create and capture its ID
          savedProductId = await saveProductToSupabase(productRecord, user.id, queryDataString);
          console.log('Product saved to Supabase successfully with ID:', savedProductId);
          if (savedProductId) {
            setCurrentProductId(savedProductId);
          }
        }
      } catch (saveError) {
        console.error('Failed to save product to Supabase:', saveError);
      }

      // Also persist this specific analysis run into the split analysis tables for history
      let savedGoogleAnalysisId: string | null = null;
      let savedPerplexityAnalysisId: string | null = null;
      let finalQueryData: QueryData | null = null;

      if (savedProductId) {
        try {
          // Insert per-query rows for each engine
          const [googleInsertSettled, perplexityInsertSettled] = await Promise.all([
            Promise.allSettled(
              googleSuccess.map(async (r: any) => {
                const saveResp = await fetch('/api/product-analyses', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    product_id: savedProductId,
                    optimization_query: null,
                    google_search_query: r.query,
                    optimization_analysis: null,
                    google_overview_analysis: r.analysisData as OptimizationAnalysis,
                    combined_analysis: null,
                    source_links: productRecord.sourceLinks || [],
                    processed_sources: productRecord.processedSources || [],
                    google_raw_serp_results: r.scrapeWithQuery,
                    perplexity_raw_serp_results: null,
                    snapshot_id: snapshotId,
                  }),
                });

                if (!saveResp.ok) {
                  throw new Error(`Failed to save Google analysis history (status ${saveResp.status})`);
                }

                const saveData = await saveResp.json();
                return {
                  query: r.query,
                  savedGoogleId:
                    saveData.googleAnalysis?.id || saveData.analysis?.google_analysis_id || null,
                };
              })
            ),
            Promise.allSettled(
              perplexitySuccess.map(async (r: any) => {
                const saveResp = await fetch('/api/product-analyses', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    product_id: savedProductId,
                    optimization_query: r.query,
                    google_search_query: null,
                    optimization_analysis: r.analysisData as OptimizationAnalysis,
                    google_overview_analysis: null,
                    combined_analysis: null,
                    source_links: productRecord.sourceLinks || [],
                    processed_sources:
                      r.processedSourcesForRow ?? (productRecord.processedSources || []),
                    perplexity_raw_serp_results: r.scrapeWithQuery,
                    google_raw_serp_results: null,
                    snapshot_id: snapshotId,
                  }),
                });

                if (!saveResp.ok) {
                  throw new Error(`Failed to save Perplexity analysis history (status ${saveResp.status})`);
                }

                const saveData = await saveResp.json();
                return {
                  query: r.query,
                  savedPerplexityId:
                    saveData.perplexityAnalysis?.id || saveData.analysis?.perplexity_analysis_id || null,
                };
              })
            ),
          ]);

          const googleInsertSuccess = googleInsertSettled
            .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
            .map((r) => r.value);
          const perplexityInsertSuccess = perplexityInsertSettled
            .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
            .map((r) => r.value);

          googleQueriesRun = googleInsertSuccess.map((r: any) => r.query);
          perplexityQueriesRun = perplexityInsertSuccess.map((r: any) => r.query);

          savedGoogleAnalysisId = googleInsertSuccess
            .map((r: any) => r.savedGoogleId)
            .filter((id: any) => typeof id === 'string' && id.length > 0)
            .slice(-1)[0] ?? null;
          savedPerplexityAnalysisId = perplexityInsertSuccess
            .map((r: any) => r.savedPerplexityId)
            .filter((id: any) => typeof id === 'string' && id.length > 0)
            .slice(-1)[0] ?? null;

          if (String(process.env.NODE_ENV) === 'debug' && process.env.NODE_ENV !== 'production') {
            console.log('[DEBUG][product-analyses] combined per-query inserts', {
              product_id: savedProductId,
              perplexityQueries,
              googleQueries,
              perplexityQueriesRun,
              googleQueriesRun,
              savedGoogleAnalysisId,
              savedPerplexityAnalysisId,
            });
          }

          // Deduct credits based on successful inserts
          try {
            const creditsToDeduct = perplexityQueriesRun.length + googleQueriesRun.length;
            const creditResponse = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                creditsRequired: creditsToDeduct,
              }),
            });

            const creditData = await creditResponse.json();

            if (!creditData.success) {
              console.error('Failed to deduct credits after successful analysis');
            } else {
              console.log('Credit deducted successfully after analysis completion');
              adjustUserCredits(-creditsToDeduct);
            }
          } catch (creditError) {
            console.error('Credit deduction error after analysis:', creditError);
          }

          // Mark queries as used in queryData ONLY after successful inserts
          if (queryDataString) {
            let currentQueryData: QueryData | null = null;
            try {
              currentQueryData = JSON.parse(queryDataString) as QueryData;
            } catch (error) {
              console.warn('Failed to parse saved query data:', error);
            }

            if (currentQueryData) {
              // Fetch used queries from analysis tables
              const { google: usedGoogleFromAnalysis, perplexity: usedPerplexityFromAnalysis } =
                await fetchUsedQueriesFromAnalysisClient(savedProductId);

              // Update local state with used queries from analysis tables
              setUsedPerplexityQueries(usedPerplexityFromAnalysis);
              setUsedGoogleQueries(usedGoogleFromAnalysis);

              // Update queryData for consistency
              const updatedQueryData: QueryData = {
                all: {
                  perplexity: allPerplexityQueries,
                  google: allGoogleQueries,
                },
                used: {
                  perplexity: usedPerplexityFromAnalysis,
                  google: usedGoogleFromAnalysis,
                },
              };
              setQueryData(updatedQueryData);

              // Remove used queries from selected queries
              setSelectedPerplexityQueries(selectedPerplexityQueries.filter((q: string) => !updatedQueryData.used.perplexity.includes(q)));
              setSelectedGoogleQueries(selectedGoogleQueries.filter((q: string) => !updatedQueryData.used.google.includes(q)));
              finalQueryData = updatedQueryData;
            }
          }

          // Update analysis_history with product_id and available analysis IDs from the split tables
          try {
            await fetch('/api/analyze/update-history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                productId: savedProductId,
                googleAnalysisId: savedGoogleAnalysisId,
                perplexityAnalysisId: savedPerplexityAnalysisId,
              }),
            });
            console.log('Analysis history updated successfully');
          } catch (historyError) {
            console.error('Failed to update analysis history:', historyError);
          }

          // Update snapshot status to completed after successful save
          await updateSnapshotStatus(snapshotId, 'completed', perplexityQueriesRun.length + googleQueriesRun.length);
          console.log('[Snapshot] Snapshot status updated to completed:', snapshotId);
        } catch (analysisSaveError) {
          console.error('Failed to save analysis history to product_analysis tables:', analysisSaveError);
          // Update snapshot status to failed if save fails
          await updateSnapshotStatus(snapshotId, 'failed', perplexityQueriesRun.length + googleQueriesRun.length);
          console.error('[Snapshot] Snapshot status updated to failed due to save error:', snapshotId);
          // Do not block user from seeing results if history save fails
        }
      }

      // 8) Navigate to combined results (Perplexity page as primary)
      // Ensure generatedQuery contains the full QueryData structure for results pages
      if (finalQueryData) {
        setGeneratedQuery(JSON.stringify(finalQueryData));
      }
      router.push('/results');
    } catch (error) {
      console.error('Combined analysis error:', error);
      const friendly = 'A server error occurred while analyzing your product. Please check your internet connection and try again. If the issue persists, please contact the provider.';
      const msg = (error instanceof Error && error.message && error.message.trim().length > 0)
        ? `${friendly}\n\nDetails: ${error.message}`
        : friendly;
      setAnalysisError(msg);
    } finally {
      setIsPerplexityScraping(false);
      setIsGoogleScraping(false);
      setIsAnalyzing(false);
    }
  };

  // const handleSubmitWithGeneratedQueries = async (aiReadyData: any) => {
  //   // This function uses the already generated queries for analysis
  //   // (queries were already generated by handleGenerateQueryOnly)

  //   // Declare snapshotId outside try block to make it accessible in catch
  //   let snapshotId: string | null = null;

  //   try {
  //     // Part 0: Create analysis snapshot before starting analysis
  //     if (selectedBatchId && currentProductId) {
  //       try {
  //         if (process.env.NODE_ENV !== 'production') {
  //           console.log('[Snapshot Debug] handleSubmitWithGeneratedQueries - Creating snapshot with:', {
  //             productId: currentProductId,
  //             batchId: selectedBatchId
  //           });
  //         }
  //         snapshotId = await createAnalysisSnapshot(currentProductId, selectedBatchId);
  //         setCurrentSnapshotId(snapshotId);
  //         console.log('[Snapshot] Snapshot created:', snapshotId);
  //       } catch (snapshotError: any) {
  //         console.error('[Snapshot] Failed to create snapshot:', snapshotError);
  //         setServerError(snapshotError.message || 'Failed to initialize analysis tracking. Please try again.');
  //         return;
  //       }
  //     } else {
  //       if (process.env.NODE_ENV !== 'production') {
  //         console.log('[Snapshot Debug] handleSubmitWithGeneratedQueries - Skipping snapshot creation - missing conditions:', {
  //           selectedBatchId,
  //           currentProductId,
  //           reason: !selectedBatchId ? 'No batch selected' : !currentProductId ? 'No current product' : 'Unknown'
  //         });
  //       }
  //     }

  //     // Determine what to run based on actual selected queries, not pipeline state
  //     const analysisMode = getAnalysisMode();
  //     const runPerplexity = analysisMode === 'all' || analysisMode === 'perplexity';
  //     const runGoogle = analysisMode === 'all' || analysisMode === 'google_overview';

  //     let perplexityScraperResponse: any = null;
  //     let googleScraperResponse: any = null;

  //     setIsAnalyzing(true);

  //     if (runPerplexity && runGoogle) {
  //       console.log("Running both Perplexity and Google analysis with existing queries");
  //       // Use currently selected queries, not hardcoded first queries
  //       const perplexityQuery = selectedPerplexityQueries[0] || allPerplexityQueries[0];
  //       const googleQuery = selectedGoogleQueries[0] || allGoogleQueries[0];

  //       console.log("Using Perplexity-optimized query:", perplexityQuery);
  //       console.log("Using Google-optimized query:", googleQuery);

  //       const [perplexityResult, googleResult] = await Promise.all([
  //         callPerplexityScraper(perplexityQuery!, selectedLocation),
  //         callAIScraper(googleQuery!, selectedLocation),
  //       ]);
  //       perplexityScraperResponse = perplexityResult;
  //       googleScraperResponse = googleResult;
  //     } else if (runPerplexity) {
  //       // Use currently selected Perplexity query
  //       const queryToUse = selectedPerplexityQueries[0] || allPerplexityQueries[0];
  //       perplexityScraperResponse = await callPerplexityScraper(queryToUse!, selectedLocation);
  //     } else if (runGoogle) {
  //       // Use currently selected Google query
  //       const queryToUse = selectedGoogleQueries[0] || allGoogleQueries[0];
  //       googleScraperResponse = await callAIScraper(queryToUse!, selectedLocation);
  //     }

  //       const scraperResponse = perplexityScraperResponse || googleScraperResponse;
  //       console.log("Scraper response:", scraperResponse);

  //       if (!scraperResponse || !scraperResponse.data) {
  //         throw new Error('No data received from scraper');
  //       }

  //       const analysisId = scraperResponse.analysisId;
  //       console.log("Analysis ID:", analysisId);

  //       // Save product to Supabase
  //       const productToSave: OptimizedProduct = {
  //         id: '', // Will be set by Supabase
  //         name: aiReadyData.product_name || 'Untitled Product',
  //         description: aiReadyData.description || 'No description',
  //         createdAt: new Date().toISOString(),
  //         formData: aiReadyData,
  //         analysis: scraperResponse.data.analysis,
  //         googleOverviewAnalysis: googleScraperResponse?.data.analysis,
  //       };

  //       let savedProductId: string | null = null;
  //       if (currentProductId) {
  //         // Existing product: update with latest analysis
  //         await updateProductInSupabase(currentProductId, user!.id);
  //         savedProductId = currentProductId;
  //       } else {
  //         // New product: create in Supabase
  //         savedProductId = await saveProductToSupabase(productToSave, user!.id, generatedQuery);
  //         if (savedProductId) {
  //           setCurrentProductId(savedProductId);
  //         }
  //       }

  //       // Navigate based on the pipeline
  //       if (runPerplexity && runGoogle) {
  //         // When both are running, prioritize Perplexity results
  //         router.push('/results');
  //       } else if (runPerplexity) {
  //         router.push('/results');
  //       } else if (runGoogle) {
  //         router.push('/results/google');
  //       }

  //       // Update snapshot status to completed after successful analysis
  //       await updateSnapshotStatus(snapshotId, 'completed');

  //   } catch (analysisError) {
  //     console.error('Analysis error:', analysisError);
  //     // Update snapshot status to failed if an error occurs during analysis
  //     await updateSnapshotStatus(snapshotId, 'failed');
  //     const friendly = 'A server error occurred while analyzing your product. Please check your internet connection and try again. If the issue persists, please contact the provider.';
  //     const msg = (analysisError instanceof Error && analysisError.message && analysisError.message.trim().length > 0)
  //       ? `${friendly}\n\nDetails: ${analysisError.message}`
  //       : friendly;
  //     setAnalysisError(msg);
  //   } finally {
  //     setIsAnalyzing(false);
  //   }
  // };

  const loadDummyData = () => {
    // Reset to original scraped data if available, otherwise clear the form
    if (originalScrapedData) {
      // Create a deep copy of the original scraped data to avoid reference issues
      const resetData = JSON.parse(JSON.stringify(originalScrapedData));
      setFormData(resetData);
      console.log("Reset to original scraped data");
    } else {
      const emptyData = createEmptyProductFormData();
      setFormData(emptyData);
      console.log("Reset to blank form state");
    }
  };

  const prepareDataForAI = (data: ProductFormData) => {
    // This function ensures we're using the current form data, not the dummy data
    // and formats it properly for AI processing
    return {
      url: data.url,
      product_name: data.product_name,
      description: data.description,
      specifications: data.specifications,
      features: data.features.filter(feature => feature.name.trim() !== ''),
      targeted_market: data.targeted_market,
      problem_product_is_solving: data.problem_product_is_solving,
      general_product_type: data.general_product_type || '',
      specific_product_type: data.specific_product_type || ''
    };
  };

  const handleGenerateQueryOnly = async () => {
    // Check authentication
    if (!user) {
      setServerError('Please sign in to generate queries');
      router.push('/auth');
      return;
    }

    // Prepare the current form data for query generation
    const aiReadyData = prepareDataForAI(formData);

    try {
      const queryResult = await generateQueryFromData(aiReadyData);

      if (!queryResult) {
        // Query generation failed - error already set by generateQueryFromData
        return;
      }

      // Successfully generated queries, now switch to Generated Query section
      setActiveSection('query');
      setSelectedBatchId(null);
      await loadQueryBatches();
      console.log('Queries generated successfully, switched to Generated Query section');

    } catch (error) {
      console.error('Query generation error:', error);
      setServerError('Failed to generate queries. Please try again.');
    }
  };

  const handleGenerateNewBatch = async () => {
    if (!user || !currentProductId) return;

    setGenerateBatchModalOpen(false);
    setIsGeneratingQuery(true);
    setQueryGenerationError(null);

    try {
      const response = await fetch('/api/generate-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId: currentProductId,
          batchName: newBatchName.trim() || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate batch');
      }

      const { batch } = await response.json();

      // Refresh batches list
      await loadQueryBatches();

      // Select the new batch and load its queries
      if (batch?.id) {
        // We must load queries immediately so the UI reflects the new batch's content
        // otherwise it will show the previous batch's queries with the new batch ID
        await loadQueriesForBatch(batch.id);
        setSelectedBatchId(batch.id);
      }

    } catch (error: any) {
      console.error('Error generating new batch:', error);
      setQueryGenerationError(error.message || 'Failed to generate new batch');
    } finally {
      setIsGeneratingQuery(false);
      setNewBatchName(""); // Reset input
    }
  };

  const handleDeleteBatch = async (batchId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    if (!user || !confirm("Are you sure you want to delete this batch?")) return;

    setIsDeletingBatch(batchId);
    try {
      const response = await fetch(`/api/query-batches?batchId=${batchId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete batch');
      }

      // Refresh list
      await loadQueryBatches();
      if (selectedBatchId === batchId) {
        setSelectedBatchId(null);
        setAllPerplexityQueries([]);
        setAllGoogleQueries([]);
      }
    } catch (error: any) {
      console.error('Error deleting batch:', error);
      alert(error.message); // Simple alert
    } finally {
      setIsDeletingBatch(null);
    }
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   // Check authentication
  //   if (!user) {
  //     setServerError('Please sign in to analyze products');
  //     router.push('/auth');
  //     return;
  //   }

  //   // Check credits availability before starting (without deducting)
  //   const analysisMode = getAnalysisMode();
  //   const requiredCredits = analysisMode === 'all' ? 2 : 1;
  //   try {
  //     const creditCheckResponse = await fetch('/api/analyze/check-credits', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         userId: user.id,
  //         creditsRequired: requiredCredits,
  //       }),
  //     });

  //     const creditCheckData = await creditCheckResponse.json();

  //     if (!creditCheckData.hasEnoughCredits) {
  //       setServerError(`Insufficient credits. Required: ${requiredCredits}, Available: ${creditCheckData.currentCredits}. Please purchase more credits to continue.`);
  //       return;
  //     }
  //     if (typeof creditCheckData.currentCredits === 'number') {
  //       setUserCredits(creditCheckData.currentCredits);
  //     }

  //     console.log('Credit check passed, proceeding with analysis');
  //   } catch (creditError) {
  //     console.error('Credit check error:', creditError);
  //     setServerError('Failed to verify credits. Please try again.');
  //     return;
  //   }

  //   // Part 0: Create analysis snapshot before starting analysis
  //   let snapshotId: string | null = null;
  //   if (process.env.NODE_ENV !== 'production') {
  //     console.log('[Snapshot Debug] Checking conditions:', {
  //       selectedBatchId,
  //       currentProductId,
  //       hasBatch: !!selectedBatchId,
  //       hasProduct: !!currentProductId
  //     });
  //   }

  //   if (selectedBatchId && currentProductId) {
  //     try {
  //       if (process.env.NODE_ENV !== 'production') {
  //         console.log('[Snapshot Debug] Creating snapshot with:', {
  //           productId: currentProductId,
  //           batchId: selectedBatchId
  //         });
  //       }
  //       snapshotId = await createAnalysisSnapshot(currentProductId, selectedBatchId);
  //       setCurrentSnapshotId(snapshotId);
  //       console.log('[Snapshot] Snapshot created:', snapshotId);
  //     } catch (snapshotError: any) {
  //       console.error('[Snapshot] Failed to create snapshot:', snapshotError);
  //       setServerError(snapshotError.message || 'Failed to initialize analysis tracking. Please try again.');
  //       return;
  //     }
  //   } else {
  //     if (process.env.NODE_ENV !== 'production') {
  //       console.log('[Snapshot Debug] Skipping snapshot creation - missing conditions:', {
  //         selectedBatchId,
  //         currentProductId,
  //         reason: !selectedBatchId ? 'No batch selected' : !currentProductId ? 'No current product' : 'Unknown'
  //       });
  //     }
  //   }

  //   // Prepare the current form data for AI workflow
  //   const aiReadyData = prepareDataForAI(formData);

  //   console.log("Form submitted with current user data:", formData);
  //   console.log("Data prepared for AI workflow:", aiReadyData);

  //   // Generate a per-run analysisId for token aggregation/logging
  //   const analysisId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
  //     ? crypto.randomUUID()
  //     : Math.random().toString(36).slice(2);

  //   // Part 1: Generate search query from the product data
  //   setIsGeneratingQuery(true);
  //   setQueryGenerationError(null);
  //   setServerError(null);

  //   try {
  //     const queryResult = await generateQueryFromData(aiReadyData, analysisId);

  //     if (!queryResult) {
  //       // Query generation failed - error already set by generateQueryFromData
  //       setIsGeneratingQuery(false);
  //       return;
  //     }

  //     // Handle both single query (string) and dual query (object) cases
  //     const isDualQuery = typeof queryResult === 'object' && 'perplexityQuery' in queryResult;
  //     const perplexityQuery = isDualQuery 
  //       ? (queryResult as { perplexityQuery: string | null; googleQuery: string | null }).perplexityQuery
  //       : (queryResult as string);
  //     const googleQuery = isDualQuery
  //       ? (queryResult as { perplexityQuery: string | null; googleQuery: string | null }).googleQuery
  //       : (queryResult as string);

  //     // Set the primary query for display (prefer Perplexity if available)
  //     const primaryQuery = perplexityQuery || googleQuery || '';
  //     if (!primaryQuery) {
  //       setQueryGenerationError('Failed to generate a valid search query');
  //       setIsGeneratingQuery(false);
  //       return;
  //     }

  //     console.log("Generated query for optimization:", primaryQuery);

  //     // Persist both queries in a structured JSON string for Supabase and results pages
  //     const generatedQueriesPayload = JSON.stringify({
  //       perplexityQuery: perplexityQuery ? [perplexityQuery] : [],
  //       googleQuery: googleQuery ? [googleQuery] : [],
  //     });

  //     setGeneratedQuery(generatedQueriesPayload);

  //     // Part 2.1: Call the selected scraper APIs
  //     setIsAnalyzing(true);
  //     setAnalysisError(null);

  //     try {
  //       const runPerplexity = analysisMode === 'perplexity' || analysisMode === 'all';
  //       const runGoogle = analysisMode === 'google_overview' || analysisMode === 'all';

  //       let perplexityScraperResponse: any | null = null;
  //       let googleScraperResponse: any | null = null;

  //       if (runPerplexity && runGoogle) {
  //         // Use pipeline-specific queries when both are running
  //         const perplexityQueryToUse = perplexityQuery || primaryQuery;
  //         const googleQueryToUse = googleQuery || primaryQuery;

  //         console.log("Using Perplexity-optimized query:", perplexityQueryToUse);
  //         console.log("Using Google-optimized query:", googleQueryToUse);

  //         try {
  //           const [perplexityResult, googleResult] = await Promise.all([
  //             callPerplexityScraper(perplexityQueryToUse, selectedLocation),
  //             callAIScraper(googleQueryToUse, selectedLocation),
  //           ]);
  //           perplexityScraperResponse = perplexityResult;
  //           googleScraperResponse = googleResult;
  //         } catch (error: any) {
  //           console.error('Scraper API call failed:', error);
  //           setServerError(
  //             'We apologize for the inconvenience. Our AI search service encountered an issue while gathering competitor data. ' +
  //             'This may be due to temporary service limitations or rate limits. Please try again in a few moments. ' +
  //             'Your credits have not been deducted.'
  //           );
  //           await updateSnapshotStatus(currentSnapshotId, 'failed');
  //           setIsAnalyzing(false);
  //           setIsGeneratingQuery(false);
  //           return;
  //         }
  //       } else if (runPerplexity) {
  //         const queryToUse = perplexityQuery || primaryQuery;
  //         try {
  //           perplexityScraperResponse = await callPerplexityScraper(queryToUse, selectedLocation);
  //         } catch (error: any) {
  //           console.error('Perplexity scraper failed:', error);
  //           setServerError(
  //             'We apologize for the inconvenience. Our Perplexity AI search service encountered an issue while gathering competitor data. ' +
  //             'This may be due to temporary service limitations or rate limits. Please try again in a few moments. ' +
  //             'Your credits have not been deducted.'
  //           );
  //           await updateSnapshotStatus(currentSnapshotId, 'failed');
  //           setIsAnalyzing(false);
  //           setIsGeneratingQuery(false);
  //           return;
  //         }
  //       } else if (runGoogle) {
  //         const queryToUse = googleQuery || primaryQuery;
  //         try {
  //           googleScraperResponse = await callAIScraper(queryToUse, selectedLocation);
  //         } catch (error: any) {
  //           console.error('Google scraper failed:', error);
  //           setServerError(
  //             'We apologize for the inconvenience. Our Google AI Overview service encountered an issue while gathering competitor data. ' +
  //             'This may be due to temporary service limitations or rate limits. Please try again in a few moments. ' +
  //             'Your credits have not been deducted.'
  //           );
  //           await updateSnapshotStatus(currentSnapshotId, 'failed');
  //           setIsAnalyzing(false);
  //           setIsGeneratingQuery(false);
  //           return;
  //         }
  //       }

  //         const scraperResponse = perplexityScraperResponse || googleScraperResponse;
  //         console.log("Scraper response:", scraperResponse);

  //         // Store raw source links from primary scraper (Perplexity preferred)
  //         if (scraperResponse.source_links && Array.isArray(scraperResponse.source_links)) {
  //           setSourceLinks(scraperResponse.source_links);
  //           console.log(`[Source Links] Stored ${scraperResponse.source_links.length} raw source links`);
  //         }

  //         // Part 2.2: Run strategic analysis for selected engines (and sources for Perplexity)
  //         const analysisPromises: Promise<Response | null>[] = [];

  //         let perplexityAnalysisIndex: number | null = null;
  //         let googleAnalysisIndex: number | null = null;
  //         let sourcesIndex: number | null = null;

  //         if (runPerplexity && perplexityScraperResponse) {
  //           perplexityAnalysisIndex = analysisPromises.length;
  //           analysisPromises.push(
  //             fetch('/api/strategic-analysis', {
  //               method: 'POST',
  //               headers: {
  //                 'Content-Type': 'application/json',
  //               },
  //               body: JSON.stringify({
  //                 aiSearchJson: perplexityScraperResponse,
  //                 clientProductJson: aiReadyData,
  //                 analysisId,
  //                 pipeline: 'perplexity',
  //               }),
  //             })
  //           );

  //           sourcesIndex = analysisPromises.length;
  //           analysisPromises.push(
  //             fetch('/api/process-sources', {
  //               method: 'POST',
  //               headers: {
  //                 'Content-Type': 'application/json',
  //               },
  //               body: JSON.stringify({
  //                 sourceLinks: perplexityScraperResponse.source_links || [],
  //                 analysisId,
  //                 pipeline: 'perplexity',
  //               }),
  //             })
  //           );
  //         }

  //         if (runGoogle && googleScraperResponse) {
  //           googleAnalysisIndex = analysisPromises.length;
  //           analysisPromises.push(
  //             fetch('/api/strategic-analysis', {
  //               method: 'POST',
  //               headers: {
  //                 'Content-Type': 'application/json',
  //               },
  //               body: JSON.stringify({
  //                 aiSearchJson: googleScraperResponse,
  //                 clientProductJson: aiReadyData,
  //                 analysisId,
  //                 pipeline: 'google_overview',
  //               }),
  //             })
  //           );
  //         }

  //         const results = await Promise.all(analysisPromises);

  //         const getResponse = (index: number | null): Response | null =>
  //           index !== null ? (results[index] as Response) : null;

  //         const perplexityAnalysisResponse = getResponse(perplexityAnalysisIndex);
  //         const sourcesResponse = getResponse(sourcesIndex);
  //         const googleAnalysisResponse = getResponse(googleAnalysisIndex);

  //         // Process sources result (Perplexity only for now)
  //         if (sourcesResponse && sourcesResponse.ok) {
  //           try {
  //             const sourcesData = await sourcesResponse.json();
  //             if (sourcesData.success && sourcesData.sources) {
  //               setProcessedSources(sourcesData.sources);
  //               console.log(`[Process Sources] Stored ${sourcesData.sources.length} processed sources`);
  //             }
  //           } catch (sourcesError) {
  //             console.error('[Process Sources] Failed to parse response:', sourcesError);
  //             // Don't fail the entire flow if source processing fails
  //           }
  //         } else if (sourcesResponse) {
  //           console.error('[Process Sources] API call failed:', sourcesResponse.status);
  //           // Don't fail the entire flow if source processing fails
  //         }

  //         let primaryAnalysis: OptimizationAnalysis | null = null;
  //         let perplexityAnalysis: OptimizationAnalysis | null = null;
  //         let googleAnalysis: OptimizationAnalysis | null = null;

  //         if (perplexityAnalysisResponse) {
  //           if (!perplexityAnalysisResponse.ok) {
  //             const analysisError = await perplexityAnalysisResponse.json();
  //             const userMessage = analysisError.error || 'Failed to perform strategic analysis';
  //             console.error('Perplexity strategic analysis failed:', analysisError);
  //             throw new Error(userMessage);
  //           }
  //           const perplexityData = await perplexityAnalysisResponse.json();
  //           if (!perplexityData || typeof perplexityData !== 'object') {
  //             throw new Error('Received invalid Perplexity analysis data from server');
  //           }
  //           console.log('Perplexity strategic analysis completed:', perplexityData);
  //           setOptimizationAnalysis(perplexityData);
  //           perplexityAnalysis = perplexityData as OptimizationAnalysis;
  //           primaryAnalysis = perplexityAnalysis;
  //           setAnalysisError(null); // Clear analysisError after successful analysis
  //         }

  //         if (googleAnalysisResponse) {
  //           try {
  //             if (googleAnalysisResponse.ok) {
  //               const googleData = await googleAnalysisResponse.json();
  //               console.log('Google AI Overview strategic analysis completed:', googleData);
  //               setGoogleOverviewAnalysis(googleData);
  //               googleAnalysis = googleData as OptimizationAnalysis;
  //               if (!primaryAnalysis) {
  //                 primaryAnalysis = googleAnalysis;
  //               }
  //             } else {
  //               const googleError = await googleAnalysisResponse.json().catch(() => null);
  //               console.error('Google AI Overview strategic analysis failed:', {
  //                 status: googleAnalysisResponse.status,
  //                 error: googleError,
  //               });
  //             }
  //           } catch (googleAnalysisParseError) {
  //             console.error('Failed to handle Google AI Overview strategic analysis response:', googleAnalysisParseError);
  //           }
  //         }

  //         if (!primaryAnalysis) {
  //           throw new Error('No successful analysis results were produced');
  //         }

  //         // Deduct credits only after successful analysis
  //         try {
  //           const creditResponse = await fetch('/api/analyze', {
  //             method: 'POST',
  //             headers: { 'Content-Type': 'application/json' },
  //             body: JSON.stringify({
  //               userId: user.id,
  //               creditsRequired: requiredCredits,
  //             }),
  //           });

  //           const creditData = await creditResponse.json();

  //           if (!creditData.success) {
  //             console.error('Failed to deduct credits after successful analysis');
  //             // Don't block the user from seeing results, just log the error
  //           } else {
  //             console.log('Credit deducted successfully after analysis completion');
  //             adjustUserCredits(-requiredCredits);
  //           }
  //         } catch (creditError) {
  //           console.error('Credit deduction error after analysis:', creditError);
  //           // Don't block the user from seeing results
  //         }

  //         // Persist the analysis result as a product, keeping Perplexity and Google separate
  //         const productRecord = createProductRecord(perplexityAnalysis, googleAnalysis);
  //         addProduct(productRecord);

  //         // Save to Supabase if user is authenticated
  //         let savedGoogleAnalysisId: string | null = null;
  //         let savedPerplexityAnalysisId: string | null = null;
  //         if (user) {
  //           try {
  //             let savedProductId: string | null = null;
  //             if (currentProductId) {
  //               // Existing product: update with latest state
  //               await updateProductInSupabase(currentProductId, user.id);
  //               savedProductId = currentProductId;
  //             } else {
  //               // New product: create in Supabase
  //               savedProductId = await saveProductToSupabase(productRecord, user.id, generatedQueriesPayload);
  //               console.log('Product saved to Supabase successfully with ID:', savedProductId);
  //               if (savedProductId) {
  //                 setCurrentProductId(savedProductId);
  //               }
  //             }

  //             // Also persist this specific analysis run into the split analysis tables for history
  //             if (savedProductId) {
  //               try {
  //                 const boundedPerplexityQueries = selectedPerplexityQueries
  //                   .map((q) => (typeof q === 'string' ? q.trim() : ''))
  //                   .filter((q) => q.length > 0)
  //                   .slice(0, maxPerplexityQueries);
  //                 const boundedGoogleQueries = selectedGoogleQueries
  //                   .map((q) => (typeof q === 'string' ? q.trim() : ''))
  //                   .filter((q) => q.length > 0)
  //                   .slice(0, maxGoogleQueries);

  //                 const serializedPerplexity = serializeQueriesForHistory(boundedPerplexityQueries);
  //                 const serializedGoogle = serializeQueriesForHistory(boundedGoogleQueries);

  //                 if (String(process.env.NODE_ENV) === 'debug' && process.env.NODE_ENV !== 'production') {
  //                   console.log('[DEBUG][product-analyses] handleSubmit save', {
  //                     product_id: savedProductId,
  //                     boundedPerplexityQueries,
  //                     boundedGoogleQueries,
  //                     serializedPerplexity,
  //                     serializedGoogle,
  //                   });
  //                 }

  //                 const analysisResponse = await fetch('/api/product-analyses', {
  //                   method: 'POST',
  //                   headers: { 'Content-Type': 'application/json' },
  //                   body: JSON.stringify({
  //                     product_id: savedProductId,
  //                     optimization_query: serializedPerplexity,
  //                     google_search_query: serializedGoogle,
  //                     optimization_analysis: perplexityAnalysis || null,
  //                     google_overview_analysis: googleAnalysis || null,
  //                     combined_analysis:
  //                       perplexityAnalysis && googleAnalysis
  //                         ? { perplexity: perplexityAnalysis, google: googleAnalysis }
  //                         : null,
  //                     source_links: productRecord.sourceLinks || [],
  //                     processed_sources: productRecord.processedSources || [],
  //                     snapshot_id: currentSnapshotId,
  //                   }),
  //                 });

  //                 if (analysisResponse.ok) {
  //                   const analysisData = await analysisResponse.json();
  //                   savedGoogleAnalysisId = analysisData.googleAnalysis?.id || analysisData.analysis?.google_analysis_id || null;
  //                   savedPerplexityAnalysisId = analysisData.perplexityAnalysis?.id || analysisData.analysis?.perplexity_analysis_id || null;
  //                   console.log('Analysis saved to product_analysis tables with IDs:', {
  //                     google: savedGoogleAnalysisId,
  //                     perplexity: savedPerplexityAnalysisId,
  //                   });
  //                   // Update snapshot status to completed after successful save
  //                   await updateSnapshotStatus(currentSnapshotId, 'completed');
  //                 }
  //               } catch (analysisSaveError) {
  //                 console.error('Failed to save analysis history to product_analysis tables:', analysisSaveError);
  //                 // Update snapshot status to failed if save fails
  //                 await updateSnapshotStatus(currentSnapshotId, 'failed');
  //                 // Do not block user from seeing results if history save fails
  //               }
  //             }

  //             // Update analysis_history with product_id and available analysis IDs from the split tables
  //             if (savedProductId) {
  //               try {
  //                 await fetch('/api/analyze/update-history', {
  //                   method: 'POST',
  //                   headers: { 'Content-Type': 'application/json' },
  //                   body: JSON.stringify({
  //                     userId: user.id,
  //                     productId: savedProductId,
  //                     googleAnalysisId: savedGoogleAnalysisId,
  //                     perplexityAnalysisId: savedPerplexityAnalysisId,
  //                     snapshot_id: currentSnapshotId,
  //                   }),
  //                 });
  //                 console.log('Analysis history updated with product_id, split analysis IDs, and snapshot_id');
  //               } catch (historyError) {
  //                 console.error('Failed to update analysis history:', historyError);
  //               }
  //             }
  //           } catch (saveError) {
  //             console.error('Failed to save product to Supabase:', saveError);
  //             // Don't block navigation on save failure
  //           }
  //         }

  //         // Route based on which engines ran: Perplexity (including "all") goes to /results; Google-only goes to /results/google
  //         const ranPerplexity = analysisMode === 'perplexity' || analysisMode === 'all';
  //         router.push(ranPerplexity ? "/results" : "/results/google");

  //       } catch (error: any) {
  //         console.error('Analysis error:', error);

  //         // Update snapshot status to failed if an error occurs during analysis
  //         await updateSnapshotStatus(currentSnapshotId, 'failed');

  //         // Enhanced error categorization and user feedback
  //         if (error?.name === 'ScraperError') {
  //           setAnalysisError(error.message || 'Our scraper service was unable to retrieve competitor data. Please review the URL or retry in a moment.');
  //         } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || !navigator.onLine) {
  //           setServerError('Unable to connect to the analysis server. Please check your internet connection and try again.');
  //           router.push("/results");
  //         } else if (error.message.includes('timeout') || error.name === 'TimeoutError') {
  //           setAnalysisError('The analysis is taking longer than expected. This usually happens with complex products. Please try again.');
  //           router.push("/results");
  //         } else if (error.message.includes('AI analysis service')) {
  //           // User-friendly message for parsing errors
  //           setAnalysisError('We encountered a temporary issue processing your analysis. Our system has logged this error. Please try again in a moment.');
  //           router.push("/results");
  //         } else {
  //           // Generic fallback with helpful context
  //           const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during analysis';
  //           setAnalysisError(`${errorMessage}. If this persists, please contact support with your product URL.`);
  //           router.push("/results");
  //         }
  //       } finally {
  //         setIsAnalyzing(false);
  //       }
  //   } catch (error) {
  //     // This catch handles any unexpected errors in handleSubmit
  //     console.error('Unexpected error in handleSubmit:', error);
  //     setServerError('An unexpected error occurred. Please try again.');
  //     setIsGeneratingQuery(false);
  //     setIsAnalyzing(false);
  //   }
  // };

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
          py: 2,
          px: 4,
          boxShadow: "0 20px 44px rgba(2, 4, 7, 0.6)",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          "&:hover": {
            border: `1px solid ${borderColorHover}`,
            borderBottom: `1px solid ${borderColorHover}`,
            boxShadow: "0 24px 60px rgba(2, 4, 7, 0.65)",
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box component="img" src="/GodsEye.png" alt="GodsEye logo" sx={{ width: 22, height: 22 }} />
          <Typography level="h4" sx={{ color: textPrimary, fontWeight: 600 }}>
            GodsEye
          </Typography>
          {currentProductId && (() => {
            const currentProduct = products.find(p => p.id === currentProductId);
            return currentProduct?.name ? (
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(13, 15, 20, 0.6)',
                border: `1px solid ${borderColor}`,
                borderRadius: '8px',
                ml: 2,
                overflow: 'hidden'
              }}>
                <Box sx={{ px: 2, py: 0.5, backgroundColor: 'rgba(46, 212, 122, 0.08)', borderRight: `1px solid ${borderColor}` }}>
                  <Typography level="body-sm" sx={{ color: textSecondary, fontWeight: 500 }}>
                    {currentProduct.name}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', px: 1.5, py: 0.5, gap: 1 }}>
                  <Typography level="body-xs" sx={{ color: 'rgba(162, 167, 180, 0.6)', fontFamily: 'monospace' }}>
                    {currentProduct.id}
                  </Typography>
                  <Button
                    variant="plain"
                    color="neutral"
                    size="sm"
                    onClick={() => {
                      if (currentProduct.id) {
                        void navigator.clipboard.writeText(currentProduct.id);
                        setIsHeaderProductIdCopied(true);
                        setTimeout(() => setIsHeaderProductIdCopied(false), 2000);
                      }
                    }}
                    sx={{
                      minHeight: 20,
                      p: 0.5,
                      lineHeight: 0,
                      color: isHeaderProductIdCopied ? 'success.500' : 'rgba(162, 167, 180, 0.5)',
                      '&:hover': {
                        color: isHeaderProductIdCopied ? 'success.600' : textPrimary,
                        backgroundColor: 'transparent'
                      }
                    }}
                  >
                    {isHeaderProductIdCopied ? (
                      <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />
                    ) : (
                      <ContentCopyIcon sx={{ fontSize: 14 }} />
                    )}
                  </Button>
                </Box>
              </Box>
            ) : null;
          })()}
        </Box>
        <Button
          type="button"
          variant="outlined"
          color="neutral"
          size="sm"
          onClick={handleBackToDashboard}
          disabled={isNavigatingBack}
          startDecorator={isNavigatingBack ? <CircularProgress size="sm" thickness={5} sx={{ color: "#2ED47A" }} /> : null}
          sx={{
            opacity: isNavigatingBack ? 0.7 : 1,
            cursor: isNavigatingBack ? "not-allowed" : "pointer"
          }}
        >
          {isNavigatingBack ? "Loading..." : "Back to Dashboard"}
        </Button>
      </Sheet>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          width: "100%",
          mt: { xs: 10, md: 12 },
          px: { xs: 2, md: 5 },
          pb: 6,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: { xs: 3, md: 4 },
        }}
      >
        <Card
          variant="outlined"
          sx={{
            width: { xs: "100%", md: 260 },
            backgroundColor: surfaceRaised,
            border: `1px solid ${borderColor}`,
            boxShadow: "0 18px 40px rgba(2, 4, 7, 0.5)",
            position: "sticky",
            top: 96,
            height: "fit-content",
          }}
        >
          <Typography level="title-md" sx={{ mb: 2, color: textPrimary }}>
            Views
          </Typography>
          <Stack spacing={1.5}>
            <Button
              type="button"
              variant={activeSection === "product" ? "solid" : "outlined"}
              color="neutral"
              onClick={() => {
                setActiveSection("product");
                setShowSOVCards(false);
                setShowDeepAnalysis(false);
              }}
              sx={{
                backgroundColor: activeSection === "product" ? accentColor : "transparent",
                color: activeSection === "product" ? "#0D0F14" : textPrimary,
                borderColor: activeSection === "product" ? "rgba(46, 212, 122, 0.45)" : borderColor,
                fontWeight: 600,
                transition: "all 0.2s ease",
                borderRadius: "999px",
                "&:hover": {
                  backgroundColor: activeSection === "product" ? "#26B869" : accentSoft,
                  color: activeSection === "product" ? "#0D0F14" : textPrimary,
                  borderColor: "rgba(46, 212, 122, 0.45)",
                  boxShadow: "0 6px 20px rgba(46, 212, 122, 0.18)",
                },
              }}
            >
              Product Data
            </Button>
            <Button
              type="button"
              variant={activeSection === "query" ? "solid" : "outlined"}
              color="neutral"
              onClick={() => {
                setActiveSection("query");
                setSelectedBatchId(null);
                setShowSOVCards(false);
                setShowDeepAnalysis(false);
              }}
              sx={{
                backgroundColor: activeSection === "query" ? accentColor : "transparent",
                color: activeSection === "query" ? "#0D0F14" : textPrimary,
                borderColor: activeSection === "query" ? "rgba(46, 212, 122, 0.45)" : borderColor,
                fontWeight: 600,
                transition: "all 0.2s ease",
                borderRadius: "999px",
                "&:hover": {
                  backgroundColor: activeSection === "query" ? "#26B869" : accentSoft,
                  color: activeSection === "query" ? "#0D0F14" : textPrimary,
                  borderColor: "rgba(46, 212, 122, 0.45)",
                  boxShadow: "0 6px 20px rgba(46, 212, 122, 0.18)",
                },
              }}
            >
              Generated Query
            </Button>
            <Button
              type="button"
              variant={activeSection === "perplexity" ? "solid" : "outlined"}
              color="neutral"
              onClick={() => {
                setActiveSection("perplexity");
                setSovCardEngine('perplexity');
                setShowSOVCards(true);
                setShowDeepAnalysis(false);
              }}
              sx={{
                backgroundColor: activeSection === "perplexity" ? accentColor : "transparent",
                color: activeSection === "perplexity" ? "#0D0F14" : textPrimary,
                borderColor: activeSection === "perplexity" ? "rgba(46, 212, 122, 0.45)" : borderColor,
                fontWeight: 600,
                minWidth: '220px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                px: 3,
                transition: "all 0.2s ease",
                borderRadius: "999px",
                "&:hover": {
                  backgroundColor: activeSection === "perplexity" ? "#26B869" : accentSoft,
                  color: activeSection === "perplexity" ? "#0D0F14" : textPrimary,
                  borderColor: "rgba(46, 212, 122, 0.45)",
                  boxShadow: "0 6px 20px rgba(46, 212, 122, 0.18)",
                },
              }}
            >
              Perplexity Search Analysis
            </Button>
            <Button
              type="button"
              variant={activeSection === "google" ? "solid" : "outlined"}
              color="neutral"
              onClick={() => {
                setActiveSection("google");
                setSovCardEngine('google');
                setShowSOVCards(true);
                setShowDeepAnalysis(false);
              }}
              sx={{
                backgroundColor: activeSection === "google" ? accentColor : "transparent",
                color: activeSection === "google" ? "#0D0F14" : textPrimary,
                borderColor: activeSection === "google" ? "rgba(46, 212, 122, 0.45)" : borderColor,
                fontWeight: 600,
                minWidth: '220px',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                px: 3,
                borderRadius: '999px',
                "&:hover": {
                  backgroundColor: activeSection === "google" ? "#26B869" : accentSoft,
                  color: activeSection === "google" ? "#0D0F14" : textPrimary,
                  borderColor: "rgba(46, 212, 122, 0.45)",
                  boxShadow: "0 6px 20px rgba(46, 212, 122, 0.18)",
                },
              }}
            >
              Google Overview Analysis
            </Button>
            <Tooltip title="Coming Soon" placement="top" arrow>
              <span>
                <Button
                  type="button"
                  variant="outlined"
                  color="neutral"
                  disabled
                  sx={{
                    backgroundColor: "transparent",
                    color: textSecondary,
                    borderColor: borderColor,
                    fontWeight: 600,
                    minWidth: '220px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    px: 3,
                    borderRadius: '999px',
                  }}
                >
                  Chatgpt Analysis
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Coming Soon" placement="top" arrow>
              <span>
                <Button
                  type="button"
                  variant="outlined"
                  color="neutral"
                  disabled
                  sx={{
                    backgroundColor: "transparent",
                    color: textSecondary,
                    borderColor: borderColor,
                    fontWeight: 600,
                    minWidth: '220px',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    px: 3,
                    borderRadius: '999px',
                  }}
                >
                  Gemini Analysis
                </Button>
              </span>
            </Tooltip>
          </Stack>
        </Card>

        {/* Product Data Section */}
        {activeSection === "product" && (
          <Card
            variant="outlined"
            sx={{
              flex: 1,
              p: 4,
              mb: 4,
              backgroundColor: surfaceBase,
              border: `1px solid ${borderColor}`,
              boxShadow: "0 24px 60px rgba(2, 4, 7, 0.55)",
            }}
          >
            <Box sx={{ mb: 3, display: "flex", alignItems: "center", justifyContent: "center", gap: 1.25 }}>
              <Typography level="h2" sx={{ color: textPrimary }}>
                Optimize Your Product for AI Search Engines
              </Typography>
              {hasFormBlockingMissing && (
                <Button
                  type="button"
                  size="sm"
                  variant="outlined"
                  onClick={handleShowWarning}
                  sx={{
                    borderColor: "rgba(255, 193, 7, 0.45)",
                    color: "#FFD166",
                    px: 1.5,
                    minHeight: 32,
                    "&:hover": {
                      borderColor: "rgba(255, 193, 7, 0.65)",
                      backgroundColor: "rgba(255, 193, 7, 0.12)",
                    },
                  }}
                >
                  Missing Info
                </Button>
              )}
            </Box>
            <Typography level="body-md" sx={{ mb: 4, textAlign: "center", color: textSecondary }}>
              Help your product get discovered by AI search engines like Perplexity, Google AI Overview, and ChatGPT
            </Typography>

            {isClient && (
              <form onSubmit={(e) => {
                e.preventDefault();
                handleGenerateQueryOnly();
              }}>
                {/* Input Mode Toggle */}
                <Box sx={{ mb: 4 }}>
                  <FormLabel sx={{ fontWeight: 600, mb: 2, display: "block", color: "#ffffff" }}>
                    Input Method
                  </FormLabel>
                  <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <Button
                      variant={inputMode === 'url' ? 'solid' : 'outlined'}
                      onClick={() => setInputMode('url')}
                      sx={{
                        flex: 1,
                        backgroundColor: inputMode === 'url' ? '#2ED47A' : 'transparent',
                        borderColor: 'rgba(46, 212, 122, 0.3)',
                        color: inputMode === 'url' ? '#0D0F14' : '#2ED47A',
                        '&:hover': {
                          backgroundColor: inputMode === 'url' ? '#26B869' : 'rgba(46, 212, 122, 0.1)',
                        }
                      }}
                    >
                      🌐 URL Input
                    </Button>
                    <Button
                      variant={inputMode === 'text' ? 'solid' : 'outlined'}
                      onClick={() => setInputMode('text')}
                      sx={{
                        flex: 1,
                        backgroundColor: inputMode === 'text' ? '#2ED47A' : 'transparent',
                        borderColor: 'rgba(46, 212, 122, 0.3)',
                        color: inputMode === 'text' ? '#0D0F14' : '#2ED47A',
                        '&:hover': {
                          backgroundColor: inputMode === 'text' ? '#26B869' : 'rgba(46, 212, 122, 0.1)',
                        }
                      }}
                    >
                      📝 Text Input
                    </Button>
                  </Stack>
                </Box>

                {/* Conditional Input Section */}
                {inputMode === 'url' ? (
                  <Box sx={{ mb: 4 }}>
                    <FormLabel sx={{ fontWeight: 600, mb: 1, display: "block", color: "#ffffff" }}>
                      Product URL
                    </FormLabel>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={2}
                      alignItems={{ xs: "stretch", md: "center" }}
                    >
                      <Input
                        placeholder="https://example.com/your-product"
                        value={formData.url}
                        onChange={(e) => handleInputChange("url", e.target.value)}
                        size="md"
                        sx={{
                          flex: 1,
                          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.02), rgba(79, 70, 229, 0.01))",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(216, 180, 254, 0.08)",
                          minHeight: 44,
                          "&:focus-within": {
                            border: "1px solid rgba(216, 180, 254, 0.15)",
                            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.04), rgba(79, 70, 229, 0.02))",
                          },
                          "& input": {
                            color: "#ffffff",
                            fontSize: "0.95rem",
                            paddingY: 1,
                          },
                          "&::placeholder": {
                            color: "rgba(255, 255, 255, 0.6)",
                          }
                        }}
                      />
                      <Select
                        aria-label="Search Location"
                        value={selectedLocation}
                        onChange={(_, v) => v && setSelectedLocation(v)}
                        size="md"
                        sx={{
                          minWidth: { xs: "100%", md: 140 },
                          minHeight: 44,
                          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.02), rgba(79, 70, 229, 0.01))",
                          border: "1px solid rgba(216, 180, 254, 0.08)",
                          borderRadius: "12px",
                          color: textPrimary,
                          '&:hover': {
                            borderColor: 'rgba(216, 180, 254, 0.15)'
                          },
                        }}
                      >
                        {LOCATION_OPTIONS.map((loc) => (
                          <Option key={loc} value={loc}>{loc}</Option>
                        ))}
                      </Select>
                      <Button
                        type="button"
                        onClick={() => scrapeProductData()}
                        disabled={isScraping || ((inputMode as 'url' | 'text') === 'url' && !formData.url.trim()) || ((inputMode as 'url' | 'text') === 'text' && !productText.trim())}
                        size="md"
                        sx={{
                          minHeight: 44,
                          px: 2.5,
                          fontSize: "0.95rem",
                          borderRadius: "999px",
                          fontWeight: 600,
                          backgroundColor: accentColor,
                          color: "#0D0F14",
                          border: "1px solid rgba(46, 212, 122, 0.32)",
                          boxShadow: "0 8px 24px rgba(46, 212, 122, 0.25)",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            backgroundColor: "#26B869",
                            borderColor: "rgba(46, 212, 122, 0.45)",
                            boxShadow: "0 10px 28px rgba(46, 212, 122, 0.28)",
                          },
                          "&:disabled": {
                            backgroundColor: "rgba(46, 212, 122, 0.28)",
                            borderColor: "rgba(46, 212, 122, 0.18)",
                            color: "rgba(13, 15, 20, 0.7)",
                            boxShadow: "none",
                            cursor: "not-allowed",
                          },
                        }}
                      >
                        {isScraping ? 'Processing...' : (inputMode === 'url' ? 'Fetch Info' : 'Process Text')}
                      </Button>
                    </Stack>

                    {/* Error Display */}
                    {scrapingError && (
                      <Typography
                        level="body-sm"
                        sx={{
                          mt: 1,
                          color: "#f44336",
                          fontSize: "0.875rem"
                        }}
                      >
                        {scrapingError}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  /* Text Input Mode */
                  <Box sx={{ mb: 4 }}>
                    <FormLabel sx={{ fontWeight: 600, mb: 1, display: "block", color: "#ffffff" }}>
                      Product Description
                    </FormLabel>
                    <Textarea
                      placeholder="Paste your product description, features, specifications, and any relevant details here..."
                      value={productText}
                      onChange={(e) => setProductText(e.target.value)}
                      minRows={8}
                      maxRows={15}
                      sx={{
                        background: "linear-gradient(135deg, rgba(139, 92, 246, 0.02), rgba(79, 70, 229, 0.01))",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(216, 180, 254, 0.08)",
                        borderRadius: "12px",
                        color: "#ffffff",
                        fontSize: "0.95rem",
                        "&:focus-within": {
                          border: "1px solid rgba(216, 180, 254, 0.15)",
                          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.04), rgba(79, 70, 229, 0.02))",
                        },
                        "& textarea": {
                          color: "#ffffff",
                          paddingY: 1,
                        },
                        "&::placeholder": {
                          color: "rgba(255, 255, 255, 0.6)",
                        },
                      }}
                    />

                    <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                      <Button
                        type="button"
                        onClick={() => scrapeProductData()}
                        disabled={isScraping || !productText.trim()}
                        size="md"
                        sx={{
                          minHeight: 44,
                          px: 2.5,
                          fontSize: "0.95rem",
                          borderRadius: "999px",
                          fontWeight: 600,
                          backgroundColor: accentColor,
                          color: "#0D0F14",
                          border: "1px solid rgba(46, 212, 122, 0.32)",
                          boxShadow: "0 8px 24px rgba(46, 212, 122, 0.25)",
                          transition: "all 0.2s ease",
                          "&:hover": {
                            backgroundColor: "#26B869",
                            borderColor: "rgba(46, 212, 122, 0.45)",
                            boxShadow: "0 10px 28px rgba(46, 212, 122, 0.28)",
                          },
                          "&:disabled": {
                            backgroundColor: "rgba(46, 212, 122, 0.28)",
                            borderColor: "rgba(46, 212, 122, 0.18)",
                            color: "rgba(13, 15, 20, 0.7)",
                            boxShadow: "none",
                            cursor: "not-allowed",
                          },
                        }}
                      >
                        {isScraping ? 'Processing...' : 'Process Text'}
                      </Button>

                      <Button
                        type="button"
                        onClick={() => setProductText('')}
                        disabled={isScraping}
                        variant="outlined"
                        size="md"
                        sx={{
                          minHeight: 44,
                          px: 2.5,
                          fontSize: "0.95rem",
                          borderRadius: "999px",
                          fontWeight: 600,
                          borderColor: "rgba(216, 180, 254, 0.3)",
                          color: "rgba(255, 255, 255, 0.8)",
                          "&:hover": {
                            backgroundColor: "rgba(216, 180, 254, 0.1)",
                            borderColor: "rgba(216, 180, 254, 0.5)",
                          },
                          "&:disabled": {
                            opacity: 0.5,
                            cursor: "not-allowed",
                          },
                        }}
                      >
                        Clear
                      </Button>

                      <Button
                        component="label"
                        disabled={isScraping}
                        variant="outlined"
                        size="md"
                        sx={{
                          minHeight: 44,
                          px: 2.5,
                          fontSize: "0.95rem",
                          borderRadius: "999px",
                          fontWeight: 600,
                          borderColor: "rgba(46, 212, 122, 0.3)",
                          color: "rgba(255, 255, 255, 0.8)",
                          "&:hover": {
                            backgroundColor: "rgba(46, 212, 122, 0.1)",
                            borderColor: "rgba(46, 212, 122, 0.5)",
                          },
                          "&:disabled": {
                            opacity: 0.5,
                            cursor: "not-allowed",
                          },
                        }}
                      >
                        📁 Upload .txt
                        <input
                          type="file"
                          accept=".txt"
                          onChange={handleFileUpload}
                          style={{ display: 'none' }}
                        />
                      </Button>
                    </Stack>

                    {/* Text Input Helper */}
                    <Typography level="body-sm" sx={{ mt: 2, color: "rgba(255, 255, 255, 0.6)" }}>
                      💡 Tip: Include product name, description, features, specifications, and target audience for best results.
                    </Typography>

                    {/* Error Display */}
                    {scrapingError && (
                      <Typography
                        level="body-sm"
                        sx={{
                          mt: 1,
                          color: "#f44336",
                          fontSize: "0.875rem"
                        }}
                      >
                        {scrapingError}
                      </Typography>
                    )}
                  </Box>
                )}

                {/* Data Cards - Only shown after data is fetched */}
                {formData.product_name && (
                  <>
                    <Divider sx={{ my: 4 }} />

                    <Typography level="h3" sx={{ mb: 3, textAlign: "center" }}>
                      Product Information
                    </Typography>

                    <Box sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
                      gap: 3,
                      mb: 4
                    }}>
                      {/* Product Name Card */}
                      <Card
                        sx={{
                          p: 3,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          background: "linear-gradient(135deg, rgba(167, 139, 250, 0.03), rgba(139, 92, 246, 0.02))",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(216, 180, 254, 0.06)",
                          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
                            border: "1px solid rgba(216, 180, 254, 0.1)",
                            background: "linear-gradient(135deg, rgba(167, 139, 250, 0.05), rgba(139, 92, 246, 0.03))",
                          }
                        }}
                        onClick={() => openEditModal("productName")}
                      >
                        <Typography level="title-md" sx={{ mb: 1, color: "#ffffff" }}>
                          Product Name
                        </Typography>
                        <Typography level="body-sm" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                          {formData.product_name || "Not specified"}
                        </Typography>
                      </Card>

                      {/* Product Description Card */}
                      <Card
                        sx={{
                          p: 3,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          background: "linear-gradient(135deg, rgba(167, 139, 250, 0.03), rgba(139, 92, 246, 0.02))",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(216, 180, 254, 0.06)",
                          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
                            border: "1px solid rgba(216, 180, 254, 0.1)",
                            background: "linear-gradient(135deg, rgba(167, 139, 250, 0.05), rgba(139, 92, 246, 0.03))",
                          }
                        }}
                        onClick={() => openEditModal("description")}
                      >
                        <Typography level="title-md" sx={{ mb: 1, color: "#ffffff" }}>
                          Description
                        </Typography>
                        <Typography level="body-sm" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                          {formData.description
                            ? `${formData.description.substring(0, 100)}${formData.description.length > 100 ? "..." : ""}`
                            : "Not specified"}
                        </Typography>
                      </Card>

                      {/* Specifications Card */}
                      <Card
                        sx={{
                          p: 3,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          background: "linear-gradient(135deg, rgba(167, 139, 250, 0.03), rgba(139, 92, 246, 0.02))",
                          backdropFilter: "blur(8px)",
                          border: hasSpecificationMissing ? "1px solid rgba(243, 91, 100, 0.55)" : "1px solid rgba(216, 180, 254, 0.06)",
                          position: "relative",
                          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
                            border: hasSpecificationMissing ? "1px solid rgba(243, 91, 100, 0.65)" : "1px solid rgba(216, 180, 254, 0.1)",
                            background: "linear-gradient(135deg, rgba(167, 139, 250, 0.05), rgba(139, 92, 246, 0.03))",
                          }
                        }}
                        onClick={() => openEditModal("specifications")}
                      >
                        {hasSpecificationMissing && (
                          <Tooltip title="Missing specification details. Click to add them.">
                            <IconButton
                              size="sm"
                              variant="soft"
                              color="danger"
                              sx={{
                                position: "absolute",
                                top: 12,
                                right: 12,
                                borderRadius: "50%",
                              }}
                              onClick={(event: MouseEvent<HTMLButtonElement>) => {
                                event.stopPropagation();
                                openEditModal("specifications");
                              }}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Typography level="title-md" sx={{ mb: 1, color: "#ffffff" }}>
                          Specifications
                        </Typography>
                        {Object.entries(formData.specifications)
                          .filter(([key, value]) => key !== 'formulation_attributes' && value && value.toString().trim() !== '')
                          .slice(0, 4)
                          .map(([key, value]) => (
                            <Typography key={key} level="body-sm" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                              {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: {value?.toString() || "Not specified"}
                            </Typography>
                          ))
                        }
                        {hasSpecificationMissing && (
                          <Typography level="body-xs" sx={{ color: "#F35B64", mt: 1.5 }}>
                            Missing: {specificationMissingLabels.join(', ')}
                          </Typography>
                        )}
                      </Card>

                      {/* Features Card */}
                      <Card
                        sx={{
                          p: 3,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          background: "linear-gradient(135deg, rgba(167, 139, 250, 0.03), rgba(139, 92, 246, 0.02))",
                          backdropFilter: "blur(8px)",
                          border: hasFeaturesMissing ? "1px solid rgba(243, 91, 100, 0.55)" : "1px solid rgba(216, 180, 254, 0.06)",
                          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
                            border: hasFeaturesMissing ? "1px solid rgba(243, 91, 100, 0.65)" : "1px solid rgba(216, 180, 254, 0.1)",
                            background: "linear-gradient(135deg, rgba(167, 139, 250, 0.05), rgba(139, 92, 246, 0.03))",
                          }
                        }}
                        onClick={() => openEditModal("features")}
                      >
                        {hasFeaturesMissing && (
                          <Tooltip title="Missing features. Click to add them.">
                            <IconButton
                              size="sm"
                              variant="soft"
                              color="danger"
                              sx={{ position: "absolute", top: 12, right: 12, borderRadius: "50%" }}
                              onClick={(event: MouseEvent<HTMLButtonElement>) => {
                                event.stopPropagation();
                                openEditModal("features");
                              }}
                            >
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Typography level="title-md" sx={{ mb: 1, color: "#ffffff" }}>
                          Features
                        </Typography>
                        <Typography level="body-sm" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                          {formData.features.filter(f => f.name.trim()).length} features
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {formData.features.filter(f => f.name.trim()).slice(0, 2).map((feature, index) => (
                            <Chip key={index} size="sm" sx={{ mr: 1, mb: 1 }}>
                              {feature.name}
                            </Chip>
                          ))}
                          {formData.features.filter(f => f.name.trim()).length > 2 && (
                            <Chip size="sm" variant="soft">+{formData.features.filter(f => f.name.trim()).length - 2} more</Chip>
                          )}
                        </Box>
                      </Card>

                      {/* Target Market Card */}
                      <Card
                        sx={{
                          p: 3,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          background: "linear-gradient(135deg, rgba(167, 139, 250, 0.03), rgba(139, 92, 246, 0.02))",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(216, 180, 254, 0.06)",
                          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
                            border: "1px solid rgba(216, 180, 254, 0.1)",
                            background: "linear-gradient(135deg, rgba(167, 139, 250, 0.05), rgba(139, 92, 246, 0.03))",
                          }
                        }}
                        onClick={() => openEditModal("targetMarket")}
                      >
                        <Typography level="title-md" sx={{ mb: 1, color: "#ffffff" }}>
                          Target Market
                        </Typography>
                        <Typography level="body-sm" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                          {formData.targeted_market
                            ? `${formData.targeted_market.substring(0, 100)}${formData.targeted_market.length > 100 ? "..." : ""}`
                            : "Not specified"}
                        </Typography>
                        {formData.specifications.general_product_type && (
                          <Typography level="body-sm" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                            Product Type: {formData.specifications.general_product_type}
                          </Typography>
                        )}
                        {formData.specifications.specific_product_type && (
                          <Typography level="body-sm" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                            Specific Type: {formData.specifications.specific_product_type}
                          </Typography>
                        )}
                      </Card>

                      {/* Problem Solved Card */}
                      <Card
                        sx={{
                          p: 3,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          background: "linear-gradient(135deg, rgba(167, 139, 250, 0.03), rgba(139, 92, 246, 0.02))",
                          backdropFilter: "blur(8px)",
                          border: "1px solid rgba(216, 180, 254, 0.06)",
                          boxShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.35)",
                            border: "1px solid rgba(216, 180, 254, 0.1)",
                            background: "linear-gradient(135deg, rgba(167, 139, 250, 0.05), rgba(139, 92, 246, 0.03))",
                          }
                        }}
                        onClick={() => openEditModal("problemSolved")}
                      >
                        <Typography level="title-md" sx={{ mb: 1, color: "#ffffff" }}>
                          Problem Solved
                        </Typography>
                        <Typography level="body-sm" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                          {formData.problem_product_is_solving
                            ? `${formData.problem_product_is_solving.substring(0, 100)}${formData.problem_product_is_solving.length > 100 ? "..." : ""}`
                            : "Not specified"}
                        </Typography>
                      </Card>
                    </Box>

                    {/* Action Buttons */}
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 4 }}>
                      <Tooltip
                        title={originalScrapedData
                          ? 'Revert all changes back to the original fetched data'
                          : 'Clear the form to a blank state'}
                        placement="top"
                        variant="soft"
                      >
                        <Button
                          type="button"
                          onClick={loadDummyData}
                          variant="outlined"
                          sx={{ flex: 1, width: { xs: "100%", sm: "auto" } }}
                        >
                          {originalScrapedData ? 'Reset to Original' : 'Reset Data'}
                        </Button>
                      </Tooltip>
                      <Tooltip
                        title={hasFormBlockingMissing ? "Please review the highlighted fields before running optimization." : undefined}
                        arrow
                        placement="top"
                        variant={hasFormBlockingMissing ? "outlined" : "plain"}
                      >
                        <span>
                          <Button
                            type="submit"
                            variant="solid"
                            size="lg"
                            disabled={isGeneratingQuery || isAnalyzing || hasFormBlockingMissing}
                            sx={{
                              flex: 1,
                              width: { xs: "100%", sm: "auto" },
                              minHeight: 46,
                              borderRadius: "999px",
                              fontWeight: 600,
                              fontSize: "0.98rem",
                              backgroundColor: accentColor,
                              color: "#0D0F14",
                              border: "1px solid rgba(46, 212, 122, 0.32)",
                              boxShadow: "0 10px 28px rgba(46, 212, 122, 0.28)",
                              transition: "all 0.2s ease",
                              px: 3,
                              "&:hover": {
                                backgroundColor: "#26B869",
                                borderColor: "rgba(46, 212, 122, 0.45)",
                                boxShadow: "0 12px 32px rgba(46, 212, 122, 0.32)",
                              },
                              "&:disabled": {
                                backgroundColor: "rgba(46, 212, 122, 0.28)",
                                borderColor: "rgba(46, 212, 122, 0.18)",
                                color: "rgba(13, 15, 20, 0.7)",
                                boxShadow: "none",
                                cursor: "not-allowed",
                              },
                            }}
                          >
                            {isGeneratingQuery ? 'Generating Query...' :
                              isAnalyzing ? 'Analyzing Optimization...' : 'Generate Query'}
                          </Button>
                        </span>
                      </Tooltip>
                    </Stack>
                  </>
                )}
              </form>
            )}

            {/* Analysis Status Indicator */}
            {isAnalyzing && (
              <Box
                sx={{
                  mt: 4,
                  p: 3,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(7, 11, 20, 0.88))',
                  border: '1px solid rgba(46, 212, 122, 0.22)',
                  boxShadow: '0 28px 60px rgba(2, 6, 12, 0.55)',
                }}
              >
                <Typography sx={{ mb: 1.5, color: '#F2F5FA', fontSize: '1.35rem', fontWeight: 700 }}>
                  GodsEye is analyzing your product
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ color: '#A2A7B4', fontSize: '0.98rem' }}>
                    Preparing strategic insights
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.7 }}>
                    {[0, 1, 2].map((index) => (
                      <Box
                        key={index}
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          backgroundColor: '#2ED47A',
                          animation: `${analyzingDotPulse} 1.1s ease-in-out infinite`,
                          animationDelay: `${index * 0.18}s`,
                          boxShadow: '0 0 14px rgba(46, 212, 122, 0.45)',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Box>
            )}

            {queryGenerationError && (
              <Box sx={{ mt: 4, p: 3, backgroundColor: 'rgba(220, 53, 69, 0.1)', borderRadius: '8px', border: '1px solid rgba(220, 53, 69, 0.3)' }}>
                <Typography sx={{ mb: 2, color: '#ff6b6b', fontSize: '1.25rem', fontWeight: 'bold' }}>
                  Query Generation Error
                </Typography>
                <Typography sx={{ color: '#ffcccc' }}>
                  {queryGenerationError}
                </Typography>
                <Typography sx={{ mt: 2, color: '#b0b0b0', fontSize: '0.9rem' }}>
                  If you continue to see this message, please check your internet connection and try again. If the issue persists, please contact the service provider.
                </Typography>
              </Box>
            )}

            {/* Analysis results now shown on /results page */}


            {/* Missing Fields Warning - Only show when there are actual pending missing fields */}
            <Modal
              open={showMissingFieldsWarning && pendingMissingFields.length > 0}
              onClose={handleDismissWarning}
              slotProps={{ backdrop: { sx: modalBackdropSx } }}
            >
              <ModalDialog
                variant="outlined"
                sx={{
                  ...modalDialogBaseSx,
                  border: "1px solid rgba(255, 193, 7, 0.4)",
                  boxShadow: "0 40px 120px rgba(255, 193, 7, 0.12)",
                  background: "linear-gradient(135deg, rgba(20, 16, 6, 0.98), rgba(8, 6, 2, 0.94))",
                  maxWidth: 520,
                  gap: 2.5,
                }}
              >
                <ModalClose onClick={handleDismissWarning} />
                <Stack spacing={2.5}>
                  <Typography level="h4" sx={{ color: "#FFD166", fontWeight: 700 }}>
                    Some fields need your attention
                  </Typography>
                  <Typography level="body-md" sx={{ color: textSecondary }}>
                    We were unable to confidently retrieve every detail from the source page. Please review the form below and complete or adjust the following fields manually to ensure accuracy.
                  </Typography>
                  {lastExtractionMethod && (
                    <Typography level="body-sm" sx={{ color: "rgba(255, 209, 102, 0.75)" }}>
                      Extraction method used: {lastExtractionMethod}
                    </Typography>
                  )}
                  {pendingMissingFields.length > 0 ? (
                    <List size="sm" sx={{
                      border: "1px solid rgba(255, 193, 7, 0.38)",
                      borderRadius: "md",
                      background: "rgba(255, 193, 7, 0.14)",
                      px: 2,
                      backdropFilter: "blur(8px)",
                    }}>
                      {pendingMissingFields.map(field => {
                        const formattedName = formatMissingFieldName(field);
                        return (
                          <ListItem key={field} sx={{ color: textPrimary, fontWeight: 500 }}>
                            {formattedName}
                          </ListItem>
                        );
                      })}
                    </List>
                  ) : null}
                  <Button
                    type="button"
                    onClick={handleDismissWarning}
                    sx={{
                      backgroundColor: accentColor,
                      color: "#0D0F14",
                      fontWeight: 600,
                      px: 3,
                      "&:hover": {
                        backgroundColor: "#26B869",
                      },
                    }}
                  >
                    Got it, I'll review the form
                  </Button>
                </Stack>
              </ModalDialog>
            </Modal>

            {/* Edit Modals */}

            {/* Product Name Modal */}
            <Modal
              open={openModal === "productName"}
              onClose={closeEditModal}
              slotProps={{ backdrop: { sx: modalBackdropSx } }}
            >
              <ModalDialog
                variant="outlined"
                sx={{
                  ...modalDialogBaseSx,
                  maxWidth: 520,
                }}
              >
                <Typography level="h4" sx={{ mb: 2, color: "#ffffff" }}>Edit Product Name</Typography>
                <Box sx={modalContentScrollStyles}>
                  <Input
                    placeholder="Enter product name"
                    value={formData.product_name}
                    onChange={(e) => handleInputChange("product_name", e.target.value)}
                    size="lg"
                    sx={{
                      ...modalFieldStyles,
                      mb: 2,
                      "& input": {
                        color: textPrimary,
                      },
                      "&::placeholder": {
                        color: "rgba(242, 245, 250, 0.55)",
                      },
                    }}
                  />
                </Box>
                <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: 'center' }}>
                  <Box sx={{ flex: 1 }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={closeEditModal}
                      sx={{
                        borderColor: "rgba(46, 212, 122, 0.28)",
                        color: textPrimary,
                        "&:hover": {
                          borderColor: "rgba(46, 212, 122, 0.45)",
                        },
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={closeEditModal}
                      sx={{
                        backgroundColor: accentColor,
                        color: "#0D0F14",
                        fontWeight: 600,
                        px: 3,
                        "&:hover": {
                          backgroundColor: "#26B869",
                        },
                      }}
                    >
                      Save
                    </Button>
                  </Box>
                </Stack>
              </ModalDialog>
            </Modal>

            {/* Description Modal */}
            <Modal
              open={openModal === "description"}
              onClose={closeEditModal}
              slotProps={{ backdrop: { sx: modalBackdropSx } }}
            >
              <ModalDialog
                variant="outlined"
                sx={{
                  ...modalDialogBaseSx,
                  maxWidth: 620,
                }}
              >
                <Typography level="h4" sx={{ mb: 2, color: "#ffffff" }}>Edit Product Description</Typography>
                <Box sx={modalContentScrollStyles}>
                  <Textarea
                    placeholder="Enter product description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    minRows={4}
                    sx={{
                      ...modalFieldStyles,
                      mb: 2,
                      minHeight: 160,
                      "& textarea": {
                        color: textPrimary,
                      },
                      "&::placeholder": {
                        color: "rgba(242, 245, 250, 0.55)",
                      },
                    }}
                  />
                </Box>
                <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: 'center' }}>
                  <Box />
                  <Box sx={{ flex: 1 }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={closeEditModal}
                      sx={{
                        borderColor: "rgba(46, 212, 122, 0.28)",
                        color: textPrimary,
                        "&:hover": {
                          borderColor: "rgba(46, 212, 122, 0.45)",
                        },
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={closeEditModal}
                      sx={{
                        backgroundColor: accentColor,
                        color: "#0D0F14",
                        fontWeight: 600,
                        px: 3,
                        "&:hover": {
                          backgroundColor: "#26B869",
                        },
                      }}
                    >
                      Save
                    </Button>
                  </Box>
                </Stack>
              </ModalDialog>
            </Modal>

            {/* Specifications Modal */}
            <Modal
              open={openModal === "specifications"}
              onClose={closeEditModal}
              slotProps={{ backdrop: { sx: modalBackdropSx } }}
            >
              <ModalDialog
                variant="outlined"
                sx={{
                  ...modalDialogBaseSx,
                  maxWidth: 760,
                }}
              >
                <Typography level="h4" sx={{ mb: 2, color: "#ffffff" }}>Edit Specifications</Typography>
                <Box sx={modalContentScrollStyles}>
                  <Stack spacing={2.5}>
                    {Object.entries(formData.specifications)
                      .filter(([key, value]) => key !== 'formulation_attributes' && !Array.isArray(value))
                      .map(([key, value]) => {
                        const displayKey = specKeyEdits[key] ?? formatSpecificationKeyForDisplay(key);
                        const isEditingKey = specKeyEditing[key] ?? false;
                        return (
                          <Box
                            key={key}
                            sx={{
                              background: "linear-gradient(135deg, rgba(18, 24, 32, 0.85), rgba(13, 17, 24, 0.88))",
                              border: "1px solid rgba(46, 212, 122, 0.2)",
                              borderRadius: "16px",
                              padding: "16px",
                              boxShadow: "0 12px 36px rgba(0, 0, 0, 0.35)",
                            }}
                          >
                            <Typography level="body-xs" sx={{ color: "rgba(242, 245, 250, 0.7)", fontWeight: 600, mb: 1 }}>
                              Specification Name & Value
                            </Typography>
                            <Stack spacing={1.25}>
                              {isEditingKey ? (
                                <Input
                                  value={displayKey}
                                  onChange={(e) => handleSpecKeyInputChange(key, e.target.value)}
                                  onBlur={() => handleSpecKeyInputBlur(key)}
                                  onKeyDown={handleSpecKeyInputKeyDown(key)}
                                  autoFocus
                                  placeholder="Specification name"
                                  sx={{
                                    ...modalFieldStyles,
                                    "& input": {
                                      color: textPrimary,
                                      fontWeight: 600,
                                      textTransform: "capitalize",
                                    },
                                    "&::placeholder": {
                                      color: "rgba(242, 245, 250, 0.55)",
                                    },
                                  }}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: 1.5,
                                    background: "linear-gradient(135deg, rgba(26, 32, 42, 0.7), rgba(20, 24, 34, 0.66))",
                                    border: "1px solid rgba(46, 212, 122, 0.18)",
                                    borderRadius: "14px",
                                    padding: "10px 14px",
                                  }}
                                >
                                  <Typography level="title-sm" sx={{ color: textPrimary, fontWeight: 600, textTransform: "capitalize" }}>
                                    {displayKey}
                                  </Typography>
                                  <Stack direction="row" spacing={0.75}>
                                    <Tooltip title="Edit name" placement="top" variant="soft">
                                      <IconButton
                                        size="sm"
                                        variant="soft"
                                        color="primary"
                                        onClick={() => startSpecKeyEditing(key)}
                                        sx={{
                                          backgroundColor: "rgba(46, 212, 122, 0.16)",
                                          border: "1px solid rgba(46, 212, 122, 0.28)",
                                          color: accentColor,
                                        }}
                                      >
                                        <EditOutlinedIcon sx={{ fontSize: 18 }} />
                                      </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Remove field" placement="top" variant="soft">
                                      <IconButton
                                        size="sm"
                                        variant="soft"
                                        color="danger"
                                        onClick={() => handleRemoveSpecification(key)}
                                        sx={{
                                          backgroundColor: "rgba(243, 91, 100, 0.16)",
                                          border: "1px solid rgba(243, 91, 100, 0.28)",
                                          color: "#F35B64",
                                        }}
                                      >
                                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                                      </IconButton>
                                    </Tooltip>
                                  </Stack>
                                </Box>
                              )}
                              <Input
                                placeholder={`Enter ${displayKey.toLowerCase()}`}
                                value={value?.toString() || ""}
                                onChange={(e) => handleSpecificationChange(key, e.target.value)}
                                sx={{
                                  ...modalFieldStyles,
                                  "& input": {
                                    color: textPrimary,
                                  },
                                  "&::placeholder": {
                                    color: "rgba(242, 245, 250, 0.55)",
                                  },
                                }}
                              />
                            </Stack>
                          </Box>
                        );
                      })}
                    <Box>
                      <FormLabel sx={{ color: "#ffffff" }}>Formulation Attributes</FormLabel>
                      <Box sx={{ mb: 2 }}>
                        {Array.isArray(formData.specifications.formulation_attributes) && formData.specifications.formulation_attributes.map((attr: string, index: number) => (
                          <Chip
                            key={index}
                            variant="soft"
                            color="primary"
                            sx={{ mr: 1, mb: 1 }}
                            endDecorator={
                              <Button
                                type="button"
                                size="sm"
                                variant="plain"
                                onClick={() => removeAttribute(index)}
                                sx={{ p: 0.5 }}
                              >
                                ×
                              </Button>
                            }
                          >
                            {attr}
                          </Chip>
                        ))}
                      </Box>
                      <Stack direction="row" spacing={1.5}>
                        <Input
                          placeholder="Add attribute (e.g., Sulfate-free)"
                          value={newAttribute}
                          onChange={(e) => setNewAttribute(e.target.value)}
                          sx={{
                            ...modalFieldStyles,
                            "& input": {
                              color: textPrimary,
                            },
                            "&::placeholder": {
                              color: "rgba(242, 245, 250, 0.55)",
                            },
                          }}
                        />
                        <Button
                          type="button"
                          onClick={addAttribute}
                          variant="outlined"
                          size="sm"
                        >
                          Add
                        </Button>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
                {hasFormBlockingMissing && (
                  <Box
                    sx={{
                      backgroundColor: "rgba(243, 91, 100, 0.12)",
                      border: "1px solid rgba(243, 91, 100, 0.3)",
                      borderRadius: "12px",
                      p: 2,
                      mb: 2,
                    }}
                  >
                    <Typography level="body-sm" sx={{ color: "#F35B64", fontWeight: 600, mb: 0.5 }}>
                      ⚠️ Missing specification data
                    </Typography>
                    <Typography level="body-xs" sx={{ color: "rgba(242, 245, 250, 0.7)" }}>
                      Lack of product data may affect the quality of AI optimization results.
                    </Typography>
                  </Box>
                )}
                <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: 'center' }}>
                  <Box>
                    {hasSpecificationMissing && (
                      <Button
                        type="button"
                        variant="outlined"
                        color="danger"
                        onClick={() => {
                          const latest = useProductStore.getState().ignoredMissingFields;
                          const base = Array.isArray(latest) ? latest : [];
                          const next = Array.from(new Set([...base, 'specifications']));
                          setIgnoredMissingFields(next);
                          closeEditModal();
                        }}
                        sx={{
                          borderColor: "rgba(243, 91, 100, 0.4)",
                          color: "#F35B64",
                          "&:hover": {
                            borderColor: "rgba(243, 91, 100, 0.6)",
                            backgroundColor: "rgba(243, 91, 100, 0.08)",
                          },
                        }}
                      >
                        Ignore & Continue
                      </Button>
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={closeEditModal}
                      sx={{
                        borderColor: "rgba(46, 212, 122, 0.28)",
                        color: textPrimary,
                        "&:hover": {
                          borderColor: "rgba(46, 212, 122, 0.45)",
                        },
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={closeEditModal}
                      sx={{
                        backgroundColor: accentColor,
                        color: "#0D0F14",
                        fontWeight: 600,
                        px: 3,
                        "&:hover": {
                          backgroundColor: "#26B869",
                        },
                      }}
                    >
                      Save
                    </Button>
                  </Box>
                </Stack>
              </ModalDialog>
            </Modal>

            {/* Features Modal */}
            <Modal
              open={openModal === "features"}
              onClose={closeEditModal}
              slotProps={{ backdrop: { sx: modalBackdropSx } }}
            >
              <ModalDialog
                variant="outlined"
                sx={{
                  ...modalDialogBaseSx,
                  maxWidth: 720,
                }}
              >
                <Typography level="h4" sx={{ mb: 2, color: "#ffffff" }}>Edit Features</Typography>
                <Box sx={modalContentScrollStyles}>
                  <Stack spacing={2.5}>
                    {formData.features.map((feature, index) => (
                      <Card key={index} variant="outlined" sx={{ p: 2.25, borderColor: "rgba(216, 180, 254, 0.2)", background: "rgba(139, 92, 246, 0.05)" }}>
                        <Stack spacing={1.6}>
                          <Input
                            placeholder="Feature name"
                            value={feature.name}
                            onChange={(e) => handleFeatureChange(index, "name", e.target.value)}
                            sx={{
                              ...modalFieldStyles,
                              "& input": {
                                color: textPrimary,
                              },
                              "&::placeholder": {
                                color: "rgba(242, 245, 250, 0.55)",
                              },
                            }}
                          />
                          <Textarea
                            placeholder="Feature description"
                            value={feature.description}
                            onChange={(e) => handleFeatureChange(index, "description", e.target.value)}
                            sx={{
                              ...modalFieldStyles,
                              "& textarea": {
                                color: textPrimary,
                              },
                              "&::placeholder": {
                                color: "rgba(242, 245, 250, 0.55)",
                              },
                            }}
                          />
                          <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button type="button" variant="outlined" color="danger" onClick={() => removeFeature(index)}>
                              Remove Feature
                            </Button>
                          </Stack>
                        </Stack>
                      </Card>
                    ))}
                    <Button
                      type="button"
                      onClick={addFeature}
                      variant="outlined"
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Add Feature
                    </Button>
                  </Stack>
                </Box>
                <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: 'center' }}>
                  <Box>
                    {hasFeaturesMissing && (
                      <Button
                        type="button"
                        variant="outlined"
                        color="danger"
                        onClick={() => {
                          setIgnoredMissingFields((prev) => {
                            const next = Array.from(new Set([...prev, 'features']));
                            // Don't set warning directly - let useEffect handle it based on pendingMissingFields
                            return next;
                          });
                          closeEditModal();
                        }}
                        sx={{
                          borderColor: "rgba(243, 91, 100, 0.4)",
                          color: "#F35B64",
                          "&:hover": {
                            borderColor: "rgba(243, 91, 100, 0.6)",
                            backgroundColor: "rgba(243, 91, 100, 0.08)",
                          },
                        }}
                      >
                        Ignore & Continue
                      </Button>
                    )}
                  </Box>
                  <Box sx={{ flex: 1 }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={closeEditModal}
                      sx={{
                        borderColor: "rgba(46, 212, 122, 0.28)",
                        color: textPrimary,
                        "&:hover": {
                          borderColor: "rgba(46, 212, 122, 0.45)",
                        },
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={closeEditModal}
                      sx={{
                        backgroundColor: accentColor,
                        color: "#0D0F14",
                        fontWeight: 600,
                        px: 3,
                        "&:hover": {
                          backgroundColor: "#26B869",
                        },
                      }}
                    >
                      Save
                    </Button>
                  </Box>
                </Stack>
              </ModalDialog>
            </Modal>

            {/* Target Market Modal */}
            <Modal
              open={openModal === "targetMarket"}
              onClose={closeEditModal}
              slotProps={{ backdrop: { sx: modalBackdropSx } }}
            >
              <ModalDialog
                variant="outlined"
                sx={{
                  ...modalDialogBaseSx,
                  maxWidth: 640,
                }}
              >
                <Typography level="h4" sx={{ mb: 2, color: "#ffffff" }}>Edit Target Market</Typography>
                <Box sx={modalContentScrollStyles}>
                  <Textarea
                    placeholder="Describe your target market"
                    value={formData.targeted_market}
                    onChange={(e) => handleInputChange("targeted_market", e.target.value)}
                    minRows={4}
                    maxRows={8}
                    sx={{
                      ...modalFieldStyles,
                      mb: 2,
                      minHeight: 150,
                      "& textarea": {
                        color: textPrimary,
                      },
                      "&::placeholder": {
                        color: "rgba(242, 245, 250, 0.55)",
                      },
                    }}
                  />
                  <Box sx={{ mt: 3 }}>
                    <FormLabel sx={{ color: "#ffffff", mb: 1 }}>General Product Type</FormLabel>
                    <Input
                      placeholder="e.g., Headphones, Shampoo"
                      value={formData.specifications.general_product_type || ""}
                      onChange={(e) => handleSpecificationChange("general_product_type", e.target.value)}
                      sx={{
                        ...modalFieldStyles,
                        mb: 2,
                        "& input": {
                          color: textPrimary,
                        },
                        "&::placeholder": {
                          color: "rgba(242, 245, 250, 0.55)",
                        },
                      }}
                    />
                  </Box>
                  <Box>
                    <FormLabel sx={{ color: "#ffffff", mb: 1 }}>Specific Product Type</FormLabel>
                    <Input
                      placeholder="e.g., On-ear headphones, Hairfall Control"
                      value={formData.specifications.specific_product_type || ""}
                      onChange={(e) => handleSpecificationChange("specific_product_type", e.target.value)}
                      sx={{
                        ...modalFieldStyles,
                        mb: 3,
                        "& input": {
                          color: textPrimary,
                        },
                        "&::placeholder": {
                          color: "rgba(242, 245, 250, 0.55)",
                        },
                      }}
                    />
                  </Box>
                </Box>
                <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", mt: 2 }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={closeEditModal}
                    sx={{
                      borderColor: "rgba(46, 212, 122, 0.28)",
                      color: textPrimary,
                      "&:hover": {
                        borderColor: "rgba(46, 212, 122, 0.45)",
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={closeEditModal}
                    sx={{
                      backgroundColor: accentColor,
                      color: "#0D0F14",
                      fontWeight: 600,
                      px: 3,
                      "&:hover": {
                        backgroundColor: "#26B869",
                      },
                    }}
                  >
                    Save
                  </Button>
                </Stack>
              </ModalDialog>
            </Modal>

            {/* Problem Solved Modal */}
            <Modal
              open={openModal === "problemSolved"}
              onClose={closeEditModal}
              slotProps={{ backdrop: { sx: modalBackdropSx } }}
            >
              <ModalDialog
                variant="outlined"
                sx={{
                  ...modalDialogBaseSx,
                  maxWidth: 640,
                }}
              >
                <Typography level="h4" sx={{ mb: 2, color: "#ffffff" }}>Edit Problem Solved</Typography>
                <Box sx={modalContentScrollStyles}>
                  <Textarea
                    placeholder="Describe the problem your product solves"
                    value={formData.problem_product_is_solving}
                    onChange={(e) => handleInputChange("problem_product_is_solving", e.target.value)}
                    minRows={4}
                    maxRows={8}
                    sx={{
                      ...modalFieldStyles,
                      mb: 2,
                      minHeight: 150,
                      "& textarea": {
                        color: textPrimary,
                      },
                      "&::placeholder": {
                        color: "rgba(242, 245, 250, 0.55)",
                      },
                    }}
                  />
                </Box>
                <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", mt: 2 }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={closeEditModal}
                    sx={{
                      borderColor: "rgba(46, 212, 122, 0.28)",
                      color: textPrimary,
                      "&:hover": {
                        borderColor: "rgba(46, 212, 122, 0.45)",
                      },
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={closeEditModal}
                    sx={{
                      backgroundColor: accentColor,
                      color: "#0D0F14",
                      fontWeight: 600,
                      px: 3,
                      "&:hover": {
                        backgroundColor: "#26B869",
                      },
                    }}
                  >
                    Save
                  </Button>
                </Stack>
              </ModalDialog>
            </Modal>

            {/* Old modals removed - now using AnalysisDisplay component */}

            {/* Server Error Dialog */}
            <Modal
              open={!!serverError}
              onClose={() => setServerError(null)}
              slotProps={{ backdrop: { sx: modalBackdropSx } }}
            >
              <ModalDialog
                variant="outlined"
                sx={{
                  ...modalDialogBaseSx,
                  maxWidth: 520,
                  border: "1px solid rgba(243, 91, 100, 0.35)",
                  boxShadow: "0 40px 120px rgba(243, 91, 100, 0.22)",
                }}
              >
                <ModalClose onClick={() => setServerError(null)} />
                <Typography
                  level="h3"
                  sx={{
                    mb: 2,
                    color: "#F87171",
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      fontSize: "1.6rem",
                      lineHeight: 1,
                    }}
                  >
                    ⚠️
                  </Box>
                  Server Connection Error
                </Typography>
                <Typography
                  sx={{
                    color: textSecondary,
                    mb: 3,
                    lineHeight: 1.7,
                  }}
                >
                  {serverError}
                </Typography>
                <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={() => setServerError(null)}
                    sx={{
                      borderColor: "rgba(243, 91, 100, 0.45)",
                      color: "#F2F5FA",
                      "&:hover": {
                        borderColor: "rgba(243, 91, 100, 0.65)",
                        backgroundColor: "rgba(243, 91, 100, 0.12)",
                      },
                    }}
                  >
                    Close
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      setServerError(null);
                      router.push("/");
                    }}
                    sx={{
                      backgroundColor: accentColor,
                      color: "#0D0F14",
                      fontWeight: 600,
                      px: 3,
                      "&:hover": {
                        backgroundColor: "#26B869",
                      },
                    }}
                  >
                    Go to Dashboard
                  </Button>
                </Stack>
              </ModalDialog>
            </Modal>
          </Card>
        )}

        {/* Check Implementation Modal */}
        <Modal
          open={checkImplementationModalOpen}
          onClose={() => setCheckImplementationModalOpen(false)}
          slotProps={{ backdrop: { sx: modalBackdropSx } }}
        >
          <ModalDialog
            variant="outlined"
            sx={{
              ...modalDialogBaseSx,
              maxWidth: 520,
              border: "1px solid rgba(255, 193, 7, 0.2)",
              boxShadow: "0 40px 120px rgba(255, 193, 7, 0.1)",
            }}
          >
            <ModalClose onClick={() => setCheckImplementationModalOpen(false)} />
            <Typography
              level="h3"
              sx={{
                mb: 2,
                color: "rgba(255, 193, 7, 0.85)",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box
                component="span"
                sx={{
                  fontSize: "1.6rem",
                  lineHeight: 1,
                }}
              >
                ⚠️
              </Box>
              Check Implementation
            </Typography>
            <Typography
              sx={{
                color: textSecondary,
                mb: 3,
                lineHeight: 1.7,
              }}
            >
              Before proceeding, please confirm:
            </Typography>
            <Stack spacing={2} sx={{ mb: 4 }}>
              <Typography
                sx={{
                  color: textPrimary,
                  fontSize: "0.95rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                }}
              >
                <Box component="span" sx={{ color: "rgba(46, 212, 122, 0.7)" }}>✓</Box>
                Have you completed the implementation of all recommended changes?
              </Typography>
              <Typography
                sx={{
                  color: textPrimary,
                  fontSize: "0.95rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                }}
              >
                <Box component="span" sx={{ color: "rgba(46, 212, 122, 0.7)" }}>✓</Box>
                Has your site been recrawled or crawled by Google Search Console after the changes?
              </Typography>
            </Stack>
            <Box
              sx={{
                p: 2.5,
                backgroundColor: "rgba(243, 91, 100, 0.04)",
                border: "1px solid rgba(243, 91, 100, 0.15)",
                borderRadius: "8px",
                mb: 4,
              }}
            >
              <Typography
                sx={{
                  color: "rgba(248, 113, 113, 0.85)",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 1,
                }}
              >
                <Box component="span">⚠️</Box>
                Warning: If the implementation is not complete, this check will be useless and you will lose credits.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => setCheckImplementationModalOpen(false)}
                sx={{
                  borderColor: "rgba(255, 193, 7, 0.25)",
                  color: "rgba(242, 245, 250, 0.8)",
                  "&:hover": {
                    borderColor: "rgba(255, 193, 7, 0.35)",
                    backgroundColor: "rgba(255, 193, 7, 0.06)",
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setCheckImplementationModalOpen(false);
                  void handleReOptimizeSelectedQueries();
                }}
                sx={{
                  backgroundColor: "rgba(255, 193, 7, 0.15)",
                  color: "rgba(255, 193, 7, 0.9)",
                  fontWeight: 600,
                  px: 3,
                  border: "1px solid rgba(255, 193, 7, 0.25)",
                  "&:hover": {
                    backgroundColor: "rgba(255, 193, 7, 0.2)",
                    borderColor: "rgba(255, 193, 7, 0.35)",
                  },
                }}
              >
                Confirm & Check
              </Button>
            </Stack>
          </ModalDialog>
        </Modal>

        {/* Generate Batch Modal */}
        <Modal
          open={isGenerateBatchModalOpen}
          onClose={() => setGenerateBatchModalOpen(false)}
          slotProps={{ backdrop: { sx: modalBackdropSx } }}
        >
          <ModalDialog
            variant="outlined"
            sx={{
              ...modalDialogBaseSx,
              maxWidth: 500,
              border: "1px solid rgba(46, 212, 122, 0.2)",
              boxShadow: "0 40px 120px rgba(46, 212, 122, 0.1)",
            }}
          >
            <ModalClose onClick={() => setGenerateBatchModalOpen(false)} />
            <Typography
              level="h3"
              sx={{
                mb: 2,
                color: "rgba(242, 245, 250, 0.9)",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              Generate New Query Batch
            </Typography>

            <Typography
              sx={{
                color: textSecondary,
                mb: 3,
                lineHeight: 1.7,
              }}
            >
              Create a new batch of optimized search queries based on the product's Generative DNA.
              New queries will be unique and distinct from previous batches.
            </Typography>

            <FormControl sx={{ mb: 3 }}>
              <FormLabel sx={{ color: textPrimary, mb: 1 }}>Batch Name (Optional)</FormLabel>
              <Input
                placeholder="e.g., Competitor Analysis v2"
                value={newBatchName}
                onChange={(e) => setNewBatchName(e.target.value)}
                sx={{
                  backgroundColor: "rgba(17, 19, 24, 0.6)",
                  borderColor: "rgba(242, 245, 250, 0.2)",
                  color: textPrimary,
                  "&:hover": { borderColor: "rgba(242, 245, 250, 0.3)" },
                  "&.Mui-focused": { borderColor: "#2ED47A" }
                }}
              />
            </FormControl>

            <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => setGenerateBatchModalOpen(false)}
                sx={{
                  borderColor: "rgba(242, 245, 250, 0.25)",
                  color: "rgba(242, 245, 250, 0.8)",
                  "&:hover": {
                    borderColor: "rgba(242, 245, 250, 0.35)",
                    backgroundColor: "rgba(242, 245, 250, 0.06)",
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleGenerateNewBatch}
                loading={isGeneratingQuery}
                sx={{
                  backgroundColor: "rgba(46, 212, 122, 0.15)",
                  color: "#2ED47A",
                  fontWeight: 600,
                  px: 3,
                  border: "1px solid rgba(46, 212, 122, 0.25)",
                  "&:hover": {
                    backgroundColor: "rgba(46, 212, 122, 0.2)",
                    borderColor: "rgba(46, 212, 122, 0.35)",
                  },
                }}
              >
                Generate Batch
              </Button>
            </Stack>
          </ModalDialog>
        </Modal>

        <Modal
          open={checkImplementationIncompleteModalOpen}
          onClose={() => setCheckImplementationIncompleteModalOpen(false)}
          slotProps={{ backdrop: { sx: modalBackdropSx } }}
        >
          <ModalDialog
            variant="outlined"
            sx={{
              ...modalDialogBaseSx,
              maxWidth: 620,
              border: "1px solid rgba(255, 193, 7, 0.2)",
              boxShadow: "0 40px 120px rgba(255, 193, 7, 0.1)",
            }}
          >
            <ModalClose onClick={() => setCheckImplementationIncompleteModalOpen(false)} />
            <Typography
              level="h3"
              sx={{
                mb: 2,
                color: "rgba(255, 193, 7, 0.85)",
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Box
                component="span"
                sx={{
                  fontSize: "1.6rem",
                  lineHeight: 1,
                }}
              >
                ⚠️
              </Box>
              Check Implementation (Incomplete Batch)
            </Typography>

            <Typography
              sx={{
                color: textSecondary,
                mb: 2.5,
                lineHeight: 1.7,
              }}
            >
              There are some remaining queries to re-run. The list is given below. Confirm "Run Check" to run them.
            </Typography>

            <Box
              sx={{
                p: 2,
                backgroundColor: "rgba(255, 193, 7, 0.06)",
                border: "1px solid rgba(255, 193, 7, 0.18)",
                borderRadius: "8px",
                mb: 3,
              }}
            >
              <Typography sx={{ color: textPrimary, fontSize: "0.95rem", fontWeight: 600, mb: 1.25 }}>
                Queries to be analyzed
              </Typography>

              <Stack spacing={1}>
                {usedPerplexityQueries
                  .filter(q => allPerplexityQueries.includes(q) && !hasQueryBeenReanalyzed(q, 'perplexity'))
                  .map((q, idx) => (
                    <Typography key={`ci-px-${idx}`} sx={{ color: textPrimary, fontSize: "0.9rem" }}>
                      Perplexity: {q}
                    </Typography>
                  ))}
                {usedGoogleQueries
                  .filter(q => allGoogleQueries.includes(q) && !hasQueryBeenReanalyzed(q, 'google_overview'))
                  .map((q, idx) => (
                    <Typography key={`ci-go-${idx}`} sx={{ color: textPrimary, fontSize: "0.9rem" }}>
                      Google: {q}
                    </Typography>
                  ))}
              </Stack>
            </Box>

            <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => setCheckImplementationIncompleteModalOpen(false)}
                sx={{
                  borderColor: "rgba(255, 193, 7, 0.25)",
                  color: "rgba(242, 245, 250, 0.8)",
                  "&:hover": {
                    borderColor: "rgba(255, 193, 7, 0.35)",
                    backgroundColor: "rgba(255, 193, 7, 0.06)",
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setCheckImplementationIncompleteModalOpen(false);
                  void handleCheckImplementationIncompleteBatch();
                }}
                sx={{
                  backgroundColor: "rgba(255, 193, 7, 0.15)",
                  color: "rgba(255, 193, 7, 0.9)",
                  fontWeight: 600,
                  px: 3,
                  border: "1px solid rgba(255, 193, 7, 0.25)",
                  "&:hover": {
                    backgroundColor: "rgba(255, 193, 7, 0.2)",
                    borderColor: "rgba(255, 193, 7, 0.35)",
                  },
                }}
              >
                Run Check
              </Button>
            </Stack>
          </ModalDialog>
        </Modal>

        {/* Generated Query Section */}
        {activeSection === "query" && (
          <Card
            variant="outlined"
            sx={{
              flex: 1,
              p: 4,
              mb: 4,
              backgroundColor: surfaceBase,
              border: `1px solid ${borderColor}`,
              boxShadow: "0 24px 60px rgba(2, 4, 7, 0.55)",
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
                    border: `1px dashed rgba(46, 212, 122, 0.35)`
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                    <Typography level="title-md" sx={{ color: textPrimary }}>
                      Batches
                    </Typography>
                    <Tooltip title={isNewBatchEnabled ? "Generate a new batch of queries" : "Previous batch analysis must be complete (DNA generated) before creating a new one"} placement="top" arrow>
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
                  <Typography level="body-sm" sx={{ color: textSecondary, textAlign: 'center', mt: 2 }}>
                    Loading batches...
                  </Typography>
                ) : queryBatches.length === 0 ? (
                  <Typography level="body-sm" sx={{ color: textSecondary, textAlign: 'center', mt: 2 }}>
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
                          backgroundColor: "rgba(17, 19, 24, 0.6)",
                          border: "1px solid rgba(46, 212, 122, 0.22)",
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                              <Typography level="title-md" sx={{ color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {batch.name}
                              </Typography>
                              {batch.created_at && (
                                <Typography level="body-xs" sx={{ color: "rgba(162, 167, 180, 0.5)", whiteSpace: 'nowrap', pt: 0.2 }}>
                                  {formatRelativeTime(batch.created_at)}
                                </Typography>
                              )}
                            </Box>
                            {batch.description ? (
                              <Typography level="body-xs" sx={{ color: textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {batch.description}
                              </Typography>
                            ) : null}
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip
                              title={batch.has_used_queries ? "Cannot delete batch with used queries" : "Delete Batch"}
                              placement="top"
                              arrow
                            >
                              <span>
                                <IconButton
                                  size="sm"
                                  variant="outlined"
                                  onClick={(e) => handleDeleteBatch(batch.id, e)}
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
                                      cursor: "not-allowed"
                                    }
                                  }}
                                >
                                  {isDeletingBatch === batch.id ? (
                                    <CircularProgress size="sm" sx={{ '--CircularProgress-size': '16px', color: '#F35B64' }} />
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
                              onClick={() => loadQueriesForBatch(batch.id)}
                              sx={{
                                borderColor: "rgba(46, 212, 122, 0.3)",
                                color: "#2ED47A",
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
                <Typography level="h2" sx={{ mb: 3, color: textPrimary, textAlign: "center" }}>
                  Generated Search Queries
                </Typography>

                {/* Analysis Mode Display */}
                <Box sx={{ mb: 4, textAlign: "center" }}>
                  <Chip
                    size="md"
                    variant="soft"
                    sx={{
                      backgroundColor: getAnalysisModeDisplay().color === '#2ED47A'
                        ? "rgba(46, 212, 122, 0.12)"
                        : "rgba(243, 91, 100, 0.12)",
                      color: getAnalysisModeDisplay().color,
                      fontWeight: 600,
                      px: 3,
                    }}
                  >
                    {getAnalysisModeDisplay().text}
                  </Chip>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography level="title-md" sx={{ color: textPrimary }}>
                        {queryBatches.find((b: any) => b.id === selectedBatchId)?.name || 'Batch'}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1.5}>
                      <Button
                        size="sm"
                        variant="outlined"
                        onClick={() => {
                          setSelectedBatchId(null);
                          setAllPerplexityQueries([]);
                          setAllGoogleQueries([]);
                          setSelectedPerplexityQueries([]);
                          setSelectedGoogleQueries([]);
                        }}
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
                      <Tooltip title="Coming Soon" placement="top" arrow>
                        <span>
                          <Button
                            size="sm"
                            onClick={handleGenerateQueryOnly}
                            loading={isGeneratingQuery}
                            disabled
                            sx={{
                              backgroundColor: "transparent",
                              border: "1px solid rgba(242, 245, 250, 0.25)",
                              color: "rgba(242, 245, 250, 0.5)",
                              fontWeight: 600,
                              cursor: "not-allowed",
                              "&:hover": {
                                backgroundColor: "transparent",
                                borderColor: "rgba(242, 245, 250, 0.25)",
                              },
                            }}
                          >
                            Generate New Batch
                          </Button>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Perplexity Queries Section */}
            {selectedBatchId && allPerplexityQueries.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography level="title-md" sx={{ color: textPrimary }}>
                    🔍 Perplexity Search Queries
                  </Typography>
                  <Chip size="sm" variant="soft" sx={{ backgroundColor: "rgba(46, 212, 122, 0.12)", color: "#2ED47A" }}>
                    {selectedPerplexityQueries.length}/{maxPerplexityQueries} selected
                  </Chip>
                </Box>
                <Stack spacing={2}>
                  {allPerplexityQueries.map((query, index) => {
                    return (
                      <Card
                        key={`perplexity-${index}`}
                        variant="outlined"
                        sx={{
                          p: 2,
                          backgroundColor: "rgba(17, 19, 24, 0.6)",
                          border: selectedPerplexityQueries.includes(query)
                            ? "2px solid rgba(46, 212, 122, 0.5)"
                            : "1px solid rgba(46, 212, 122, 0.2)",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                          <Checkbox
                            checked={selectedPerplexityQueries.includes(query) || usedPerplexityQueries.includes(query)}
                            disabled={usedPerplexityQueries.includes(query)}
                            onChange={() => handleQuerySelection(query, 'perplexity')}
                            sx={{
                              "& .MuiCheckbox-root": {
                                color: usedPerplexityQueries.includes(query) ? "#6c757d" : "#2ED47A",
                              },
                              "& .MuiCheckbox-disabled": {
                                color: "#6c757d",
                              },
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            {editingQuery?.pipeline === 'perplexity' && editingQuery?.index === index ? (
                              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                <Input
                                  value={editingQuery.value}
                                  onChange={(e) => setEditingQuery({ ...editingQuery, value: e.target.value })}
                                  onKeyDown={handleEditKeyDown}
                                  sx={{
                                    flex: 1,
                                    '&::before': {
                                      display: 'none',
                                    },
                                    '&::after': {
                                      display: 'none',
                                    },
                                    '&.Mui-focused': {
                                      backgroundColor: 'rgba(46, 212, 122, 0.05)',
                                    },
                                  }}
                                  autoFocus
                                />
                                <Button
                                  size="sm"
                                  onClick={handleSaveEditedQuery}
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
                                    const analyses = getAnalysesForQuery(query, 'perplexity');
                                    const analysisCount = analyses.length;
                                    const trend = getTrendIndicator(analyses);

                                    return (
                                      <Box sx={{ position: 'relative' }}>
                                        <Tooltip title="View Perplexity analysis result" placement="top">
                                          <Button
                                            size="sm"
                                            variant="outlined"
                                            loading={loadingResultKey === `perplexity-${query}`}
                                            disabled={loadingResultKey === `perplexity-${query}`}
                                            onClick={() => handleViewAnalysisResult(query, 'perplexity')}
                                            onContextMenu={handleResultMenuOpen}
                                            sx={{
                                              minWidth: analysisCount > 1 ? 110 : 90,
                                              borderColor: "rgba(46, 212, 122, 0.3)",
                                              color: "#2ED47A",
                                              fontWeight: 600,
                                              fontSize: "0.75rem",
                                              position: 'relative',
                                              boxShadow: analysisCount > 1 ? '0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)' : 'none',
                                              "&:hover": {
                                                backgroundColor: "rgba(46, 212, 122, 0.1)",
                                                borderColor: "rgba(46, 212, 122, 0.5)",
                                              },
                                            }}
                                          >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                              <Typography sx={{ fontSize: '0.75rem' }}>
                                                📄 Result
                                              </Typography>
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
                                                    borderRadius: '10px',
                                                  }}
                                                >
                                                  {analysisCount}
                                                </Chip>
                                              )}
                                              {trend && (
                                                <Typography sx={{ fontSize: '0.8rem', color: trend.direction === 'up' ? '#2ED47A' : trend.direction === 'down' ? '#F35B64' : '#6c757d' }}>
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
                                              '& .MuiList-root': {
                                                py: 0.5,
                                              },
                                            }}
                                          >
                                            <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                              <Typography level="title-sm" sx={{ color: '#2ED47A', fontWeight: 600 }}>
                                                Analysis History
                                              </Typography>
                                            </Box>
                                            {analyses.map((analysis: any, index: number) => (
                                              <MenuItem
                                                key={analysis.id}
                                                onClick={() => handleViewAnalysisById(analysis.id, 'perplexity')}
                                                sx={{
                                                  py: 0.75,
                                                  px: 1.5,
                                                  display: 'flex',
                                                  justifyContent: 'space-between',
                                                  alignItems: 'center',
                                                  '&:hover': {
                                                    backgroundColor: 'rgba(46, 212, 122, 0.1)',
                                                  },
                                                }}
                                              >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                  <Typography level="body-sm" sx={{ fontSize: '0.8rem' }}>
                                                    {index === 0 ? 'Latest' : index === 1 ? 'v2' : `v${index + 1}`}
                                                  </Typography>
                                                  {index === 0 && trend && (
                                                    <Typography sx={{ fontSize: '0.8rem', color: trend.direction === 'up' ? '#2ED47A' : trend.direction === 'down' ? '#F35B64' : '#6c757d' }}>
                                                      {trend.icon}
                                                    </Typography>
                                                  )}
                                                </Box>
                                                <Typography level="body-sm" sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>
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
                                        onClick={() => handleEditQuery(query, index, 'perplexity')}
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

            {/* Google Queries Section */}
            {selectedBatchId && allGoogleQueries.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography level="title-md" sx={{ color: textPrimary }}>
                    🌐 Google AI Overview Queries
                  </Typography>
                  <Chip size="sm" variant="soft" sx={{ backgroundColor: "rgba(46, 212, 122, 0.12)", color: "#2ED47A" }}>
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
                            onChange={() => handleQuerySelection(query, 'google_overview')}
                            sx={{
                              "& .MuiCheckbox-root": {
                                color: usedGoogleQueries.includes(query) ? "#6c757d" : "#2ED47A",
                              },
                              "& .MuiCheckbox-disabled": {
                                color: "#6c757d",
                              },
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            {editingQuery?.pipeline === 'google_overview' && editingQuery?.index === index ? (
                              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                <Typography level="body-xs" sx={{
                                  color: "#94a3b8",
                                  px: 1,
                                  fontStyle: 'italic',
                                  mb: 0.5
                                }}>
                                  💡 These queries are designed to invoke AI Overview. Please maintain the consistency and structure of the query.
                                </Typography>
                                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                                  <Input
                                    value={editingQuery.value}
                                    onChange={(e) => setEditingQuery({ ...editingQuery, value: e.target.value })}
                                    onKeyDown={handleEditKeyDown}
                                    sx={{
                                      flex: 1,
                                      '&::before': {
                                        display: 'none',
                                      },
                                      '&::after': {
                                        display: 'none',
                                      },
                                      '&.Mui-focused': {
                                        backgroundColor: 'rgba(46, 212, 122, 0.05)',
                                      },
                                    }}
                                    autoFocus
                                  />
                                  <Button
                                    size="sm"
                                    onClick={handleSaveEditedQuery}
                                    loading={editingQueryLoading}
                                    disabled={editingQueryLoading || editingQuery.value.trim().split(/\s+/).length < 6}
                                    sx={{
                                      minWidth: 60,
                                      backgroundColor: editingQuery.value.trim().split(/\s+/).length >= 6 ? "#2ED47A" : "transparent",
                                      color: editingQuery.value.trim().split(/\s+/).length >= 6 ? "#0D0F14" : "#6c757d",
                                      fontWeight: 600,
                                      border: editingQuery.value.trim().split(/\s+/).length >= 6 ? "none" : "1px solid rgba(108, 117, 125, 0.3)",
                                      "&:hover": {
                                        backgroundColor: editingQuery.value.trim().split(/\s+/).length >= 6 ? "#26B869" : "rgba(108, 117, 125, 0.1)",
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
                                <Typography level="body-xs" sx={{
                                  color: editingQuery.value.trim().split(/\s+/).length >= 6 ? "#2ED47A" : "#F35B64",
                                  px: 1,
                                  fontStyle: 'italic'
                                }}>
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
                                    const analyses = getAnalysesForQuery(query, 'google_overview');
                                    const analysisCount = analyses.length;
                                    const trend = getTrendIndicator(analyses);

                                    return (
                                      <Box sx={{ position: 'relative' }}>
                                        <Tooltip title="View Google AI Overview analysis result" placement="top">
                                          <Button
                                            size="sm"
                                            variant="outlined"
                                            loading={loadingResultKey === `google_overview-${query}`}
                                            disabled={loadingResultKey === `google_overview-${query}`}
                                            onClick={() => handleViewAnalysisResult(query, 'google_overview')}
                                            onContextMenu={handleResultMenuOpen}
                                            sx={{
                                              minWidth: analysisCount > 1 ? 110 : 90,
                                              borderColor: "rgba(66, 133, 244, 0.3)",
                                              color: "#4285F4",
                                              fontWeight: 600,
                                              fontSize: "0.75rem",
                                              position: 'relative',
                                              boxShadow: analysisCount > 1 ? '0 2px 4px rgba(0,0,0,0.1), 0 4px 8px rgba(0,0,0,0.1)' : 'none',
                                              "&:hover": {
                                                backgroundColor: "rgba(66, 133, 244, 0.1)",
                                                borderColor: "rgba(66, 133, 244, 0.5)",
                                              },
                                            }}
                                          >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                              <Typography sx={{ fontSize: '0.75rem' }}>
                                                🌐 Result
                                              </Typography>
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
                                                    borderRadius: '10px',
                                                  }}
                                                >
                                                  {analysisCount}
                                                </Chip>
                                              )}
                                              {trend && (
                                                <Typography sx={{ fontSize: '0.8rem', color: trend.direction === 'up' ? '#4285F4' : trend.direction === 'down' ? '#F35B64' : '#6c757d' }}>
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
                                              '& .MuiList-root': {
                                                py: 0.5,
                                              },
                                            }}
                                          >
                                            <Box sx={{ px: 1.5, py: 1, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                              <Typography level="title-sm" sx={{ color: '#4285F4', fontWeight: 600 }}>
                                                Analysis History
                                              </Typography>
                                            </Box>
                                            {analyses.map((analysis: any, index: number) => (
                                              <MenuItem
                                                key={analysis.id}
                                                onClick={() => handleViewAnalysisById(analysis.id, 'google_overview')}
                                                sx={{
                                                  py: 0.75,
                                                  px: 1.5,
                                                  display: 'flex',
                                                  justifyContent: 'space-between',
                                                  alignItems: 'center',
                                                  '&:hover': {
                                                    backgroundColor: 'rgba(66, 133, 244, 0.1)',
                                                  },
                                                }}
                                              >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                  <Typography level="body-sm" sx={{ fontSize: '0.8rem' }}>
                                                    {index === 0 ? 'Latest' : index === 1 ? 'v2' : `v${index + 1}`}
                                                  </Typography>
                                                  {index === 0 && trend && (
                                                    <Typography sx={{ fontSize: '0.8rem', color: trend.direction === 'up' ? '#4285F4' : trend.direction === 'down' ? '#F35B64' : '#6c757d' }}>
                                                      {trend.icon}
                                                    </Typography>
                                                  )}
                                                </Box>
                                                <Typography level="body-sm" sx={{ fontSize: '0.75rem', color: '#9ca3af' }}>
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
                                        onClick={() => handleEditQuery(query, index, 'google_overview')}
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

            {/* Query Generation Error State */}
            {queryGenerationError && (
              <Box sx={{ mb: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    p: 3,
                    backgroundColor: "rgba(243, 91, 100, 0.1)",
                    border: "1px solid rgba(243, 91, 100, 0.3)",
                  }}
                >
                  <Typography level="body-md" sx={{ color: "#F35B64", mb: 2 }}>
                    ⚠️ Query Generation Error
                  </Typography>
                  <Typography level="body-sm" sx={{ color: textSecondary }}>
                    {queryGenerationError}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={() => setQueryGenerationError(null)}
                    sx={{
                      mt: 2,
                      borderColor: "rgba(243, 91, 100, 0.4)",
                      color: "#F35B64",
                      "&:hover": {
                        backgroundColor: "rgba(243, 91, 100, 0.1)",
                      },
                    }}
                  >
                    Dismiss
                  </Button>
                </Card>
              </Box>
            )}

            {/* Server Error State */}
            {serverError && (
              <Box sx={{ mb: 4 }}>
                <Card
                  variant="outlined"
                  sx={{
                    p: 3,
                    backgroundColor: "rgba(243, 91, 100, 0.1)",
                    border: "1px solid rgba(243, 91, 100, 0.3)",
                  }}
                >
                  <Typography level="body-md" sx={{ color: "#F35B64", mb: 2 }}>
                    ⚠️ Error
                  </Typography>
                  <Typography level="body-sm" sx={{ color: textSecondary, mb: 2 }}>
                    {serverError}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="sm"
                    onClick={() => setServerError(null)}
                    sx={{
                      borderColor: "rgba(243, 91, 100, 0.4)",
                      color: "#F35B64",
                      "&:hover": {
                        backgroundColor: "rgba(243, 91, 100, 0.1)",
                      },
                    }}
                  >
                    Dismiss
                  </Button>
                </Card>
              </Box>
            )}

            {/* Loading State - Generating Queries */}
            {isGeneratingQuery && (allPerplexityQueries.length === 0 && allGoogleQueries.length === 0) && (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography level="h3" sx={{ mb: 2, color: textPrimary }}>
                  Generating Queries...
                </Typography>
                <Typography level="body-md" sx={{ mb: 4, color: textSecondary }}>
                  Please wait while we generate optimized search queries for your product.
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                  {[0, 1, 2].map((i) => (
                    <Box
                      key={i}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: accentColor,
                        animation: `pulse 1.4s ease-in-out ${i * 0.16}s infinite both`,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Loading State - Loading Queries from Database */}
            {isLoadingQueries && !isGeneratingQuery && (allPerplexityQueries.length === 0 && allGoogleQueries.length === 0) && (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography level="h3" sx={{ mb: 2, color: textPrimary }}>
                  Loading Queries...
                </Typography>
                <Typography level="body-md" sx={{ mb: 4, color: textSecondary }}>
                  Please wait while we load your saved queries.
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                  {[0, 1, 2].map((i) => (
                    <Box
                      key={`loading-${i}`}
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: accentColor,
                        animation: `pulse 1.4s ease-in-out ${i * 0.16}s infinite both`,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* No queries in selected batch */}
            {selectedBatchId && !isLoadingBatchQueries && (allPerplexityQueries.length === 0 && allGoogleQueries.length === 0) && (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography level="h3" sx={{ mb: 2, color: textPrimary }}>
                  No Queries in This Batch
                </Typography>
                <Typography level="body-md" sx={{ mb: 4, color: textSecondary }}>
                  This batch doesn't contain any queries. Generate a new batch to get started.
                </Typography>
                <Tooltip title="Coming Soon" placement="top" arrow>
                  <span>
                    <Button
                      onClick={handleGenerateQueryOnly}
                      loading={isGeneratingQuery}
                      disabled
                      sx={{
                        minWidth: 200,
                        borderRadius: "999px",
                        backgroundColor: "transparent",
                        border: "1px solid rgba(242, 245, 250, 0.25)",
                        color: "rgba(242, 245, 250, 0.5)",
                        fontWeight: 600,
                        cursor: "not-allowed",
                        px: 3,
                        "&:hover": {
                          backgroundColor: "transparent",
                          borderColor: "rgba(242, 245, 250, 0.25)",
                        },
                      }}
                    >
                      Generate New Batch
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            )}

            {/* Optimize for AI Search Button - Single unified button */}
            {selectedBatchId && (allPerplexityQueries.length > 0 || allGoogleQueries.length > 0) && (
              <Box sx={{ mt: 6, textAlign: "center" }}>
                {/* Loading Indicators */}
                {(isPerplexityScraping || isGoogleScraping) && (
                  <Box sx={{ mb: 4 }}>
                    <Card
                      variant="outlined"
                      sx={{
                        p: 3,
                        backgroundColor: "rgba(46, 212, 122, 0.05)",
                        border: "1px solid rgba(46, 212, 122, 0.2)",
                      }}
                    >
                      <Typography level="body-md" sx={{ color: "#2ED47A", mb: 2, fontWeight: 600 }}>
                        🔄 Analysis in Progress
                      </Typography>
                      <Stack spacing={2}>
                        {isPerplexityScraping && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Box sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: "#2ED47A",
                              animation: "pulse 1.5s infinite"
                            }} />
                            <Typography level="body-sm" sx={{ color: textSecondary }}>
                              Running Perplexity analysis...
                            </Typography>
                          </Box>
                        )}
                        {isGoogleScraping && (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                            <Box sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor: "#2ED47A",
                              animation: "pulse 1.5s infinite"
                            }} />
                            <Typography level="body-sm" sx={{ color: textSecondary }}>
                              Running Google AI Overview analysis...
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Card>
                  </Box>
                )}

                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 3, maxWidth: "100%" }}>
                  {/* Mode Chip - Left aligned */}
                  <Chip
                    size="md"
                    variant="soft"
                    sx={{
                      backgroundColor: getAnalysisModeDisplay().color === '#2ED47A'
                        ? "rgba(46, 212, 122, 0.12)"
                        : "rgba(243, 91, 100, 0.12)",
                      color: getAnalysisModeDisplay().color,
                      fontWeight: 600,
                      px: 3,
                      py: 1,
                      height: "auto",
                      minHeight: 40,
                    }}
                  >
                    {getAnalysisModeDisplay().text}
                  </Chip>

                  {/* Buttons - Right aligned */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    {/* Check Implementation Button */}
                    {(usedPerplexityQueries.filter(q => allPerplexityQueries.includes(q)).length > 0 || usedGoogleQueries.filter(q => allGoogleQueries.includes(q)).length > 0) && (
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={() => {
                          const batchUsedPerplexity = usedPerplexityQueries.filter(q => allPerplexityQueries.includes(q));
                          const batchUsedGoogle = usedGoogleQueries.filter(q => allGoogleQueries.includes(q));

                          const hasOddPerplexity = batchUsedPerplexity.some(q => hasQueryBeenReanalyzed(q, 'perplexity'));
                          const hasOddGoogle = batchUsedGoogle.some(q => hasQueryBeenReanalyzed(q, 'google_overview'));

                          const count = (hasOddPerplexity || hasOddGoogle)
                            ? batchUsedPerplexity.filter(q => !hasQueryBeenReanalyzed(q, 'perplexity')).length +
                            batchUsedGoogle.filter(q => !hasQueryBeenReanalyzed(q, 'google_overview')).length
                            : batchUsedPerplexity.length + batchUsedGoogle.length;

                          if (count === 0) {
                            setCheckImplementationModalOpen(true);
                          } else {
                            setCheckImplementationIncompleteModalOpen(true);
                          }
                        }}
                        sx={{
                          borderColor: "rgba(255, 193, 7, 0.25)",
                          color: "rgba(255, 193, 7, 0.85)",
                          fontWeight: 600,
                          px: 3,
                          py: 1.5,
                          "&:hover": {
                            backgroundColor: "rgba(255, 193, 7, 0.06)",
                            borderColor: "rgba(255, 193, 7, 0.35)",
                          },
                        }}
                      >
                        {(() => {
                          const batchUsedPerplexity = usedPerplexityQueries.filter(q => allPerplexityQueries.includes(q));
                          const batchUsedGoogle = usedGoogleQueries.filter(q => allGoogleQueries.includes(q));

                          const hasOddPerplexity = batchUsedPerplexity.some(q => hasQueryBeenReanalyzed(q, 'perplexity'));
                          const hasOddGoogle = batchUsedGoogle.some(q => hasQueryBeenReanalyzed(q, 'google_overview'));

                          const count = (hasOddPerplexity || hasOddGoogle)
                            ? batchUsedPerplexity.filter(q => !hasQueryBeenReanalyzed(q, 'perplexity')).length +
                            batchUsedGoogle.filter(q => !hasQueryBeenReanalyzed(q, 'google_overview')).length
                            : batchUsedPerplexity.length + batchUsedGoogle.length;

                          return count === 0 ? 'Check Implementation' : `Check Implementation (${count})`;
                        })()}
                      </Button>
                    )}

                    {/* Optimize for AI Search Button */}
                    <Button
                      type="button"
                      disabled={isGeneratingQuery || isAnalyzing || isPerplexityScraping || isGoogleScraping || (selectedPerplexityQueries.length === 0 && selectedGoogleQueries.length === 0)}
                      onClick={async () => {
                        if (!user) {
                          setServerError('Please sign in to analyze products');
                          router.push('/auth');
                          return;
                        }

                        // Check if any queries are selected
                        if (selectedPerplexityQueries.length === 0 && selectedGoogleQueries.length === 0) {
                          setQueryGenerationError('Please select at least one query to proceed with analysis.');
                          return;
                        }

                        // Use selected queries for analysis
                        await handleUseSelectedQueries();
                      }}
                      sx={{
                        minWidth: 280,
                        borderRadius: "999px",
                        backgroundColor: (isGeneratingQuery || isAnalyzing || isPerplexityScraping || isGoogleScraping) || (selectedPerplexityQueries.length === 0 && selectedGoogleQueries.length === 0)
                          ? "rgba(46, 212, 122, 0.3)"
                          : accentColor,
                        color: (isGeneratingQuery || isAnalyzing || isPerplexityScraping || isGoogleScraping) || (selectedPerplexityQueries.length === 0 && selectedGoogleQueries.length === 0)
                          ? "rgba(13, 15, 20, 0.6)"
                          : "#0D0F14",
                        fontWeight: 600,
                        px: 4,
                        py: 1.8,
                        border: "1px solid rgba(46, 212, 122, 0.36)",
                        boxShadow: (isGeneratingQuery || isAnalyzing || isPerplexityScraping || isGoogleScraping) || (selectedPerplexityQueries.length === 0 && selectedGoogleQueries.length === 0)
                          ? "none"
                          : "0 10px 26px rgba(46, 212, 122, 0.25)",
                        transition: "all 0.25s ease",
                        "&:hover:not(:disabled)": {
                          backgroundColor: "#26B869",
                          borderColor: "rgba(46, 212, 122, 0.48)",
                          boxShadow: "0 12px 32px rgba(46, 212, 122, 0.3)",
                        },
                        "&:disabled": {
                          cursor: "not-allowed",
                        },
                      }}
                    >
                      {isGeneratingQuery ? 'Generating Query...' :
                        isAnalyzing ? 'Analyzing Optimization...' :
                          isPerplexityScraping ? 'Running Perplexity Analysis...' :
                            isGoogleScraping ? 'Running Google Analysis...' :
                              `Optimize for AI Search (${selectedPerplexityQueries.length + selectedGoogleQueries.length})`}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Card>
        )}

        {/* SOV Performance Cards */}
        {showSOVCards && currentProductId && sovCardEngine && (
          <Box sx={{ mt: 0 }}>
            <SOVPerformanceCard
              productId={currentProductId}
              engine={sovCardEngine}
              onDeepAnalysisClick={() => setShowDeepAnalysis(!showDeepAnalysis)}
              isDeepAnalysisActive={showDeepAnalysis}
              product={products.find((p) => p.id === currentProductId)}
            />

            {/* Deep Analysis Card */}
            {showDeepAnalysis && (
              <DeepAnalysisCard
                engine={sovCardEngine}
                productId={currentProductId}
                analysisHash={
                  products.find((p) => p.id === currentProductId)?.[
                  sovCardEngine === 'google'
                    ? 'deep_analysis_google_hash'
                    : 'deep_analysis_perplexity_hash'
                  ] ?? null
                }
                isAnalysisUpToDate={
                  products.find((p) => p.id === currentProductId)?.[
                  sovCardEngine === 'google'
                    ? 'deep_analysis_google_up_to_date'
                    : 'deep_analysis_perplexity_up_to_date'
                  ] ?? false
                }
              />
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function OptimizePage() {
  return (
    <ProtectedRoute>
      <OptimizePageContent />
    </ProtectedRoute>
  );
}
