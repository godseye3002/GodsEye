import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

// PUT - Replace an existing analysis with new data
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    const { analysisId } = await params;
    const body = await request.json();
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('[AnalysisReplace] Request body:', body);
    }
    
    const {
      user_id,
      optimization_query,
      google_search_query,
      optimization_analysis,
      google_overview_analysis,
      combined_analysis,
      source_links,
      processed_sources,
      perplexity_raw_serp_results,
      google_raw_serp_results,
    } = body || {};

    if (!analysisId || !user_id) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[AnalysisReplace] Missing required fields:', { analysisId, user_id });
      }
      return NextResponse.json(
        { error: 'Analysis ID and User ID are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    // First, check if the analysis exists and belongs to the user
    let existingAnalysis: any = null;
    let analysisType: 'perplexity' | 'google' | null = null;

    // Check in Perplexity table
    const { data: perplexityData, error: perplexityError } = await (supabaseAdmin as any)
      .from('product_analysis_perplexity')
      .select('*, product:products(user_id)')
      .eq('id', analysisId)
      .single();

    if (!perplexityError && perplexityData && perplexityData.product?.user_id === user_id) {
      existingAnalysis = perplexityData;
      analysisType = 'perplexity';
    } else {
      // Check in Google table
      const { data: googleData, error: googleError } = await (supabaseAdmin as any)
        .from('product_analysis_google')
        .select('*, product:products(user_id)')
        .eq('id', analysisId)
        .single();

      if (!googleError && googleData && googleData.product?.user_id === user_id) {
        existingAnalysis = googleData;
        analysisType = 'google';
      }
    }

    if (!existingAnalysis) {
      return NextResponse.json(
        { error: 'Analysis not found or access denied' },
        { status: 404 }
      );
    }

    let replacedAnalysis: any = null;

    // Replace the analysis based on its type
    if (analysisType === 'perplexity' && optimization_query && optimization_analysis) {
      // Update existing analysis
      const { data, error } = await (supabaseAdmin as any)
        .from('product_analysis_perplexity')
        .update({
          optimization_prompt: optimization_query,
          optimization_analysis,
          citations: source_links ?? [],
          raw_serp_results: perplexity_raw_serp_results || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', analysisId)
        .select()
        .single();

      if (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[AnalysisReplace] Error replacing Perplexity analysis:', error);
        }
        return NextResponse.json(
          { error: 'Failed to replace Perplexity analysis', details: error.message },
          { status: 500 }
        );
      }

      replacedAnalysis = data;
    } else if (analysisType === 'google' && google_search_query && google_overview_analysis) {
      // Update existing analysis
      const { data, error } = await (supabaseAdmin as any)
        .from('product_analysis_google')
        .update({
          search_query: google_search_query,
          google_overview_analysis,
          raw_serp_results: google_raw_serp_results || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', analysisId)
        .select()
        .single();

      if (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('[AnalysisReplace] Error replacing Google analysis:', error);
        }
        return NextResponse.json(
          { error: 'Failed to replace Google analysis', details: error.message },
          { status: 500 }
        );
      }

      replacedAnalysis = data;
    } else {
      // More detailed error message to help debug
      const errorMessage = analysisType === 'perplexity' 
        ? 'Perplexity analysis requires optimization_query and optimization_analysis'
        : analysisType === 'google'
        ? 'Google analysis requires google_search_query and google_overview_analysis'
        : 'Unknown analysis type';
      
      if (process.env.NODE_ENV !== 'production') {
        console.error('[AnalysisReplace] Invalid analysis data:', {
          analysisType,
          errorMessage,
          hasOptimizationQuery: !!optimization_query,
          hasOptimizationAnalysis: !!optimization_analysis,
          hasGoogleQuery: !!google_search_query,
          hasGoogleAnalysis: !!google_overview_analysis
        });
      }
      return NextResponse.json(
        { error: errorMessage, details: 'Invalid analysis data provided for replacement' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: replacedAnalysis,
      analysisType,
      message: 'Analysis replaced successfully'
    });

  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[AnalysisReplace] PUT error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
