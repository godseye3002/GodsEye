import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  createEmptyProductFormData,
  OptimizationAnalysis,
  OptimizedProduct,
  ProcessedSource,
  ProductFormData,
} from "./types";
import { fetchUsedQueriesFromAnalysisClient } from "@/lib/analysis-queries";

export type FormUpdater =
  | ProductFormData
  | ((prev: ProductFormData) => ProductFormData);

interface UserInfoState {
  name: string;
  email: string;
  avatarUrl?: string | null;
}

// New query data structure for comprehensive tracking
export interface QueryData {
  all: {
    perplexity: string[];
    google: string[];
  };
  used: {
    perplexity: string[];
    google: string[];
  };
}

interface ProductStoreState {
  formData: ProductFormData;
  originalScrapedData: ProductFormData | null;
  missingFields: string[];
  showMissingFieldsWarning: boolean;
  ignoredMissingFields: string[];
  lastExtractionMethod: string | null;
  generatedQuery: string | null;
  queryGenerationError: string | null;
  // New fields for all generated queries
  allPerplexityQueries: string[];
  allGoogleQueries: string[];
  selectedPerplexityQueries: string[];
  selectedGoogleQueries: string[];
  usedPerplexityQueries: string[];
  usedGoogleQueries: string[];
  queryData: QueryData | null;
  optimizationAnalysis: OptimizationAnalysis | null;
  googleOverviewAnalysis: OptimizationAnalysis | null;
  analysisError: string | null;
  scrapingError: string | null;
  serverError: string | null;
  isScraping: boolean;
  isGeneratingQuery: boolean;
  isAnalyzing: boolean;
  products: OptimizedProduct[];
  userInfo: UserInfoState | null;
  userCredits: number | null;
  processedSources: ProcessedSource[];
  sourceLinks: any[];
  currentProductId: string | null;
  selectedPipeline: "perplexity" | "google_overview" | "all";
  isNewProductSession: boolean;
  setFormData: (updater: FormUpdater) => void;
  setOriginalScrapedData: (data: ProductFormData | null) => void;
  setMissingFields: (fields: string[]) => void;
  setShowMissingFieldsWarning: (value: boolean) => void;
  setIgnoredMissingFields: (fields: string[] | ((prev: string[]) => string[])) => void;
  setLastExtractionMethod: (method: string | null) => void;
  setGeneratedQuery: (query: string | null) => void;
  setQueryGenerationError: (error: string | null) => void;
  // New setters for query arrays
  setAllPerplexityQueries: (queries: string[]) => void;
  setAllGoogleQueries: (queries: string[]) => void;
  setSelectedPerplexityQueries: (queries: string[]) => void;
  setSelectedGoogleQueries: (queries: string[]) => void;
  setUsedPerplexityQueries: (queries: string[]) => void;
  setUsedGoogleQueries: (queries: string[]) => void;
  setQueryData: (queryData: QueryData | null) => void;
  saveQueriesToSupabase: (userId: string) => Promise<void>;
  setOptimizationAnalysis: (analysis: OptimizationAnalysis | null) => void;
  setGoogleOverviewAnalysis: (analysis: OptimizationAnalysis | null) => void;
  setAnalysisError: (error: string | null) => void;
  setScrapingError: (error: string | null) => void;
  setServerError: (error: string | null) => void;
  setIsScraping: (value: boolean) => void;
  setIsGeneratingQuery: (value: boolean) => void;
  setIsAnalyzing: (value: boolean) => void;
  addProduct: (product: OptimizedProduct) => void;
  loadProduct: (productId: string) => void;
  deleteProduct: (productId: string) => void;
  resetForm: () => void;
  loadProductsFromSupabase: (userId: string) => Promise<void>;
  saveProductToSupabase: (product: OptimizedProduct, userId: string, generatedQueryOverride?: string | null) => Promise<string | null>;
  deleteProductFromSupabase: (productId: string, userId: string) => Promise<void>;
  updateProductInSupabase: (productId: string, userId: string, generatedQueryOverride?: string | null) => Promise<void>;
  setUserInfo: (info: UserInfoState | null) => void;
  setUserCredits: (credits: number | null) => void;
  adjustUserCredits: (delta: number) => void;
  setProcessedSources: (sources: ProcessedSource[]) => void;
  setSourceLinks: (links: any[]) => void;
  setCurrentProductId: (id: string | null) => void;
  setSelectedPipeline: (pipeline: "perplexity" | "google_overview" | "all") => void;
  setIsNewProductSession: (value: boolean) => void;
}

