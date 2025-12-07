export type Feature = {
  name: string;
  description: string;
};

export type ProductFormData = {
  url: string;
  product_name: string;
  description: string;
  specifications: Record<string, any>;
  features: Feature[];
  targeted_market: string;
  problem_product_is_solving: string;
  general_product_type?: string;
  specific_product_type?: string;
};

export interface ProductContext {
  general_product_type: string;
  specific_product_type: string;
  targeted_market: string;
  problem_product_is_solving: string;
}

export interface OptimizedProductSummary {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface SourceLink {
  text: string;
  url: string;
  raw_url: string;
  highlight_fragment: string | null;
  related_claim: string;
  extraction_order: number;
}

export interface ProcessedSource {
  name: string;
  url: string;
  description: string;
  category?: string;
  Website_Icon_Url?: string | null;
}

export interface OptimizedProduct extends OptimizedProductSummary {
  formData: ProductFormData;
  // Primary analysis (Perplexity) used for optimization_analysis
  analysis?: OptimizationAnalysis | null;
  // Google AI Overview analysis, stored separately
  googleOverviewAnalysis?: OptimizationAnalysis | null;
  // Optional combined view when both Perplexity and Google analyses exist
  combinedAnalysis?: any | null;
  sourceLinks?: SourceLink[];
  processedSources?: ProcessedSource[];
  // Optional list of all related analysis records from product_analyses for history
  analyses?: any[];
}

export interface OptimizationAnalysis {
  executive_summary: {
    title: string;
    status_overview: string;
    strategic_analogy: string;
  };
  client_product_visibility: {
    status: string;
    details: string;
  };
  ai_answer_deconstruction: {
    dominant_narrative: string;
    key_decision_factors: string[];
    trusted_source_analysis: string;
  };
  competitive_landscape_analysis: Array<{
    competitor_name: string;
    reason_for_inclusion: string;
    source_of_mention: string;
  }>;
  sources_ai_used?: Array<{
    source_snippet: string;
    reason_for_inclusion: string;
    source_of_mention: string;
  }>;
  strategic_gap_and_opportunity_analysis: {
    analysis_summary: string;
    if_featured?: {
      current_positioning: string;
      opportunities_for_improvement: string;
    };
    if_not_featured?: {
      primary_reasons_for_omission: string;
      path_to_inclusion: string;
    };
  };
  actionable_recommendations: Array<{
    recommendation: string;
    action: string;
  }>;
}

export const createEmptyProductFormData = (): ProductFormData => ({
  url: "",
  product_name: "",
  description: "",
  specifications: {},
  features: [{ name: "", description: "" }],
  targeted_market: "",
  problem_product_is_solving: "",
  general_product_type: "",
  specific_product_type: "",
});
