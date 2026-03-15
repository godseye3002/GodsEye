"use client";

import {
    Box,
    Button,
    Card,
    Chip,
    CircularProgress,
    Divider,
    FormLabel,
    IconButton,
    Input,
    Modal,
    ModalClose,
    ModalDialog,
    Option,
    Select,
    Stack,
    Textarea,
    Tooltip,
    Typography,
} from "@mui/joy";
import * as React from "react";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useRouter } from "next/navigation";
import { useProductStore } from "@/app/optimize/store";
import type { Feature, ProductContext, ProductFormData } from "@/app/optimize/types";
import { createEmptyProductFormData, type OptimizedProduct } from "@/app/optimize/types";
import type { QueryData } from "@/app/optimize/store";
import { useAuth } from "@/lib/auth-context";
import { useDashboardStore } from "@/lib/store";

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

export function OptimizeProductDataCard() {
    const router = useRouter();
    const { user } = useAuth();
    const setDashboardActiveSection = useDashboardStore((s) => s.setActiveSection);

    const formData = useProductStore((state) => state.formData);
    const setFormData = useProductStore((state) => state.setFormData);
    const setOriginalScrapedData = useProductStore((state) => state.setOriginalScrapedData);
    const setMissingFields = useProductStore((state) => state.setMissingFields);
    const setIgnoredMissingFields = useProductStore((state) => state.setIgnoredMissingFields);
    const setShowMissingFieldsWarning = useProductStore((state) => state.setShowMissingFieldsWarning);
    const setLastExtractionMethod = useProductStore((state) => state.setLastExtractionMethod);
    const setGeneratedQuery = useProductStore((state) => state.setGeneratedQuery);
    const setQueryGenerationError = useProductStore((state) => state.setQueryGenerationError);
    const setAllPerplexityQueries = useProductStore((state) => state.setAllPerplexityQueries);
    const setAllGoogleQueries = useProductStore((state) => state.setAllGoogleQueries);
    const setAllChatgptQueries = useProductStore((state) => state.setAllChatgptQueries);
    const setQueryData = useProductStore((state) => state.setQueryData);
    const setActiveSection = useProductStore((state) => state.setActiveSection);
    const saveQueriesToSupabase = useProductStore((state) => state.saveQueriesToSupabase);
    const saveProductToSupabase = useProductStore((state) => state.saveProductToSupabase);
    const updateProductInSupabase = useProductStore((state) => state.updateProductInSupabase);
    const setCurrentProductId = useProductStore((state) => state.setCurrentProductId);
    const currentProductId = useProductStore((state) => state.currentProductId);
    const originalScrapedData = useProductStore((state) => state.originalScrapedData);

    const isScraping = useProductStore((state) => state.isScraping);
    const setIsScraping = useProductStore((state) => state.setIsScraping);
    const scrapingError = useProductStore((state) => state.scrapingError);
    const setScrapingError = useProductStore((state) => state.setScrapingError);

    const isGeneratingQuery = useProductStore((state) => state.isGeneratingQuery);
    const setIsGeneratingQuery = useProductStore((state) => state.setIsGeneratingQuery);
    const queryGenerationError = useProductStore((state) => state.queryGenerationError);
    const setSelectedBatchId = useProductStore((state) => state.setSelectedBatchId);

    const isAnalyzing = useProductStore((state) => state.isAnalyzing);
    const missingFields = useProductStore((state) => state.missingFields);
    const ignoredMissingFields = useProductStore((state) => state.ignoredMissingFields);

    const [inputMode, setInputMode] = React.useState<"url" | "text">("url");
    const [productText, setProductText] = React.useState("");
    const [selectedLocation, setSelectedLocation] = React.useState<string>("India");

    const [openModal, setOpenModal] = React.useState<string | null>(null);
    const [specKeyEdits, setSpecKeyEdits] = React.useState<Record<string, string>>({});
    const [specKeyEditing, setSpecKeyEditing] = React.useState<Record<string, boolean>>({});
    const [newAttribute, setNewAttribute] = React.useState("");

    const formatSpecificationKeyForDisplay = React.useCallback(
        (key: string) => key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
        []
    );

    const normalizeSpecificationKey = React.useCallback(
        (key: string) =>
            key
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "_")
                .replace(/^_+|_+$/g, "")
                .slice(0, 64),
        []
    );

    React.useEffect(() => {
        if (openModal !== "specifications") {
            setSpecKeyEdits({});
            setSpecKeyEditing({});
            return;
        }

        setSpecKeyEdits((prev) => {
            const next = { ...prev };
            Object.entries(formData.specifications || {})
                .filter(([key, value]) => key !== "formulation_attributes" && !Array.isArray(value))
                .forEach(([key]) => {
                    next[key] = Object.prototype.hasOwnProperty.call(prev, key) ? prev[key] : formatSpecificationKeyForDisplay(key);
                });
            return next;
        });

        setSpecKeyEditing((prev) => {
            const next = { ...prev };
            Object.entries(formData.specifications || {})
                .filter(([key, value]) => key !== "formulation_attributes" && !Array.isArray(value))
                .forEach(([key]) => {
                    next[key] = Object.prototype.hasOwnProperty.call(prev, key) ? prev[key] : false;
                });
            return next;
        });
    }, [openModal, formData.specifications, formatSpecificationKeyForDisplay]);

    const openEditModal = React.useCallback((modalName: string) => {
        setOpenModal(modalName);
    }, []);

    const closeEditModal = React.useCallback(() => {
        setOpenModal(null);
    }, []);

    const ignoredNormalized = Array.isArray(ignoredMissingFields) ? ignoredMissingFields : [];
    const pendingMissingFields = (Array.isArray(missingFields) ? missingFields : []).filter((f) => {
        const l = String(f).toLowerCase();
        const ignoredLower = ignoredNormalized.map((x) => String(x).toLowerCase());
        if (ignoredLower.includes(l)) return false;
        if (l.startsWith("specifications") && ignoredLower.includes("specifications")) return false;
        return true;
    });

    const specificationMissingLabels = Array.from(
        new Set(
            pendingMissingFields
                .filter((field) => String(field).toLowerCase().startsWith("specifications"))
                .map((field) => String(field))
        )
    );
    const hasSpecificationMissing = specificationMissingLabels.length > 0;
    const hasFeaturesMissing = pendingMissingFields.some((f) => {
        const l = String(f).toLowerCase();
        return l === "features" || l.startsWith("features");
    });
    const hasFormBlockingMissing = hasSpecificationMissing || hasFeaturesMissing;

    const handleInputChange = React.useCallback(
        (field: keyof ProductFormData, value: string) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
        },
        [setFormData]
    );

    const handleSpecificationChange = React.useCallback(
        (field: string, value: string) => {
            setFormData((prev) => {
                const updatedSpecifications = { ...prev.specifications, [field]: value };

                const updatedFormData: ProductFormData = {
                    ...prev,
                    specifications: updatedSpecifications,
                };

                if (field === "general_product_type") {
                    updatedFormData.general_product_type = value;
                }

                if (field === "specific_product_type") {
                    updatedFormData.specific_product_type = value;
                }

                return updatedFormData;
            });
        },
        [setFormData]
    );

    const handleRemoveSpecification = React.useCallback(
        (field: string) => {
            setFormData((prev) => {
                const updatedSpecifications = { ...prev.specifications };
                delete updatedSpecifications[field];

                const updatedFormData: ProductFormData = {
                    ...prev,
                    specifications: updatedSpecifications,
                };

                if (field === "general_product_type") {
                    updatedFormData.general_product_type = "";
                }
                if (field === "specific_product_type") {
                    updatedFormData.specific_product_type = "";
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
        },
        [setFormData]
    );

    const handleSpecificationKeyChange = React.useCallback(
        (oldKey: string, newKey: string): string | null => {
            const safeNewKey = newKey.trim();
            if (!safeNewKey) return null;

            const normalizedKey = normalizeSpecificationKey(safeNewKey);
            if (!normalizedKey) return null;

            if (normalizedKey === oldKey) return oldKey;

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

                if (oldKey === "general_product_type") {
                    delete updatedFormData.general_product_type;
                }
                if (oldKey === "specific_product_type") {
                    delete updatedFormData.specific_product_type;
                }

                if (normalizedKey === "general_product_type") {
                    updatedFormData.general_product_type = typeof oldValue === "string" ? oldValue : "";
                }

                if (normalizedKey === "specific_product_type") {
                    updatedFormData.specific_product_type = typeof oldValue === "string" ? oldValue : "";
                }

                return updatedFormData;
            });

            if (duplicateKeyDetected) {
                return null;
            }

            return normalizedKey;
        },
        [normalizeSpecificationKey, setFormData]
    );

    const commitSpecificationKeyChange = React.useCallback(
        (originalKey: string): string => {
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
        },
        [formatSpecificationKeyForDisplay, handleSpecificationKeyChange, specKeyEdits]
    );

    const revertSpecificationKeyEdit = React.useCallback(
        (originalKey: string) => {
            setSpecKeyEdits((prev) => ({
                ...prev,
                [originalKey]: formatSpecificationKeyForDisplay(originalKey),
            }));
            setSpecKeyEditing((prev) => ({
                ...prev,
                [originalKey]: false,
            }));
        },
        [formatSpecificationKeyForDisplay]
    );

    const startSpecKeyEditing = React.useCallback(
        (key: string) => {
            setSpecKeyEdits((prev) => ({
                ...prev,
                [key]: prev[key] ?? formatSpecificationKeyForDisplay(key),
            }));
            setSpecKeyEditing((prev) => ({
                ...prev,
                [key]: true,
            }));
        },
        [formatSpecificationKeyForDisplay]
    );

    const handleSpecKeyInputChange = React.useCallback((key: string, value: string) => {
        setSpecKeyEdits((prev) => ({
            ...prev,
            [key]: value,
        }));
    }, []);

    const handleSpecKeyInputBlur = React.useCallback(
        (key: string) => {
            commitSpecificationKeyChange(key);
        },
        [commitSpecificationKeyChange]
    );

    const handleSpecKeyInputKeyDown = React.useCallback(
        (key: string) => (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
                event.preventDefault();
                commitSpecificationKeyChange(key);
            }
            if (event.key === "Escape") {
                event.preventDefault();
                revertSpecificationKeyEdit(key);
            }
        },
        [commitSpecificationKeyChange, revertSpecificationKeyEdit]
    );

    const addAttribute = React.useCallback(() => {
        const value = newAttribute.trim();
        if (!value) return;

        setFormData((prev) => {
            const existing = Array.isArray(prev.specifications.formulation_attributes)
                ? (prev.specifications.formulation_attributes as any[])
                : [];
            return {
                ...prev,
                specifications: {
                    ...prev.specifications,
                    formulation_attributes: [...existing, value],
                },
            };
        });
        setNewAttribute("");
    }, [newAttribute, setFormData]);

    const removeAttribute = React.useCallback(
        (index: number) => {
            setFormData((prev) => {
                const existing = Array.isArray(prev.specifications.formulation_attributes)
                    ? (prev.specifications.formulation_attributes as any[])
                    : [];
                return {
                    ...prev,
                    specifications: {
                        ...prev.specifications,
                        formulation_attributes: existing.filter((_, i) => i !== index),
                    },
                };
            });
        },
        [setFormData]
    );

    const handleFeatureChange = React.useCallback(
        (index: number, field: keyof Feature, value: string) => {
            setFormData((prev) => ({
                ...prev,
                features: (Array.isArray(prev.features) ? prev.features : []).map((feature, i) =>
                    i === index ? { ...feature, [field]: value } : feature
                ),
            }));
        },
        [setFormData]
    );

    const addFeature = React.useCallback(() => {
        setFormData((prev) => ({
            ...prev,
            features: [...(Array.isArray(prev.features) ? prev.features : []), { name: "", description: "" }],
        }));
    }, [setFormData]);

    const removeFeature = React.useCallback(
        (index: number) => {
            setFormData((prev) => ({
                ...prev,
                features: (Array.isArray(prev.features) ? prev.features : []).filter((_, i) => i !== index),
            }));
        },
        [setFormData]
    );

    const resetToOriginal = React.useCallback(() => {
        if (originalScrapedData) {
            const resetData = JSON.parse(JSON.stringify(originalScrapedData)) as ProductFormData;
            setFormData(resetData);
            return;
        }

        setFormData(createEmptyProductFormData());
    }, [originalScrapedData, setFormData]);

    const generateQueryForPipeline = React.useCallback(
        async (
            data: ProductFormData,
            pipeline: "perplexity" | "google_overview" | "chatgpt",
            analysisId?: string
        ): Promise<{ queries: string[]; topQuery: string } | null> => {
            const productContext: ProductContext = {
                general_product_type: data.general_product_type || (data.specifications as any)?.general_product_type || "",
                specific_product_type: data.specific_product_type || (data.specifications as any)?.specific_product_type || "",
                targeted_market: data.targeted_market || "",
                problem_product_is_solving: data.problem_product_is_solving || "",
            };

            const response = await fetch("/api/generate-queries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...productContext,
                    analysisId,
                    pipeline,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error((errorData as any)?.error || `Failed to generate ${pipeline} search queries`);
            }

            const result = await response.json();
            if (result && result.topQuery) {
                return {
                    queries: result.queries || [result.topQuery],
                    topQuery: result.topQuery,
                };
            }
            return null;
        },
        []
    );

    const ensureProductExistsForQueryPersistence = React.useCallback(async (): Promise<string | null> => {
        if (!user) return null;

        if (currentProductId) {
            await updateProductInSupabase(currentProductId, user.id, null);
            return currentProductId;
        }

        const productRecord: OptimizedProduct = {
            id: "temp",
            name: formData.product_name?.trim() || "Untitled Product",
            description: formData.description?.trim() || "No description provided.",
            createdAt: new Date().toISOString(),
            formData: JSON.parse(JSON.stringify(formData)) as ProductFormData,
            analysis: null,
            googleOverviewAnalysis: null,
            chatgptAnalysis: null,
            combinedAnalysis: null,
            sourceLinks: [],
            processedSources: [],
        };

        const newProductId = await saveProductToSupabase(productRecord, user.id, null);
        if (newProductId) {
            setCurrentProductId(newProductId);
            return newProductId;
        }

        return null;
    }, [currentProductId, formData, saveProductToSupabase, setCurrentProductId, updateProductInSupabase, user]);

    const handleSaveProductEdits = React.useCallback(async () => {
        if (!user) {
            closeEditModal();
            router.push("/auth");
            return;
        }

        try {
            await ensureProductExistsForQueryPersistence();
        } finally {
            closeEditModal();
        }
    }, [closeEditModal, ensureProductExistsForQueryPersistence, router, user]);

    const handleGenerateQuery = React.useCallback(async () => {
        if (!user) {
            router.push("/auth");
            return;
        }

        setIsGeneratingQuery(true);
        setQueryGenerationError(null);
        setMissingFields([]);
        setShowMissingFieldsWarning(false);
        setLastExtractionMethod(null);

        try {
            const data: ProductFormData = {
                ...formData,
                features: Array.isArray(formData.features)
                    ? formData.features.filter((f: any) => (f?.name || "").toString().trim() !== "")
                    : [],
                general_product_type: formData.general_product_type || "",
                specific_product_type: formData.specific_product_type || "",
            };

            const [perplexityResult, googleResult, chatgptResult] = await Promise.all([
                generateQueryForPipeline(data, "perplexity"),
                generateQueryForPipeline(data, "google_overview"),
                generateQueryForPipeline(data, "chatgpt"),
            ]);

            if (perplexityResult) {
                setAllPerplexityQueries(perplexityResult.queries || [perplexityResult.topQuery]);
            }
            if (googleResult) {
                setAllGoogleQueries(googleResult.queries || [googleResult.topQuery]);
            }
            if (chatgptResult) {
                setAllChatgptQueries(chatgptResult.queries || [chatgptResult.topQuery]);
            }

            if (!perplexityResult || !googleResult) {
                throw new Error("Failed to generate queries");
            }

            setGeneratedQuery(perplexityResult.topQuery);

            const queryData: QueryData = {
                all: {
                    perplexity: perplexityResult.queries || [perplexityResult.topQuery],
                    google: googleResult.queries || [googleResult.topQuery],
                    chatgpt: chatgptResult?.queries || [],
                },
                used: {
                    perplexity: [],
                    google: [],
                    chatgpt: [],
                },
            };
            setQueryData(queryData);

            const productId = await ensureProductExistsForQueryPersistence();
            if (productId) {
                await saveQueriesToSupabase(user.id);
            }

            setSelectedBatchId(null);
            setActiveSection("query");
            setDashboardActiveSection("queries");
        } catch (error: any) {
            const friendly =
                "A server error occurred while generating search queries. Please check your internet connection and try again.";
            setQueryGenerationError(friendly);
        } finally {
            setIsGeneratingQuery(false);
        }
    }, [
        ensureProductExistsForQueryPersistence,
        formData,
        generateQueryForPipeline,
        router,
        saveQueriesToSupabase,
        setActiveSection,
        setAllChatgptQueries,
        setAllGoogleQueries,
        setAllPerplexityQueries,
        setGeneratedQuery,
        setIsGeneratingQuery,
        setLastExtractionMethod,
        setMissingFields,
        setQueryData,
        setQueryGenerationError,
        setSelectedBatchId,
        setShowMissingFieldsWarning,
        user,
    ]);

    const scrapeProductData = React.useCallback(async () => {
        if (inputMode === "url") {
            if (!formData.url.trim()) {
                setScrapingError("Please enter a valid URL");
                return;
            }

            try {
                new URL(formData.url);
            } catch {
                setScrapingError("Please enter a valid URL format (e.g., https://example.com)");
                return;
            }
        } else {
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
            const response = await fetch("/api/scrape", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(
                    inputMode === "url"
                        ? { url: formData.url, location: selectedLocation }
                        : { text: productText.trim(), location: selectedLocation }
                ),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error((errorData as any)?.error || "Failed to scrape product data");
            }

            const result = await response.json();

            if (result?.success && result?.data) {
                const scrapedData = result.data;

                const enhancedData: ProductFormData = {
                    url: formData.url,
                    product_name: scrapedData.product_name || "",
                    description: scrapedData.description || "",
                    specifications: {
                        ...scrapedData.specifications,
                        general_product_type: scrapedData.general_product_type || "",
                        specific_product_type: scrapedData.specific_product_type || "",
                    },
                    features: scrapedData.features || [{ name: "", description: "" }],
                    targeted_market: scrapedData.targeted_market || "",
                    problem_product_is_solving: scrapedData.problem_product_is_solving || "",
                    general_product_type: scrapedData.general_product_type || "",
                    specific_product_type: scrapedData.specific_product_type || "",
                };

                setFormData(enhancedData);
                setOriginalScrapedData(enhancedData);

                const missing = Array.isArray(result?.missingFields) ? result.missingFields : [];
                setMissingFields(missing);
                setLastExtractionMethod(result?.extractionMethod ?? null);
            } else {
                throw new Error("No data received from scraping service");
            }
        } catch (err: any) {
            setScrapingError(err?.message || "Failed to scrape product data");
        } finally {
            setIsScraping(false);
        }
    }, [
        formData.url,
        inputMode,
        productText,
        selectedLocation,
        setFormData,
        setIgnoredMissingFields,
        setIsScraping,
        setLastExtractionMethod,
        setMissingFields,
        setOriginalScrapedData,
        setScrapingError,
        setShowMissingFieldsWarning,
    ]);

    const surfaceBase = "rgba(13, 15, 20, 0.85)";
    const borderColor = "rgba(46, 212, 122, 0.22)";
    const textPrimary = "#F2F5FA";
    const textSecondary = "rgba(162, 167, 180, 0.88)";
    const accentColor = "#2ED47A";

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

    return (
        <Card
            variant="outlined"
            sx={{
                flex: 1,
                p: { xs: 3, md: 5 },
                mb: 4,
                background: "linear-gradient(135deg, rgba(13, 15, 20, 0.8), rgba(10, 12, 16, 0.9))",
                backdropFilter: "blur(20px)",
                border: `1px solid rgba(46, 212, 122, 0.2)`,
                boxShadow: "0 24px 80px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.05)",
                borderRadius: "24px",
                position: "relative",
                overflow: "hidden",
            }}
        >
            <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 1.5 }}>
                <Typography level="h1" sx={{
                    color: textPrimary,
                    fontSize: { xs: "1.75rem", md: "2.25rem" },
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    textAlign: "center"
                }}>
                    Optimize Your Product for AI Search Engines
                </Typography>
            </Box>
            <Typography level="body-lg" sx={{
                mb: 5,
                textAlign: "center",
                color: textSecondary,
                maxWidth: "700px",
                mx: "auto",
                lineHeight: 1.6,
                fontWeight: 500
            }}>
                Enhance visibility across Perplexity, Google AI Overviews, and ChatGPT with precision-engineered product data.
            </Typography>

            <Box sx={{ mb: 2 }}>
                <FormLabel sx={{ fontWeight: 600, mb: 1.5, display: "block", color: "#ffffff" }}>Input Method</FormLabel>
                <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
                    <Button
                        variant={inputMode === "url" ? "solid" : "outlined"}
                        onClick={() => setInputMode("url")}
                        sx={{
                            flex: 1,
                            py: 1.5,
                            borderRadius: "14px",
                            backgroundColor: inputMode === "url" ? accentColor : "transparent",
                            borderColor: inputMode === "url" ? accentColor : "rgba(46, 212, 122, 0.2)",
                            color: inputMode === "url" ? "#0D0F14" : accentColor,
                            fontWeight: 700,
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            "&:hover": {
                                backgroundColor: inputMode === "url" ? "#26B869" : "rgba(46, 212, 122, 0.08)",
                                borderColor: accentColor,
                                transform: "translateY(-1px)",
                            },
                        }}
                    >
                        🌐 URL Input
                    </Button>
                    <Button
                        variant={inputMode === "text" ? "solid" : "outlined"}
                        onClick={() => setInputMode("text")}
                        sx={{
                            flex: 1,
                            py: 1.5,
                            borderRadius: "14px",
                            backgroundColor: inputMode === "text" ? accentColor : "transparent",
                            borderColor: inputMode === "text" ? accentColor : "rgba(46, 212, 122, 0.2)",
                            color: inputMode === "text" ? "#0D0F14" : accentColor,
                            fontWeight: 700,
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            "&:hover": {
                                backgroundColor: inputMode === "text" ? "#26B869" : "rgba(46, 212, 122, 0.08)",
                                borderColor: accentColor,
                                transform: "translateY(-1px)",
                            },
                        }}
                    >
                        📝 Text Input
                    </Button>
                </Stack>
            </Box>

            {inputMode === "url" ? (
                <Box sx={{ mb: 1.5 }}>
                    <FormLabel sx={{ fontWeight: 600, mb: 0.5, display: "block", color: "#ffffff" }}>Product URL</FormLabel>
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
                        <Input
                            placeholder="https://example.com/your-product"
                            value={formData.url}
                            onChange={(e) => handleInputChange("url", e.target.value)}
                            size="md"
                            sx={{
                                flex: 1,
                                background: "rgba(17, 19, 24, 0.8)",
                                backdropFilter: "blur(8px)",
                                border: "1px solid rgba(46, 212, 122, 0.1)",
                                borderRadius: "12px",
                                minHeight: 44,
                                transition: "all 0.2s ease",
                                "&:focus-within": {
                                    border: "1px solid rgba(46, 212, 122, 0.3)",
                                    backgroundColor: "rgba(17, 19, 24, 0.95)",
                                    boxShadow: "0 0 15px rgba(46, 212, 122, 0.08)",
                                },
                                "& input": {
                                    color: "#ffffff",
                                    fontSize: "0.95rem",
                                    paddingY: 1,
                                },
                                "&::placeholder": {
                                    color: "rgba(255, 255, 255, 0.6)",
                                },
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
                                background: "rgba(17, 19, 24, 0.8)",
                                border: "1px solid rgba(46, 212, 122, 0.1)",
                                borderRadius: "12px",
                                color: textPrimary,
                                transition: "all 0.2s ease",
                                '&:hover': {
                                    borderColor: "rgba(46, 212, 122, 0.3)",
                                    backgroundColor: "rgba(17, 19, 24, 0.9)",
                                },
                            }}
                        >
                            {LOCATION_OPTIONS.map((loc) => (
                                <Option key={loc} value={loc}>
                                    {loc}
                                </Option>
                            ))}
                        </Select>
                        <Button
                            type="button"
                            onClick={() => void scrapeProductData()}
                            loading={isScraping}
                            disabled={!formData.url.trim()}
                            size="md"
                            sx={{
                                minHeight: 48,
                                px: 4,
                                fontSize: "1rem",
                                borderRadius: "14px",
                                fontWeight: 700,
                                backgroundColor: "#2ED47A",
                                color: "#0D0F14",
                                border: "1px solid rgba(46, 212, 122, 0.4)",
                                boxShadow: "0 8px 32px rgba(46, 212, 122, 0.2)",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                "&:hover:not(:disabled)": {
                                    backgroundColor: "#26B869",
                                    borderColor: "rgba(46, 212, 122, 0.6)",
                                    boxShadow: "0 12px 40px rgba(46, 212, 122, 0.3)",
                                    transform: "translateY(-1px)",
                                },
                                "&:disabled": {
                                    backgroundColor: "rgba(46, 212, 122, 0.15)",
                                    borderColor: "rgba(46, 212, 122, 0.1)",
                                    color: "rgba(242, 245, 250, 0.3)",
                                    boxShadow: "none",
                                    cursor: "not-allowed",
                                },
                            }}
                        >
                            {isScraping ? "Fetching Info..." : "Fetch Info"}
                        </Button>
                    </Stack>

                    {scrapingError && (
                        <Typography level="body-sm" sx={{ mt: 1, color: "#f44336", fontSize: "0.875rem" }}>
                            {scrapingError}
                        </Typography>
                    )}
                </Box>
            ) : (
                <Box sx={{ mb: 1.5 }}>
                    <FormLabel sx={{ fontWeight: 600, mb: 0.5, display: "block", color: "#ffffff" }}>Product Description</FormLabel>
                    <Textarea
                        placeholder="Paste your product description, features, specifications, and any relevant details here..."
                        value={productText}
                        onChange={(e) => setProductText(e.target.value)}
                        minRows={4}
                        maxRows={8}
                        sx={{
                            background: "rgba(17, 19, 24, 0.8)",
                            backdropFilter: "blur(8px)",
                            border: "1px solid rgba(46, 212, 122, 0.1)",
                            borderRadius: "12px",
                            color: "#ffffff",
                            fontSize: "0.95rem",
                            transition: "all 0.2s ease",
                            "&:focus-within": {
                                border: "1px solid rgba(46, 212, 122, 0.3)",
                                backgroundColor: "rgba(17, 19, 24, 0.95)",
                                boxShadow: "0 0 15px rgba(46, 212, 122, 0.08)",
                            },
                            "& textarea": {
                                color: "#ffffff",
                                paddingY: 1,
                            },
                            "&::placeholder": {
                                color: "rgba(255, 255, 255, 0.4)",
                            },
                        }}
                    />

                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
                        <Select
                            aria-label="Search Location"
                            value={selectedLocation}
                            onChange={(_, v) => v && setSelectedLocation(v)}
                            size="md"
                            sx={{
                                minWidth: { xs: "100%", sm: 220 },
                                minHeight: 44,
                                background: "rgba(17, 19, 24, 0.8)",
                                border: "1px solid rgba(46, 212, 122, 0.1)",
                                borderRadius: "12px",
                                color: textPrimary,
                                transition: "all 0.2s ease",
                                '&:hover': {
                                    borderColor: "rgba(46, 212, 122, 0.3)",
                                    backgroundColor: "rgba(17, 19, 24, 0.9)",
                                },
                            }}
                        >
                            {LOCATION_OPTIONS.map((loc) => (
                                <Option key={loc} value={loc}>
                                    {loc}
                                </Option>
                            ))}
                        </Select>
                        <Button
                            type="button"
                            onClick={() => void scrapeProductData()}
                            loading={isScraping}
                            disabled={!productText.trim()}
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
                            {isScraping ? "Processing Text..." : "Process Text"}
                        </Button>
                    </Stack>

                    {scrapingError && (
                        <Typography level="body-sm" sx={{ mt: 1, color: "#f44336", fontSize: "0.875rem" }}>
                            {scrapingError}
                        </Typography>
                    )}
                </Box>
            )}

            {formData.product_name && (
                <Box>
                    <Typography level="h3" sx={{
                        mb: 4,
                        textAlign: "center",
                        color: textPrimary,
                        fontWeight: 800,
                        letterSpacing: "0.02em",
                        textTransform: "uppercase",
                        fontSize: "0.875rem",
                        opacity: 0.6,
                        mt: 4
                    }}>
                        Product Intelligence
                    </Typography>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "1fr 1fr 1fr" },
                            gap: 2,
                            mb: 2,
                        }}
                    >
                        <Card
                            sx={{
                                p: 4,
                                cursor: "pointer",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                background: "linear-gradient(135deg, rgba(46, 212, 122, 0.06), rgba(46, 212, 122, 0.02))",
                                backdropFilter: "blur(4px)",
                                border: "1px solid rgba(46, 212, 122, 0.12)",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                                borderRadius: "16px",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
                                    border: "1px solid rgba(46, 212, 122, 0.35)",
                                    background: "linear-gradient(135deg, rgba(46, 212, 122, 0.1), rgba(46, 212, 122, 0.04))",
                                },
                            }}
                            onClick={() => openEditModal("productName")}
                        >
                            <Typography level="title-md" sx={{ mb: 0.5, color: "#ffffff" }}>
                                Product Name
                            </Typography>
                            <Typography level="body-sm" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                                {formData.product_name || "Not specified"}
                            </Typography>
                        </Card>
                        {/* Product Description Card */}
                        <Card
                            sx={{
                                p: 4,
                                cursor: "pointer",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                background: "linear-gradient(135deg, rgba(46, 212, 122, 0.06), rgba(46, 212, 122, 0.02))",
                                backdropFilter: "blur(4px)",
                                border: "1px solid rgba(46, 212, 122, 0.12)",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                                borderRadius: "16px",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
                                    border: "1px solid rgba(46, 212, 122, 0.35)",
                                    background: "linear-gradient(135deg, rgba(46, 212, 122, 0.1), rgba(46, 212, 122, 0.04))",
                                },
                            }}
                            onClick={() => openEditModal("description")}
                        >
                            <Typography level="title-md" sx={{ mb: 1, color: "#ffffff", fontWeight: 700 }}>
                                Description
                            </Typography>
                            <Typography level="body-sm" sx={{ color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.6 }}>
                                {formData.description
                                    ? `${formData.description.substring(0, 100)}${formData.description.length > 100 ? "..." : ""}`
                                    : "Not specified"}
                            </Typography>
                        </Card>

                        {/* Specifications Card */}
                        <Card
                            sx={{
                                p: 4,
                                cursor: "pointer",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                background: "linear-gradient(135deg, rgba(46, 212, 122, 0.06), rgba(46, 212, 122, 0.02))",
                                backdropFilter: "blur(4px)",
                                border: hasSpecificationMissing ? "1px solid rgba(243, 91, 100, 0.55)" : "1px solid rgba(46, 212, 122, 0.12)",
                                position: "relative",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                                borderRadius: "16px",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
                                    border: hasSpecificationMissing ? "1px solid rgba(243, 91, 100, 0.65)" : "1px solid rgba(46, 212, 122, 0.35)",
                                    background: "linear-gradient(135deg, rgba(46, 212, 122, 0.1), rgba(46, 212, 122, 0.04))",
                                },
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
                                            top: 16,
                                            right: 16,
                                            borderRadius: "50%",
                                        }}
                                        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                            event.stopPropagation();
                                            openEditModal("specifications");
                                        }}
                                    >
                                        <EditOutlinedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            <Typography level="title-md" sx={{ mb: 1, color: "#ffffff", fontWeight: 700 }}>
                                Specifications
                            </Typography>
                            {Object.entries(formData.specifications)
                                .filter(([key, value]) => key !== "formulation_attributes" && value && value.toString().trim() !== "")
                                .slice(0, 4)
                                .map(([key, value]) => (
                                    <Typography key={key} level="body-sm" sx={{ color: "rgba(255, 255, 255, 0.8)", mb: 0.5 }}>
                                        <span style={{ fontWeight: 600, color: "rgba(46, 212, 122, 0.9)" }}>{key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}:</span> {value?.toString() || "Not specified"}
                                    </Typography>
                                ))}
                            {hasSpecificationMissing && (
                                <Typography level="body-xs" sx={{ color: "#F35B64", mt: 1.5, fontWeight: 600 }}>
                                    Missing: {specificationMissingLabels.join(", ")}
                                </Typography>
                            )}
                        </Card>

                        <Card
                            sx={{
                                p: 2,
                                cursor: "pointer",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                background: "linear-gradient(135deg, rgba(46, 212, 122, 0.06), rgba(46, 212, 122, 0.02))",
                                backdropFilter: "blur(8px)",
                                border: "1px solid rgba(46, 212, 122, 0.12)",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                                borderRadius: "16px",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
                                    border: "1px solid rgba(46, 212, 122, 0.35)",
                                    background: "linear-gradient(135deg, rgba(46, 212, 122, 0.1), rgba(46, 212, 122, 0.04))",
                                }
                            }}
                            onClick={() => openEditModal("targetMarket")}
                        >
                            <Typography level="title-md" sx={{ mb: 0.5, color: "#ffffff" }}>
                                Targeted Market
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

                        <Card
                            sx={{
                                p: 2,
                                cursor: "pointer",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                background: "linear-gradient(135deg, rgba(46, 212, 122, 0.06), rgba(46, 212, 122, 0.02))",
                                backdropFilter: "blur(8px)",
                                border: "1px solid rgba(46, 212, 122, 0.12)",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                                borderRadius: "16px",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
                                    border: "1px solid rgba(46, 212, 122, 0.35)",
                                    background: "linear-gradient(135deg, rgba(46, 212, 122, 0.1), rgba(46, 212, 122, 0.04))",
                                }
                            }}
                            onClick={() => openEditModal("problemSolved")}
                        >
                            <Typography level="title-md" sx={{ mb: 0.5, color: "#ffffff" }}>
                                Problem Product Is Solving
                            </Typography>
                            <Typography level="body-sm" sx={{ color: "rgba(255, 255, 255, 0.8)" }}>
                                {formData.problem_product_is_solving
                                    ? `${formData.problem_product_is_solving.substring(0, 100)}${formData.problem_product_is_solving.length > 100 ? "..." : ""}`
                                    : "Not specified"}
                            </Typography>
                        </Card>

                        {/* Features Card */}
                        <Card
                            sx={{
                                p: 4,
                                cursor: "pointer",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                background: "linear-gradient(135deg, rgba(46, 212, 122, 0.06), rgba(46, 212, 122, 0.02))",
                                backdropFilter: "blur(4px)",
                                border: hasFeaturesMissing ? "1px solid rgba(243, 91, 100, 0.55)" : "1px solid rgba(46, 212, 122, 0.12)",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
                                borderRadius: "16px",
                                position: "relative",
                                "&:hover": {
                                    transform: "translateY(-4px)",
                                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
                                    border: hasFeaturesMissing ? "1px solid rgba(243, 91, 100, 0.65)" : "1px solid rgba(46, 212, 122, 0.35)",
                                    background: "linear-gradient(135deg, rgba(46, 212, 122, 0.1), rgba(46, 212, 122, 0.04))",
                                },
                            }}
                            onClick={() => openEditModal("features")}
                        >
                            {hasFeaturesMissing && (
                                <Tooltip title="Missing features. Click to add them.">
                                    <IconButton
                                        size="sm"
                                        variant="soft"
                                        color="danger"
                                        sx={{ position: "absolute", top: 16, right: 16, borderRadius: "50%" }}
                                        onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                            event.stopPropagation();
                                            openEditModal("features");
                                        }}
                                    >
                                        <EditOutlinedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            )}
                            <Typography level="title-md" sx={{ mb: 1, color: "#ffffff", fontWeight: 700 }}>
                                Features
                            </Typography>
                            <Typography level="body-sm" sx={{ color: "rgba(255, 255, 255, 0.8)", mb: 2 }}>
                                {formData.features.filter((f) => f.name.trim()).length} features identified
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                {formData.features
                                    .filter((f) => f.name.trim())
                                    .slice(0, 2)
                                    .map((feature, index) => (
                                        <Chip
                                            key={index}
                                            size="sm"
                                            variant="soft"
                                            sx={{
                                                backgroundColor: "rgba(46, 212, 122, 0.1)",
                                                color: "#2ED47A",
                                                border: "1px solid rgba(46, 212, 122, 0.2)",
                                                fontWeight: 600
                                            }}
                                        >
                                            {feature.name}
                                        </Chip>
                                    ))}
                                {formData.features.filter((f) => f.name.trim()).length > 2 && (
                                    <Chip
                                        size="sm"
                                        variant="outlined"
                                        sx={{
                                            color: "rgba(255, 255, 255, 0.6)",
                                            borderColor: "rgba(255, 255, 255, 0.1)"
                                        }}
                                    >
                                        +{formData.features.filter((f) => f.name.trim()).length - 2} more
                                    </Chip>
                                )}
                            </Box>
                        </Card>
                    </Box>

                    {/* Action Buttons */}
                    <Box component="form" onSubmit={(e) => {
                        e.preventDefault();
                        void handleGenerateQuery();
                    }}>
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 3 }}>
                            <Tooltip
                                title={originalScrapedData
                                    ? 'Revert all changes back to the original fetched data'
                                    : 'Clear the form to a blank state'}
                                placement="top"
                                variant="soft"
                            >
                                <Button
                                    type="button"
                                    onClick={resetToOriginal}
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
                                        loading={isGeneratingQuery || isAnalyzing}
                                        disabled={hasFormBlockingMissing}
                                        sx={{
                                            flex: 1,
                                            width: { xs: "100%", sm: "auto" },
                                            minHeight: 46,
                                            borderRadius: "14px",
                                            fontWeight: 700,
                                            fontSize: "1rem",
                                            backgroundColor: "#2ED47A",
                                            color: "#0D0F14",
                                            border: "1px solid rgba(46, 212, 122, 0.4)",
                                            boxShadow: "0 8px 32px rgba(46, 212, 122, 0.2)",
                                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                            px: 4,
                                            "&:hover": {
                                                backgroundColor: "#26B869",
                                                borderColor: "rgba(46, 212, 122, 0.6)",
                                                boxShadow: "0 12px 40px rgba(46, 212, 122, 0.3)",
                                                transform: "translateY(-1px)",
                                            },
                                            "&:disabled": {
                                                backgroundColor: "rgba(46, 212, 122, 0.15)",
                                                borderColor: "rgba(46, 212, 122, 0.1)",
                                                color: "rgba(242, 245, 250, 0.3)",
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

                        {queryGenerationError && (
                            <Typography level="body-sm" sx={{ mt: 1, color: "#f44336", fontSize: "0.875rem" }}>
                                {queryGenerationError}
                            </Typography>
                        )}
                    </Box>
                </Box>
            )}

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
                    <Typography level="h4" sx={{ mb: 2, color: "#ffffff" }}>
                        Edit Product Name
                    </Typography>
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
                    <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: "center" }}>
                        <Box sx={{ flex: 1 }} />
                        <Box sx={{ display: "flex", gap: 1 }}>
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
                                onClick={() => {
                                    void handleSaveProductEdits();
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
                    <Typography level="h4" sx={{ mb: 2, color: "#ffffff" }}>
                        Edit Product Description
                    </Typography>
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
                    <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: "center" }}>
                        <Box />
                        <Box sx={{ flex: 1 }} />
                        <Box sx={{ display: "flex", gap: 1 }}>
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
                                onClick={() => {
                                    void handleSaveProductEdits();
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
                    <Typography level="h4" sx={{ mb: 2, color: "#ffffff" }}>
                        Edit Specifications
                    </Typography>
                    <Box sx={modalContentScrollStyles}>
                        <Stack spacing={2.5}>
                            {Object.entries(formData.specifications || {})
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
                                    {Array.isArray((formData.specifications as any)?.formulation_attributes) &&
                                        (((formData.specifications as any).formulation_attributes as any[]) || []).map((attr: any, index: number) => (
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
                                                {String(attr)}
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
                                    <Button type="button" onClick={addAttribute} variant="outlined" size="sm">
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
                                onClick={() => {
                                    void handleSaveProductEdits();
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
                    <Typography level="h4" sx={{ mb: 2, color: "#ffffff" }}>
                        Edit Features
                    </Typography>
                    <Box sx={modalContentScrollStyles}>
                        <Stack spacing={2.5}>
                            {(Array.isArray(formData.features) ? formData.features : []).map((feature, index) => (
                                <Card
                                    key={index}
                                    variant="outlined"
                                    sx={{ p: 2.25, borderColor: "rgba(216, 180, 254, 0.2)", background: "rgba(139, 92, 246, 0.05)" }}
                                >
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
                            <Button type="button" onClick={addFeature} variant="outlined" sx={{ alignSelf: "flex-start" }}>
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
                                            const next = Array.from(new Set([...(Array.isArray(prev) ? prev : []), 'features']));
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
                                onClick={() => {
                                    void handleSaveProductEdits();
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
                    <Typography level="h4" sx={{ mb: 2, color: "#ffffff" }}>
                        Edit Target Market
                    </Typography>
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
                            <FormLabel sx={{ color: "#ffffff", mb: 1 }}>
                                General Product Type
                            </FormLabel>
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
                            <FormLabel sx={{ color: "#ffffff", mb: 1 }}>
                                Specific Product Type
                            </FormLabel>
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
                            onClick={() => {
                                void handleSaveProductEdits();
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
                    <Typography level="h4" sx={{ mb: 2, color: "#ffffff" }}>
                        Edit Problem Solved
                    </Typography>
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
                            onClick={() => {
                                void handleSaveProductEdits();
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
                            Save
                        </Button>
                    </Stack>
                </ModalDialog>
            </Modal>
        </Card>
    );
}
