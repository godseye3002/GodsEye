"use client";

import {
  Box,
  Button,
  Card,
  Chip,
  Divider,
  FormLabel,
  IconButton,
  Input,
  List,
  ListItem,
  Modal,
  ModalClose,
  ModalDialog,
  Option,
  Select,
  Sheet,
  Stack,
  Textarea,
  Tooltip,
  Typography,
} from "@mui/joy";
import { keyframes } from "@mui/system";
import { useCallback, useEffect, useState, type KeyboardEvent, type MouseEvent } from "react";
// API route handles query generation now
import { ProtectedRoute } from "@/components/protected-route";
import { useAuth } from "@/lib/auth-context";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import axios from 'axios';
import { useRouter } from "next/navigation";
import { useProductStore } from "./store";
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
    return response.data;
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

async function callGoogleOverviewScraper(query: string, location: string = 'India') {
  try {
    // const response = await axios.post('http://127.0.0.1:8000/scrape', {
    //   query,
    //   location,
    //   max_retries: 3,
    // });
    const response = await axios.post(`${process.env.NEXT_PUBLIC_GOOGLE_OVERVIEW_SCRAPER}`, {
      query,
      location,
      max_retries: 3,
    });
    console.log('Google AI Overview scraper response:', response.data);
    return response.data;
  } catch (error: any) {
    let status: number | undefined;
    let humanMessage = 'We were unable to reach the Google AI Overview scraping service. Please try again in a moment.';
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
        humanMessage = 'Google AI Overview scraper endpoint was not found. Ensure the scraper service is running.';
      } else if (status === 429) {
        humanMessage = 'The Google AI Overview scraping service is receiving too many requests. Please wait a bit before retrying.';
      } else if (status === 500) {
        humanMessage = 'The Google AI Overview scraping service encountered an internal error. Please try again shortly.';
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

    console.error('Google AI Overview scraper error:', logPayload);

    const scraperError = new Error(humanMessage);
    scraperError.name = 'GoogleAIScraperError';
    (scraperError as any).status = status;
    throw scraperError;
  }
}

