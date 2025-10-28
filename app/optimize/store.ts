import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  ProductFormData,
  OptimizationAnalysis,
  OptimizedProduct,
  createEmptyProductFormData,
  ProcessedSource,
} from "./types";

export type FormUpdater =
  | ProductFormData
  | ((prev: ProductFormData) => ProductFormData);

interface UserInfoState {
  name: string;
  email: string;
  avatarUrl?: string | null;
}

interface ProductStoreState {
  formData: ProductFormData;
  originalScrapedData: ProductFormData | null;
  missingFields: string[];
  showMissingFieldsWarning: boolean;
  lastExtractionMethod: string | null;
  generatedQuery: string | null;
  queryGenerationError: string | null;
  optimizationAnalysis: OptimizationAnalysis | null;
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
  setFormData: (updater: FormUpdater) => void;
  setOriginalScrapedData: (data: ProductFormData | null) => void;
  setMissingFields: (fields: string[]) => void;
  setShowMissingFieldsWarning: (value: boolean) => void;
  setLastExtractionMethod: (method: string | null) => void;
  setGeneratedQuery: (query: string | null) => void;
  setQueryGenerationError: (error: string | null) => void;
  setOptimizationAnalysis: (analysis: OptimizationAnalysis | null) => void;
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
  saveProductToSupabase: (product: OptimizedProduct, userId: string, generatedQuery?: string | null) => Promise<string | null>;
  deleteProductFromSupabase: (productId: string, userId: string) => Promise<void>;
  setUserInfo: (info: UserInfoState | null) => void;
  setUserCredits: (credits: number | null) => void;
  adjustUserCredits: (delta: number) => void;
  setProcessedSources: (sources: ProcessedSource[]) => void;
  setSourceLinks: (links: any[]) => void;
}

export const useProductStore = create<ProductStoreState>()(
  persist(
    (set, get) => ({
      formData: createEmptyProductFormData(),
      originalScrapedData: null,
      missingFields: [],
      showMissingFieldsWarning: false,
      lastExtractionMethod: null,
      generatedQuery: null,
      queryGenerationError: null,
      optimizationAnalysis: null,
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
      setLastExtractionMethod: (method) => set({ lastExtractionMethod: method }),
      setGeneratedQuery: (query) => set({ generatedQuery: query }),
      setQueryGenerationError: (error) => set({ queryGenerationError: error }),
      setOptimizationAnalysis: (analysis) => set({ optimizationAnalysis: analysis }),
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
            optimizationAnalysis: product.analysis ?? state.optimizationAnalysis,
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
          analysisError: null,
          scrapingError: null,
          serverError: null,
          isScraping: false,
          isGeneratingQuery: false,
          isAnalyzing: false,
          products: state.products,
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
              analysis: p.optimization_analysis || null,
              sourceLinks: p.source_links || [],
              processedSources: p.processed_sources || [],
            };
          });
          
          set({ products: transformedProducts });
        } catch (error) {
          console.error('Error loading products from Supabase:', error);
        }
      },
      saveProductToSupabase: async (product: OptimizedProduct, userId: string, generatedQuery?: string | null) => {
        try {
          // Extract general_product_type and specific_product_type from specifications if not at top level
          const specs = product.formData.specifications || {};
          const generalType = product.formData.general_product_type || specs.general_product_type || '';
          const specificType = product.formData.specific_product_type || specs.specific_product_type || '';
          
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
              optimization_analysis: product.analysis || null,
              source_links: product.sourceLinks || [],
              processed_sources: product.processedSources || [],
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
          }));
          
          return savedProduct.id; // Return product ID for analysis_history
        } catch (error) {
          console.error('Error saving product to Supabase:', error);
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
    }),
    {
      name: "godseye-product-store",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist important data to survive reloads
        products: state.products,
        userInfo: state.userInfo,
        userCredits: state.userCredits,
        processedSources: state.processedSources,
        sourceLinks: state.sourceLinks,
        formData: state.formData,
        originalScrapedData: state.originalScrapedData,
        optimizationAnalysis: state.optimizationAnalysis,
        generatedQuery: state.generatedQuery,
      }),
    }
  )
);