export const useProductStore = create<ProductStoreState>()(
  persist(
    (set, get) => ({
      formData: createEmptyProductFormData(),
      originalScrapedData: null,
      missingFields: [],
      showMissingFieldsWarning: false,
      ignoredMissingFields: [],
      lastExtractionMethod: null,
      generatedQuery: null,
      queryGenerationError: null,
      // New fields for all generated queries
      allPerplexityQueries: [],
      allGoogleQueries: [],
      selectedPerplexityQueries: [],
      selectedGoogleQueries: [],
      usedPerplexityQueries: [],
      usedGoogleQueries: [],
      queryData: null,
      optimizationAnalysis: null,
      googleOverviewAnalysis: null,
      analysisError: null,
      scrapingError: null,
      serverError: null,
      isScraping: false,
      isGeneratingQuery: false,
      isAnalyzing: false,
      products: [],
      userInfo: null,
      userCredits: null,
      processedSources: [],
      sourceLinks: [],
      currentProductId: null,
      selectedPipeline: "all",
      isNewProductSession: false,
      setFormData: (updater) =>
        set((state) => ({
          formData:
            typeof updater === "function"
              ? (updater as (prev: ProductFormData) => ProductFormData)(state.formData)
              : updater,
        })),
      setOriginalScrapedData: (data) => set({ originalScrapedData: data }),
      setMissingFields: (fields) => set({ missingFields: fields }),
      setShowMissingFieldsWarning: (value) => set({ showMissingFieldsWarning: value }),
      setIgnoredMissingFields: (updater) =>
        set((state) => ({
          ignoredMissingFields:
            typeof updater === 'function'
              ? (updater as (prev: string[]) => string[])(state.ignoredMissingFields)
              : updater,
        })),
      setLastExtractionMethod: (method) => set({ lastExtractionMethod: method }),
      setGeneratedQuery: (query) => set({ generatedQuery: query }),
      setQueryGenerationError: (error) => set({ queryGenerationError: error }),
      // New setters for query arrays
      setAllPerplexityQueries: (queries) => set({ allPerplexityQueries: queries }),
      setAllGoogleQueries: (queries) => set({ allGoogleQueries: queries }),
      setSelectedPerplexityQueries: (queries) => set({ selectedPerplexityQueries: queries }),
      setSelectedGoogleQueries: (queries) => set({ selectedGoogleQueries: queries }),
      setUsedPerplexityQueries: (queries) => set({ usedPerplexityQueries: queries }),
      setUsedGoogleQueries: (queries) => set({ usedGoogleQueries: queries }),
      setQueryData: (queryData) => set({ queryData }),
      setOptimizationAnalysis: (analysis) => set({ optimizationAnalysis: analysis }),
      setGoogleOverviewAnalysis: (analysis) => set({ googleOverviewAnalysis: analysis }),
      setAnalysisError: (error) => set({ analysisError: error }),
      setScrapingError: (error) => set({ scrapingError: error }),
      setServerError: (error) => set({ serverError: error }),
      setIsScraping: (value) => set({ isScraping: value }),
      setIsGeneratingQuery: (value) => set({ isGeneratingQuery: value }),
      setIsAnalyzing: (value) => set({ isAnalyzing: value }),
      addProduct: (product) =>
        set((state) => ({
          products: [product, ...state.products.filter((p) => p.id !== product.id)].slice(0, 10),
        })),
      loadProduct: (productId) =>
        set((state) => {
          const product = state.products.find((item) => item.id === productId);
          if (!product) return state;
          return {
            ...state,
            formData: product.formData,
            optimizationAnalysis: product.analysis ?? null,
            googleOverviewAnalysis: product.googleOverviewAnalysis ?? null,
            currentProductId: productId,
            isNewProductSession: false,
          };
        }),
      deleteProduct: (productId) =>
        set((state) => ({
          products: state.products.filter((product) => product.id !== productId),
        })),
      resetForm: () =>
        set((state) => ({
          formData: createEmptyProductFormData(),
          originalScrapedData: null,
          missingFields: [],
          showMissingFieldsWarning: false,
          lastExtractionMethod: null,
          generatedQuery: null,
          queryGenerationError: null,
          optimizationAnalysis: null,
          googleOverviewAnalysis: null,
          analysisError: null,
          scrapingError: null,
          serverError: null,
          isScraping: false,
          isGeneratingQuery: false,
          isAnalyzing: false,
          products: state.products,
          currentProductId: null,
          isNewProductSession: true,
          // Reset query arrays
          allPerplexityQueries: [],
          allGoogleQueries: [],
          selectedPerplexityQueries: [],
          selectedGoogleQueries: [],
          usedPerplexityQueries: [],
          usedGoogleQueries: [],
          queryData: null,
          sourceLinks: [],
          processedSources: [],
        })),
      loadProductsFromSupabase: async (userId: string) => {
        try {
          const response = await fetch(`/api/products?userId=${userId}`);
          if (!response.ok) throw new Error('Failed to load products');
          const { products } = await response.json();
          
          // Transform Supabase products to OptimizedProduct format
          const transformedProducts = products.map((p: any) => {
            const specs = p.specifications || {};
            // Check both top-level fields and specifications object for product types
            const generalType = p.general_product_type || specs.general_product_type || '';
            const specificType = p.specific_product_type || specs.specific_product_type || '';

            // New split analysis tables
            const googleAnalyses = Array.isArray(p.product_analysis_google) ? p.product_analysis_google : [];
            const perplexityAnalyses = Array.isArray(p.product_analysis_perplexity) ? p.product_analysis_perplexity : [];

            // Compute latest Perplexity analysis (if any)
            const latestPerplexity = perplexityAnalyses.length > 0
              ? perplexityAnalyses.reduce((latest: any, curr: any) => {
                  if (!latest) return curr;
                  const latestTime = latest.created_at ? new Date(latest.created_at).getTime() : 0;
                  const currTime = curr.created_at ? new Date(curr.created_at).getTime() : 0;
                  return currTime > latestTime ? curr : latest;
                }, perplexityAnalyses[0])
              : null;

            // Compute latest Google analysis (if any)
            const latestGoogle = googleAnalyses.length > 0
              ? googleAnalyses.reduce((latest: any, curr: any) => {
                  if (!latest) return curr;
                  const latestTime = latest.created_at ? new Date(latest.created_at).getTime() : 0;
                  const currTime = curr.created_at ? new Date(curr.created_at).getTime() : 0;
                  return currTime > latestTime ? curr : latest;
                }, googleAnalyses[0])
              : null;

            // Maintain existing top-level fallbacks for backward compatibility
            const optimizationAnalysis = latestPerplexity?.optimization_analysis ?? p.optimization_analysis ?? null;
            const googleOverviewAnalysis = latestGoogle?.google_overview_analysis ?? p.google_overview_analysis ?? null;

            // We no longer maintain a combined_analysis column in the new tables; keep any legacy value
            const combinedAnalysis = p.combined_analysis ?? null;

            // Source links: prefer citations from latest Perplexity analysis, then legacy product field
            const sourceLinks = latestPerplexity?.citations ?? p.source_links ?? [];
            const processedSources = p.processed_sources ?? [];

            // Synthesize a unified analyses array for backward compatibility (used by history / view result logic)
            const analyses = [
              // Perplexity entries
              ...perplexityAnalyses.map((pa: any) => ({
                id: pa.id,
                optimization_query: pa.optimization_prompt,
                optimization_analysis: pa.optimization_analysis,
                google_search_query: null,
                google_overview_analysis: null,
                combined_analysis: null,
                source_links: pa.citations ?? [],
                processed_sources: [],
                created_at: pa.created_at,
              })),
              // Google entries
              ...googleAnalyses.map((ga: any) => ({
                id: ga.id,
                optimization_query: null,
                optimization_analysis: null,
                google_search_query: ga.search_query,
                google_overview_analysis: ga.google_overview_analysis,
                combined_analysis: null,
                source_links: [],
                processed_sources: [],
                created_at: ga.created_at,
              })),
            ];

            const googleUpToDate = Boolean(p.deep_analysis_google_up_to_date);
            const perplexityUpToDate = Boolean(p.deep_analysis_perplexity_up_to_date);
            const verifiedGoogleHash = p.deep_analysis_google_hash || null;
            const verifiedPerplexityHash = p.deep_analysis_perplexity_hash || null;

            return {
              id: p.id,
              name: p.product_name || 'Untitled Product',
              description: p.description || 'No description',
              createdAt: p.created_at,
              formData: {
                product_name: p.product_name || '',
                url: p.product_url || '',
                description: p.description || '',
                specifications: specs,
                features: p.features || [],
                targeted_market: p.targeted_market || '',
                problem_product_is_solving: p.problem_product_is_solving || '',
                general_product_type: generalType,
                specific_product_type: specificType,
              },
              analysis: optimizationAnalysis,
              googleOverviewAnalysis,
              combinedAnalysis,
              sourceLinks,
              processedSources,
              analyses,
              deep_analysis_google_hash: verifiedGoogleHash,
              deep_analysis_perplexity_hash: verifiedPerplexityHash,
              deep_analysis_google_up_to_date: googleUpToDate,
              deep_analysis_perplexity_up_to_date: perplexityUpToDate,
            };
          });
          
          set((state) => ({
            products: transformedProducts,
            currentProductId:
              // 1. If we have an ID, keep it.
              state.currentProductId 
              // 2. CRITICAL FIX: If we are in a "New Product" session, force it to remain null.
              ? state.currentProductId 
              : (state.isNewProductSession ? null : (transformedProducts[0]?.id || null)),
          }));
          
          // Load query data from the queries table using user_id and product_id
          if (products.length > 0 && userId) {
            // Find the current product from the products list
            const currentState = get();
            const currentProduct = products.find((p: any) => p.id === currentState.currentProductId) || products[0];
            if (process.env.NODE_ENV !== 'production') {
              console.log('[Store] Loading queries for:', { 
                userId, 
                currentProductId: currentState.currentProductId,
                productId: currentProduct.id,
                productName: currentProduct.name 
              });
            }
            try {
              const response = await fetch(`/api/queries?userId=${userId}&productId=${currentProduct.id}`);
              if (response.ok) {
                const { queries } = await response.json();
                if (process.env.NODE_ENV !== 'production') {
                  console.log('[Store] Fetched queries:', { 
                    count: queries?.length || 0,
                    sample: queries?.slice(0, 2).map((q: any) => ({ 
                      id: q.id, 
                      product_id: q.product_id, 
                      text: q.query_text?.substring(0, 50) + '...' 
                    }))
                  });
                }
                
                // Group queries by similar length
                const queryLengths = queries.map((query: any) => ({
                  text: query.query_text,
                  wordCount: query.query_text.trim().split(/\s+/).length
                }));

                // Sort by word count to find natural grouping
                queryLengths.sort((a: any, b: any) => b.wordCount - a.wordCount);

                // Find the natural split point for similar length grouping
                let splitIndex = 0;
                
                // Find the largest gap in word counts to determine grouping
                let largestGap = 0;
                for (let i = 0; i < queryLengths.length - 1; i++) {
                  const gap = queryLengths[i].wordCount - queryLengths[i + 1].wordCount;
                  if (gap > largestGap) {
                    largestGap = gap;
                    splitIndex = i + 1;
                  }
                }

                // If no significant gap found, use median as split point
                if (largestGap < 2) {
                  splitIndex = Math.floor(queryLengths.length / 2);
                }

                // Group into long queries (similar length) and rest
                const allGoogle = queryLengths.slice(0, splitIndex).map((q: any) => q.text).slice(0, 5);
                const allPerplexity = queryLengths.slice(splitIndex).map((q: any) => q.text).slice(0, 5);
                
                // Fetch analysis queries for comparison and update UI state
                const { google: analysisGoogleQueries, perplexity: analysisPerplexityQueries } = 
                  await fetchUsedQueriesFromAnalysisClient(currentProduct.id);

                // Update store with validated query data and analysis table data
                set({
                  allPerplexityQueries: allPerplexity,
                  allGoogleQueries: allGoogle,
                  usedPerplexityQueries: analysisPerplexityQueries,
                  usedGoogleQueries: analysisGoogleQueries,
                  // Don't auto-select queries - user must manually select them
                  selectedPerplexityQueries: [],
                  selectedGoogleQueries: [],
                });
                
                // Update queryData state for consistency
                const queryData: QueryData = {
                  all: {
                    perplexity: allPerplexity,
                    google: allGoogle,
                  },
                  used: {
                    perplexity: analysisPerplexityQueries,
                    google: analysisGoogleQueries,
                  },
                };
                set({ queryData });
              } else {
                // No queries found, set empty state
                set({
                  allPerplexityQueries: [],
                  allGoogleQueries: [],
                  usedPerplexityQueries: [],
                  usedGoogleQueries: [],
                  selectedPerplexityQueries: [],
                  selectedGoogleQueries: [],
                  queryData: null,
                });
              }
            } catch (error) {
              if (process.env.NODE_ENV !== 'production') {
                console.error('[Store] Error loading queries:', error);
              }
              // Set empty state on error
              set({
                allPerplexityQueries: [],
                allGoogleQueries: [],
                usedPerplexityQueries: [],
                usedGoogleQueries: [],
                selectedPerplexityQueries: [],
                selectedGoogleQueries: [],
                queryData: null,
              });
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[Store] Error loading products:', error);
          }
        }
      },
      saveProductToSupabase: async (product: OptimizedProduct, userId: string, generatedQueryOverride?: string | null) => {
        try {
          const specs = product.formData.specifications || {};
          const generalType = product.formData.general_product_type || specs.general_product_type || '';
          const specificType = product.formData.specific_product_type || specs.specific_product_type || '';
          
          // Generate query data for saving
          let generatedQuery = null;
          if (generatedQueryOverride !== undefined) {
            generatedQuery = generatedQueryOverride;
          } else if (product.analysis) {
            // Generate query data from analysis for backward compatibility
            generatedQuery = JSON.stringify({
              root_topic: product.formData.product_name || 'Untitled Product',
              optimization_query: product.analysis,
              google_search_query: product.googleOverviewAnalysis,
            });
          }

          const response = await fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              product_name: product.formData.product_name || 'Untitled Product',
              product_url: product.formData.url || '',
              description: product.formData.description || '',
              specifications: specs,
              features: product.formData.features || [],
              targeted_market: product.formData.targeted_market || '',
              problem_product_is_solving: product.formData.problem_product_is_solving || '',
              general_product_type: generalType,
              specific_product_type: specificType,
              generated_query: generatedQuery || null,
            }),
          });
          
          if (!response.ok) throw new Error('Failed to save product');
          const { product: savedProduct } = await response.json();
          
          // Update local state with saved product
          set((state) => ({
            products: [
              {
                ...product,
                id: savedProduct.id,
                createdAt: savedProduct.created_at,
              },
              ...state.products.filter((p) => p.id !== savedProduct.id),
            ].slice(0, 10),
            currentProductId: savedProduct.id,
            isNewProductSession: false,
          }));
          
          return savedProduct.id; // Return product ID for analysis_history
        } catch (error) {
          console.error('Error saving product to Supabase:', error);
          throw error;
        }
      },
      updateProductInSupabase: async (productId: string, userId: string, generatedQueryOverride?: string | null) => {
        try {
          const state = get();
          const specs = state.formData.specifications || {};
          const generalType = state.formData.general_product_type || specs.general_product_type || '';
          const specificType = state.formData.specific_product_type || specs.specific_product_type || '';

          const response = await fetch('/api/products', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: productId,
              user_id: userId,
              product_name: state.formData.product_name || 'Untitled Product',
              product_url: state.formData.url || '',
              description: state.formData.description || '',
              specifications: specs,
              features: state.formData.features || [],
              targeted_market: state.formData.targeted_market || '',
              problem_product_is_solving: state.formData.problem_product_is_solving || '',
              general_product_type: generalType,
              specific_product_type: specificType,
              generated_query:
                generatedQueryOverride !== undefined
                  ? generatedQueryOverride
                  : state.generatedQuery || null,
            }),
          });

          if (!response.ok) {
            let errorBody: any = null;
            try {
              errorBody = await response.json();
            } catch {
              // ignore JSON parsing errors
            }

            if (response.status === 404) {
              // Signal to callers that the product no longer exists in Supabase
              const notFoundError = new Error('PRODUCT_NOT_FOUND');
              (notFoundError as any).status = 404;
              (notFoundError as any).details = errorBody;
              throw notFoundError;
            }

            const updateError = new Error('Failed to update product');
            (updateError as any).status = response.status;
            (updateError as any).details = errorBody;
            throw updateError;
          }

          const { product: updated } = await response.json();

          set((state) => ({
            products: [
              {
                id: updated.id,
                name: updated.product_name || 'Untitled Product',
                description: updated.description || 'No description',
                createdAt: updated.created_at,
                formData: {
                  product_name: updated.product_name || '',
                  url: updated.product_url || '',
                  description: updated.description || '',
                  specifications: updated.specifications || {},
                  features: updated.features || [],
                  targeted_market: updated.targeted_market || '',
                  problem_product_is_solving: updated.problem_product_is_solving || '',
                  general_product_type: updated.general_product_type || (updated.specifications?.general_product_type ?? ''),
                  specific_product_type: updated.specific_product_type || (updated.specifications?.specific_product_type ?? ''),
                },
                analysis: null, // Analysis now comes from product_analysis_perplexity table
                googleOverviewAnalysis: null, // Analysis now comes from product_analysis_google table
                combinedAnalysis: null,
                sourceLinks: [], // Source links now come from product_analysis_perplexity.citations
                processedSources: [], // Processed sources no longer stored in products table
              },
              ...state.products.filter((p) => p.id !== updated.id),
            ].slice(0, 10),
            currentProductId: updated.id,
          }));
        } catch (error) {
          console.error('Error updating product in Supabase:', error);
          throw error;
        }
      },
      deleteProductFromSupabase: async (productId: string, userId: string) => {
        try {
          const response = await fetch(`/api/products?productId=${productId}&userId=${userId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) throw new Error('Failed to delete product');
          
          // Update local state
          set((state) => ({
            products: state.products.filter((product) => product.id !== productId),
          }));
        } catch (error) {
          console.error('Error deleting product from Supabase:', error);
          throw error;
        }
      },
      setUserInfo: (info) => set({ userInfo: info }),
      setUserCredits: (credits) => set({ userCredits: credits }),
      adjustUserCredits: (delta) =>
        set((state) => {
          if (typeof state.userCredits !== 'number') return state;
          const updated = state.userCredits + delta;
          return { ...state, userCredits: Math.max(0, Math.round(updated)) };
        }),
      setProcessedSources: (sources) => set({ processedSources: sources }),
      setSourceLinks: (links) => set({ sourceLinks: links }),
      setCurrentProductId: (id) =>
        set((state) => ({
          currentProductId: id,
          isNewProductSession: id ? false : state.isNewProductSession,
        })),
      setSelectedPipeline: (pipeline) => set({ selectedPipeline: pipeline }),
      setIsNewProductSession: (value) => set({ isNewProductSession: value }),
      
      // Helper functions for query data management
      saveQueriesToSupabase: async (userId: string) => {
        const state = get();
        if (!state.currentProductId) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[Store] Cannot save queries: no currentProductId');
          }
          return;
        }
        
        // Combine all queries from both categories
        const allQueries = [
          ...state.allPerplexityQueries,
          ...state.allGoogleQueries
        ];
        
        if (allQueries.length === 0) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('[Store] No queries to save');
          }
          return;
        }
        
        if (process.env.NODE_ENV !== 'production') {
          console.log('[Store] Saving queries:', { 
            userId, 
            productId: state.currentProductId,
            queryCount: allQueries.length,
            sampleQueries: allQueries.slice(0, 2)
          });
        }
        
        try {
          const response = await fetch('/api/queries', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              productId: state.currentProductId,
              queries: allQueries,
            }),
          });
          
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to save queries');
          }
          
          if (process.env.NODE_ENV !== 'production') {
            console.log('[Store] Queries saved successfully to queries table');
          }
        } catch (error) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[Store] Error saving queries:', error);
          }
          throw error;
        }
      },
    }),
    {
      name: "godseye-product-store",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version) => {
        // v2: ensure stale cached product objects are dropped so newly added DB fields
        // (e.g., deep_analysis_google_hash / deep_analysis_perplexity_hash) can load.
        if (version < 2) {
          return {
            ...persistedState,
            products: [],
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        // Persist important data to survive reloads
        products: state.products,
        userInfo: state.userInfo,
        userCredits: state.userCredits,
        formData: state.formData,
        originalScrapedData: state.originalScrapedData,
        optimizationAnalysis: state.optimizationAnalysis,
        googleOverviewAnalysis: state.googleOverviewAnalysis,
        generatedQuery: state.generatedQuery,
        currentProductId: state.currentProductId,
        isNewProductSession: state.isNewProductSession,
        missingFields: state.missingFields,
        ignoredMissingFields: state.ignoredMissingFields,
        selectedPipeline: state.selectedPipeline,
        // Do NOT persist query arrays; they should be loaded from Supabase so
        // backend remains the source of truth for generated queries.
        allPerplexityQueries: undefined,
        allGoogleQueries: undefined,
        selectedPerplexityQueries: undefined,
        selectedGoogleQueries: undefined,
        usedPerplexityQueries: undefined,
        usedGoogleQueries: undefined,
        queryData: undefined,
      }),
    }
  )
);