const analyzingDotPulse = keyframes`
  0%, 80%, 100% { transform: scale(0.65); opacity: 0.35; }
  40% { transform: scale(1); opacity: 1; }
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
    selectedPipeline,
    setSelectedPipeline,
  } = useProductStore();

  const [isClient, setIsClient] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("India");
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [newAttribute, setNewAttribute] = useState("");
  const [activeSection, setActiveSection] = useState<"product" | "perplexity" | "google">("product");
  const [specKeyEdits, setSpecKeyEdits] = useState<Record<string, string>>({});
  const [specKeyEditing, setSpecKeyEditing] = useState<Record<string, boolean>>({});

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

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) return;
      try {
        const response = await fetch('/api/analyze/check-credits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        });
        if (!response.ok) throw new Error('Failed to fetch credits');
        const data = await response.json();
        if (typeof data.currentCredits === 'number') {
          setUserCredits(data.currentCredits);
        }
      } catch (error) {
        console.error('Failed to fetch user credits:', error);
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
        body: JSON.stringify({ url: formData.url, location: selectedLocation }),
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
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        return scrapeProductData(retryCount + 1);
      }
      
      // User-friendly error messages
      if (error.name === 'AbortError') {
        setScrapingError('The request took too long. The website might be slow or blocking automated access. Please try again or enter product details manually.');
      } else if (error.message.includes('fetch')) {
        setScrapingError('Unable to connect to the scraping service. Please check your internet connection and try again.');
      } else {
        setScrapingError(error instanceof Error ? error.message : 'Failed to scrape product data. You can enter the details manually below.');
      }
    } finally {
      setIsScraping(false);
    }
  };
  
  // Helper function to generate a query for a specific pipeline
  const generateQueryForPipeline = async (
    data: ProductFormData,
    pipeline: 'perplexity' | 'google_overview',
    analysisId?: string
  ): Promise<string | null> => {
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
      return result.topQuery;
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
      
      // When "all" is selected, generate separate queries for each pipeline
      if (selectedPipeline === 'all') {
        const [perplexityQuery, googleQuery] = await Promise.all([
          generateQueryForPipeline(data, 'perplexity', analysisId),
          generateQueryForPipeline(data, 'google_overview', analysisId),
        ]);
        
        // Use Perplexity query as the primary (for display/state)
        const primaryQuery = perplexityQuery || googleQuery;
        if (primaryQuery) {
          setGeneratedQuery(primaryQuery);
          console.log("Generated queries for both pipelines - Perplexity:", perplexityQuery, "Google:", googleQuery);
          
          // Return both queries for use in scraping
          return { perplexityQuery, googleQuery };
        }
        throw new Error('Failed to generate queries for both pipelines');
      } else {
        // Single pipeline - generate one query
        const response = await fetch('/api/generate-queries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...productContext,
            analysisId,
            pipeline: selectedPipeline,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to generate search queries');
        }
        
        const result = await response.json();
        
        if (result && result.topQuery) {
          setGeneratedQuery(result.topQuery);
          console.log("Generated top query:", result.topQuery);
          console.log("All generated queries:", result.queries);
          
          // Return single query for single pipeline
          return result.topQuery;
        } else {
          throw new Error('Failed to generate search queries');
        }
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
      problem_product_is_solving: data.problem_product_is_solving
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication
    if (!user) {
      setServerError('Please sign in to analyze products');
      router.push('/auth');
      return;
    }
    
    // Check credits availability before starting (without deducting)
    const requiredCredits = selectedPipeline === 'all' ? 2 : 1;
    try {
      const creditCheckResponse = await fetch('/api/analyze/check-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          creditsRequired: requiredCredits,
        }),
      });

      const creditCheckData = await creditCheckResponse.json();

      if (!creditCheckData.hasEnoughCredits) {
        setServerError('Insufficient credits. Please purchase more credits to continue.');
        return;
      }
      if (typeof creditCheckData.currentCredits === 'number') {
        setUserCredits(creditCheckData.currentCredits);
      }
      
      console.log('Credit check passed, proceeding with analysis');
    } catch (creditError) {
      console.error('Credit check error:', creditError);
      setServerError('Failed to verify credits. Please try again.');
      return;
    }
    
    // Prepare the current form data for AI workflow
    const aiReadyData = prepareDataForAI(formData);
    
    console.log("Form submitted with current user data:", formData);
    console.log("Data prepared for AI workflow:", aiReadyData);
    
    // Generate a per-run analysisId for token aggregation/logging
    const analysisId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

    // Part 1: Generate search query from the product data
    setIsGeneratingQuery(true);
    setQueryGenerationError(null);
    setServerError(null);
    
    try {
      const queryResult = await generateQueryFromData(aiReadyData, analysisId);
      
      if (!queryResult) {
        // Query generation failed - error already set by generateQueryFromData
        setIsGeneratingQuery(false);
        return;
      }
      
      // Handle both single query (string) and dual query (object) cases
      const isDualQuery = typeof queryResult === 'object' && 'perplexityQuery' in queryResult;
      const perplexityQuery = isDualQuery 
        ? (queryResult as { perplexityQuery: string | null; googleQuery: string | null }).perplexityQuery
        : (queryResult as string);
      const googleQuery = isDualQuery
        ? (queryResult as { perplexityQuery: string | null; googleQuery: string | null }).googleQuery
        : (queryResult as string);
      
      // Set the primary query for display (prefer Perplexity if available)
      const primaryQuery = perplexityQuery || googleQuery || '';
      if (!primaryQuery) {
        setQueryGenerationError('Failed to generate a valid search query');
        setIsGeneratingQuery(false);
        return;
      }
      
      console.log("Generated query for optimization:", primaryQuery);

      // Persist both queries in a structured JSON string for Supabase and results pages
      const generatedQueriesPayload = JSON.stringify({
        perplexityQuery: perplexityQuery ? [perplexityQuery] : [],
        googleQuery: googleQuery ? [googleQuery] : [],
      });

      setGeneratedQuery(generatedQueriesPayload);
      
      // Part 2.1: Call the selected scraper APIs
      setIsAnalyzing(true);
      setAnalysisError(null);
      
      try {
        const runPerplexity = selectedPipeline === 'perplexity' || selectedPipeline === 'all';
        const runGoogle = selectedPipeline === 'google_overview' || selectedPipeline === 'all';

        let perplexityScraperResponse: any | null = null;
        let googleScraperResponse: any | null = null;

        if (runPerplexity && runGoogle) {
          // Use pipeline-specific queries when both are running
          const perplexityQueryToUse = perplexityQuery || primaryQuery;
          const googleQueryToUse = googleQuery || primaryQuery;
          
          console.log("Using Perplexity-optimized query:", perplexityQueryToUse);
          console.log("Using Google-optimized query:", googleQueryToUse);
          
          const [perplexityResult, googleResult] = await Promise.all([
            callPerplexityScraper(perplexityQueryToUse, selectedLocation),
            callGoogleOverviewScraper(googleQueryToUse, selectedLocation),
          ]);
          perplexityScraperResponse = perplexityResult;
          googleScraperResponse = googleResult;
        } else if (runPerplexity) {
          const queryToUse = perplexityQuery || primaryQuery;
          perplexityScraperResponse = await callPerplexityScraper(queryToUse, selectedLocation);
        } else if (runGoogle) {
          const queryToUse = googleQuery || primaryQuery;
          googleScraperResponse = await callGoogleOverviewScraper(queryToUse, selectedLocation);
        }

          const scraperResponse = perplexityScraperResponse || googleScraperResponse;
          console.log("Scraper response:", scraperResponse);
          
          // Store raw source links from primary scraper (Perplexity preferred)
          if (scraperResponse.source_links && Array.isArray(scraperResponse.source_links)) {
            setSourceLinks(scraperResponse.source_links);
            console.log(`[Source Links] Stored ${scraperResponse.source_links.length} raw source links`);
          }
          
          // Validate scraper response
          if (!scraperResponse || typeof scraperResponse !== 'object') {
            throw new Error('Invalid scraper response format');
          }
          
          // Check if primary scraper returned success: false
          if (scraperResponse.success === false) {
            console.error('Scraper returned success: false', scraperResponse);
            setServerError(
              'We apologize for the inconvenience. Our AI search service encountered an issue while gathering competitor data. ' +
              'This may be due to temporary service limitations or rate limits. Please try again in a few moments. ' +
              'Your credits have not been deducted.'
            );
            setIsAnalyzing(false);
            setIsGeneratingQuery(false);
            return;
          }
          
          // Part 2.2: Run strategic analysis for selected engines (and sources for Perplexity)
          const analysisPromises: Promise<Response | null>[] = [];

          let perplexityAnalysisIndex: number | null = null;
          let googleAnalysisIndex: number | null = null;
          let sourcesIndex: number | null = null;

          if (runPerplexity && perplexityScraperResponse) {
            perplexityAnalysisIndex = analysisPromises.length;
            analysisPromises.push(
              fetch('/api/strategic-analysis', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  aiSearchJson: perplexityScraperResponse,
                  clientProductJson: aiReadyData,
                  analysisId,
                  pipeline: 'perplexity',
                }),
              })
            );

            sourcesIndex = analysisPromises.length;
            analysisPromises.push(
              fetch('/api/process-sources', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  sourceLinks: perplexityScraperResponse.source_links || [],
                  analysisId,
                  pipeline: 'perplexity',
                }),
              })
            );
          }

          if (runGoogle && googleScraperResponse) {
            googleAnalysisIndex = analysisPromises.length;
            analysisPromises.push(
              fetch('/api/strategic-analysis', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  aiSearchJson: googleScraperResponse,
                  clientProductJson: aiReadyData,
                  analysisId,
                  pipeline: 'google_overview',
                }),
              })
            );
          }

          const results = await Promise.all(analysisPromises);

          const getResponse = (index: number | null): Response | null =>
            index !== null ? (results[index] as Response) : null;

          const perplexityAnalysisResponse = getResponse(perplexityAnalysisIndex);
          const sourcesResponse = getResponse(sourcesIndex);
          const googleAnalysisResponse = getResponse(googleAnalysisIndex);

          // Process sources result (Perplexity only for now)
          if (sourcesResponse && sourcesResponse.ok) {
            try {
              const sourcesData = await sourcesResponse.json();
              if (sourcesData.success && sourcesData.sources) {
                setProcessedSources(sourcesData.sources);
                console.log(`[Process Sources] Stored ${sourcesData.sources.length} processed sources`);
              }
            } catch (sourcesError) {
              console.error('[Process Sources] Failed to parse response:', sourcesError);
              // Don't fail the entire flow if source processing fails
            }
          } else if (sourcesResponse) {
            console.error('[Process Sources] API call failed:', sourcesResponse.status);
            // Don't fail the entire flow if source processing fails
          }

          let primaryAnalysis: OptimizationAnalysis | null = null;
          let perplexityAnalysis: OptimizationAnalysis | null = null;
          let googleAnalysis: OptimizationAnalysis | null = null;

          if (perplexityAnalysisResponse) {
            if (!perplexityAnalysisResponse.ok) {
              const analysisError = await perplexityAnalysisResponse.json();
              const userMessage = analysisError.error || 'Failed to perform strategic analysis';
              console.error('Perplexity strategic analysis failed:', analysisError);
              throw new Error(userMessage);
            }
            const perplexityData = await perplexityAnalysisResponse.json();
            if (!perplexityData || typeof perplexityData !== 'object') {
              throw new Error('Received invalid Perplexity analysis data from server');
            }
            console.log('Perplexity strategic analysis completed:', perplexityData);
            setOptimizationAnalysis(perplexityData);
            perplexityAnalysis = perplexityData as OptimizationAnalysis;
            primaryAnalysis = perplexityAnalysis;
          }

          if (googleAnalysisResponse) {
            try {
              if (googleAnalysisResponse.ok) {
                const googleData = await googleAnalysisResponse.json();
                console.log('Google AI Overview strategic analysis completed:', googleData);
                setGoogleOverviewAnalysis(googleData);
                googleAnalysis = googleData as OptimizationAnalysis;
                if (!primaryAnalysis) {
                  primaryAnalysis = googleAnalysis;
                }
              } else {
                const googleError = await googleAnalysisResponse.json().catch(() => null);
                console.error('Google AI Overview strategic analysis failed:', {
                  status: googleAnalysisResponse.status,
                  error: googleError,
                });
              }
            } catch (googleAnalysisParseError) {
              console.error('Failed to handle Google AI Overview strategic analysis response:', googleAnalysisParseError);
            }
          }

          if (!primaryAnalysis) {
            throw new Error('No successful analysis results were produced');
          }

          // Deduct credits only after successful analysis
          try {
            const creditResponse = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: user.id,
                creditsRequired: requiredCredits,
              }),
            });

            const creditData = await creditResponse.json();

            if (!creditData.success) {
              console.error('Failed to deduct credits after successful analysis');
              // Don't block the user from seeing results, just log the error
            } else {
              console.log('Credit deducted successfully after analysis completion');
              adjustUserCredits(-requiredCredits);
            }
          } catch (creditError) {
            console.error('Credit deduction error after analysis:', creditError);
            // Don't block the user from seeing results
          }
          
          // Persist the analysis result as a product, keeping Perplexity and Google separate
          const productRecord = createProductRecord(perplexityAnalysis, googleAnalysis);
          addProduct(productRecord);
          
          // Save to Supabase if user is authenticated
          if (user) {
            try {
              const savedProductId = await saveProductToSupabase(productRecord, user.id, generatedQueriesPayload);
              console.log('Product saved to Supabase successfully with ID:', savedProductId);
              
              // Update analysis_history with product_id
              if (savedProductId) {
                try {
                  await fetch('/api/analyze/update-history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: user.id,
                      productId: savedProductId,
                    }),
                  });
                  console.log('Analysis history updated with product_id');
                } catch (historyError) {
                  console.error('Failed to update analysis history:', historyError);
                }
              }
            } catch (saveError) {
              console.error('Failed to save product to Supabase:', saveError);
              // Don't block navigation on save failure
            }
          }
          
          // Route based on which engines ran: Perplexity (including "all") goes to /results; Google-only goes to /results/google
          const ranPerplexity = selectedPipeline === 'perplexity' || selectedPipeline === 'all';
          router.push(ranPerplexity ? "/results" : "/results/google");
          
        } catch (error: any) {
          console.error('Analysis error:', error);
          
          // Enhanced error categorization and user feedback
          if (error?.name === 'ScraperError') {
            setAnalysisError(error.message || 'Our scraper service was unable to retrieve competitor data. Please review the URL or retry in a moment.');
          } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || !navigator.onLine) {
            setServerError('Unable to connect to the analysis server. Please check your internet connection and try again.');
            router.push("/results");
          } else if (error.message.includes('timeout') || error.name === 'TimeoutError') {
            setAnalysisError('The analysis is taking longer than expected. This usually happens with complex products. Please try again.');
            router.push("/results");
          } else if (error.message.includes('AI analysis service')) {
            // User-friendly message for parsing errors
            setAnalysisError('We encountered a temporary issue processing your analysis. Our system has logged this error. Please try again in a moment.');
            router.push("/results");
          } else {
            // Generic fallback with helpful context
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during analysis';
            setAnalysisError(`${errorMessage}. If this persists, please contact support with your product URL.`);
            router.push("/results");
          }
        } finally {
          setIsAnalyzing(false);
        }
    } catch (error) {
      // This catch handles any unexpected errors in handleSubmit
      console.error('Unexpected error in handleSubmit:', error);
      setServerError('An unexpected error occurred. Please try again.');
      setIsGeneratingQuery(false);
      setIsAnalyzing(false);
    }
  };

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
        </Box>
        <Button
          type="button"
          variant="outlined"
          color="neutral"
          size="sm"
          onClick={() => router.push("/products")}
        >
          Back to Dashboard
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
              onClick={() => setActiveSection("product")}
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
              variant={activeSection === "perplexity" ? "solid" : "outlined"}
              color="neutral"
              onClick={() => {
                setActiveSection("perplexity");
                router.push("/results");
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
                router.push("/results/google");
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
            {pendingMissingFields.length > 0 && (
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
            <form onSubmit={handleSubmit}>
            {/* URL Input - Always visible */}
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
                <Select
                  aria-label="Analysis Engine"
                  value={selectedPipeline}
                  onChange={(_, v) => v && setSelectedPipeline(v)}
                  size="md"
                  sx={{
                    minWidth: { xs: "100%", md: 160 },
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
                  {ANALYSIS_PIPELINE_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>{opt.label}</Option>
                  ))}
                </Select>
                <Button
                  type="button"
                  onClick={() => scrapeProductData()}
                  disabled={isScraping}
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
                  {isScraping ? 'Scraping...' : 'Fetch Info'}
                </Button>
              </Stack>
              
              {/* Error Display */}
              {scrapingError && (
                <Typography 
                  level="body-sm" 
                  sx={{ 
                    mt: 1, 
                    color: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    p: 1,
                    borderRadius: '4px',
                    border: '1px solid rgba(255, 107, 107, 0.2)'
                  }}
                >
                  {scrapingError}
                </Typography>
              )}
            </Box>

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
                    title={pendingMissingFields.length > 0 ? "Please review the highlighted fields before running optimization." : undefined}
                    arrow
                    placement="top"
                    variant={pendingMissingFields.length > 0 ? "outlined" : "plain"}
                  >
                    <span>
                      <Button
                        type="submit"
                        variant="solid"
                        size="lg"
                        disabled={isGeneratingQuery || isAnalyzing || pendingMissingFields.length > 0}
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
                         isAnalyzing ? 'Analyzing Optimization...' : 'Optimize for AI Search'}
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
