import { supabase } from './supabase';

export type SovEngine = 'google' | 'perplexity';

export interface SovProgressStatus {
  status: 'waiting_for_data' | 'processing' | 'complete';
  totalScrapedCount: number;
  completedAnalysisCount: number;
  progressPercentage: number;
  message: string;
}

/**
 * Checks the progress of SOV Analysis for a given snapshot and engine
 * @param current_snapshot_id The ID of the snapshot to check
 * @param engine The engine ('google' or 'perplexity')
 * @returns Promise<SovProgressStatus> The progress status
 */
export async function checkSovProgress(
  current_snapshot_id: string,
  engine: SovEngine
): Promise<SovProgressStatus> {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 [SOV Progress] Starting check for:', { current_snapshot_id, engine });
    }
    
    // Step 1: Fetch the "Total Scope" (The Scraped Data)
    const analysisTable = engine === 'google' ? 'product_analysis_google' : 'product_analysis_perplexity';
    if (process.env.NODE_ENV === 'development') {
      console.log('📋 [SOV Progress] Step 1: Querying table:', analysisTable);
    }
    
    const { data: scrapedData, error: scrapedError } = await supabase
      .from(analysisTable)
      .select('id')
      .eq('snapshot_id', current_snapshot_id);

    if (scrapedError) {
      console.error('❌ [SOV Progress] Scraped data error:', scrapedError);
      throw new Error(`Failed to fetch scraped data: ${scrapedError.message}`);
    }

    const totalScrapedCount = scrapedData?.length || 0;
    const scrapedIds = scrapedData?.map(row => row.id) || [];
    
    console.log('📊 [SOV Progress] Step 1 Results:', {
      tableName: analysisTable,
      snapshotId: current_snapshot_id,
      totalScrapedCount,
      scrapedIds: scrapedIds.slice(0, 5), // Show first 5 IDs
      allScrapedIds: scrapedIds.length > 5 ? `...(${scrapedIds.length} total)` : scrapedIds
    });

    // Step 2: Fetch the "Completed Work" (The Insights)
    let completedAnalysisCount = 0;

    if (scrapedIds.length > 0) {
      console.log('🔍 [SOV Progress] Step 2: Querying sov_query_insights with IDs:', scrapedIds.length);
      
      const { data: insightsData, error: insightsError } = await supabase
        .from('sov_query_insights')
        .select('id, analysis_id')
        .in('analysis_id', scrapedIds)
        .eq('engine', engine);

      if (insightsError) {
        console.error('❌ [SOV Progress] Insights data error:', insightsError);
        throw new Error(`Failed to fetch insights data: ${insightsError.message}`);
      }

      completedAnalysisCount = insightsData?.length || 0;
      
      console.log('📊 [SOV Progress] Step 2 Results:', {
        insightsFound: completedAnalysisCount,
        insightsIds: insightsData?.map(i => i.analysis_id).slice(0, 5), // Show first 5
        allInsightsIds: insightsData?.length > 5 ? `...(${insightsData.length} total)` : insightsData?.map(i => i.analysis_id)
      });
    } else {
      console.log('📋 [SOV Progress] Step 2: No scraped IDs to check insights for');
    }

    // Step 3: Determine Status
    const progressPercentage = totalScrapedCount > 0 
      ? Math.round((completedAnalysisCount / totalScrapedCount) * 100)
      : 0;

    let status: SovProgressStatus['status'];
    let message: string;

    if (totalScrapedCount === 0) {
      status = 'waiting_for_data';
      message = 'Waiting for Data';
    } else if (completedAnalysisCount < totalScrapedCount) {
      status = 'processing';
      message = `Processing... (${completedAnalysisCount}/${totalScrapedCount})`;
    } else {
      status = 'complete';
      message = 'Complete';
    }

    const result = {
      status,
      totalScrapedCount,
      completedAnalysisCount,
      progressPercentage,
      message
    };

    console.log('🎯 [SOV Progress] Final Result:', {
      ...result,
      logic: `totalScrapedCount(${totalScrapedCount}) vs completedAnalysisCount(${completedAnalysisCount}) = ${status}`
    });

    return result;

  } catch (error) {
    console.error('💥 [SOV Progress] Error:', error);
    return {
      status: 'waiting_for_data',
      totalScrapedCount: 0,
      completedAnalysisCount: 0,
      progressPercentage: 0,
      message: 'Error checking progress'
    };
  }
}

/**
 * Gets the most recent snapshot ID for a product
 * @param productId The product ID to get the latest snapshot for
 * @returns Promise<string | null> The latest snapshot ID or null if none found
 */
export async function getLatestSnapshotId(productId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('analysis_snapshots')
      .select('id')
      .eq('product_id', productId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null;
      }
      throw new Error(`Failed to fetch latest snapshot: ${error.message}`);
    }

    return data?.id || null;
  } catch (error) {
    console.error('Get Latest Snapshot Error:', error);
    return null;
  }
}

/**
 * Combined function to get SOV progress for the latest snapshot
 * @param productId The product ID
 * @param engine The engine ('google' or 'perplexity')
 * @returns Promise<SovProgressStatus> The progress status for the latest snapshot
 */
export async function checkLatestSovProgress(
  productId: string,
  engine: SovEngine
): Promise<SovProgressStatus> {
  const latestSnapshotId = await getLatestSnapshotId(productId);
  
  if (!latestSnapshotId) {
    return {
      status: 'waiting_for_data',
      totalScrapedCount: 0,
      completedAnalysisCount: 0,
      progressPercentage: 0,
      message: 'No analysis snapshot found'
    };
  }

  return checkSovProgress(latestSnapshotId, engine);
}
