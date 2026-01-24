import { getSupabaseAdminClient } from './supabase';

/**
 * Server-side: Fetch used queries from analysis tables for a specific product
 * @param productId - The product ID to filter by
 * @returns Object with arrays of used queries for both engines
 */
export async function fetchUsedQueriesFromAnalysis(productId: string) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();

    // Fetch Google analysis queries
    const { data: googleData, error: googleError } = await (supabaseAdmin as any)
      .from('product_analysis_google')
      .select('search_query')
      .eq('product_id', productId)
      .not('search_query', 'is', null);

    // Fetch Perplexity analysis queries
    const { data: perplexityData, error: perplexityError } = await (supabaseAdmin as any)
      .from('product_analysis_perplexity')
      .select('optimization_prompt')
      .eq('product_id', productId)
      .not('optimization_prompt', 'is', null);

    if (googleError) {
      console.error('[AnalysisQueries] Error fetching Google queries:', googleError);
    }

    if (perplexityError) {
      console.error('[AnalysisQueries] Error fetching Perplexity queries:', perplexityError);
    }

    // Extract and clean query strings
    const googleQueries = (googleData || [])
      .map((row: any) => row.search_query?.trim())
      .filter((query: string | undefined) => query && query.length > 0);

    const perplexityQueries = (perplexityData || [])
      .map((row: any) => row.optimization_prompt?.trim())
      .filter((query: string | undefined) => query && query.length > 0);

    return {
      google: googleQueries,
      perplexity: perplexityQueries,
      errors: {
        google: googleError?.message,
        perplexity: perplexityError?.message
      }
    };

  } catch (error) {
    console.error('[AnalysisQueries] Unexpected error:', error);
    return {
      google: [],
      perplexity: [],
      errors: {
        google: error instanceof Error ? error.message : 'Unknown error',
        perplexity: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Client-side: Fetch used queries from analysis tables via API route
 * @param productId - The product ID to filter by
 * @returns Object with arrays of used queries for both engines
 */
export async function fetchUsedQueriesFromAnalysisClient(productId: string) {
  try {
    const response = await fetch(`/api/analysis-queries?productId=${productId}`);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('[AnalysisQueries] API error:', error);
      return {
        google: [],
        perplexity: [],
        errors: {
          google: error.error || 'API error',
          perplexity: error.error || 'API error'
        }
      };
    }

    const data = await response.json();
    return {
      google: data.google || [],
      perplexity: data.perplexity || [],
      errors: {
        google: null,
        perplexity: null
      }
    };

  } catch (error) {
    console.error('[AnalysisQueries] Client fetch error:', error);
    return {
      google: [],
      perplexity: [],
      errors: {
        google: error instanceof Error ? error.message : 'Network error',
        perplexity: error instanceof Error ? error.message : 'Network error'
      }
    };
  }
}

/**
 * Alternative version that returns combined data for multiple products
 * @param productIds - Array of product IDs
 * @returns Object mapping product IDs to their used queries
 */
export async function fetchUsedQueriesForMultipleProducts(productIds: string[]) {
  try {
    const supabaseAdmin = getSupabaseAdminClient();

    // Fetch Google analysis queries for all products
    const { data: googleData, error: googleError } = await (supabaseAdmin as any)
      .from('product_analysis_google')
      .select('product_id, search_query')
      .in('product_id', productIds)
      .not('search_query', 'is', null);

    // Fetch Perplexity analysis queries for all products
    const { data: perplexityData, error: perplexityError } = await (supabaseAdmin as any)
      .from('product_analysis_perplexity')
      .select('product_id, optimization_prompt')
      .in('product_id', productIds)
      .not('optimization_prompt', 'is', null);

    // Group queries by product_id
    const result: Record<string, { google: string[]; perplexity: string[] }> = {};

    // Initialize result object
    productIds.forEach(id => {
      result[id] = { google: [], perplexity: [] };
    });

    // Process Google queries
    (googleData || []).forEach((row: any) => {
      const query = row.search_query?.trim();
      if (query && query.length > 0 && result[row.product_id]) {
        result[row.product_id].google.push(query);
      }
    });

    // Process Perplexity queries
    (perplexityData || []).forEach((row: any) => {
      const query = row.optimization_prompt?.trim();
      if (query && query.length > 0 && result[row.product_id]) {
        result[row.product_id].perplexity.push(query);
      }
    });

    return {
      data: result,
      errors: {
        google: googleError?.message,
        perplexity: perplexityError?.message
      }
    };

  } catch (error) {
    console.error('[AnalysisQueries] Batch fetch error:', error);
    return {
      data: {},
      errors: {
        google: error instanceof Error ? error.message : 'Unknown error',
        perplexity: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}
