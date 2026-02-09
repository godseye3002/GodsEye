/**
 * Unified AI Scraper with Job Polling Support
 * Handles both Google Overview (direct) and New AI Mode (job polling)
 */

import axios from 'axios';
import { getAIModeConfig, validateGoogleOverviewResponse, validateNewAIResponse, transformNewAIResponse } from './ai-mode-config';

interface ScraperResponse {
  success: boolean;
  ai_overview_text: string;
  source_links: any[];
  job_id?: string;
  query?: string;
  location?: string;
  timestamp?: string;
}

/**
 * Unified AI scraper function that handles both direct API calls and job polling
 * @param query - Search query
 * @param location - Location for search (default: 'India')
 * @param mode - Optional AI mode override
 * @returns Scraper response with AI overview text and source links
 */
export async function callAIScraper(
  query: string,
  location: string = 'India',
  mode?: 'google_overview' | 'new_ai_mode'
): Promise<ScraperResponse> {
  const config = getAIModeConfig();
  const actualMode = mode || config.mode;

  try {
    if (config.usesJobPolling) {
      // New AI Mode: Job submission + polling pattern
      return await callAIScraperWithJobPolling(query, location, config);
    } else {
      // Google Overview: Direct API call pattern
      return await callAIScraperDirect(query, location, config);
    }
  } catch (error: any) {
    const modeName = config.displayName;
    throw new Error(`Failed to fetch ${modeName} results: ${error.message}`);
  }
}

/**
 * Direct API call pattern (Google Overview)
 */
async function callAIScraperDirect(
  query: string,
  location: string,
  config: ReturnType<typeof getAIModeConfig>
): Promise<ScraperResponse> {
  const response = await axios.post(config.scraperEndpoint, {
    query,
    location,
    max_retries: 3,
  });

  if (process.env.NODE_ENV !== 'production') {
    console.log(`${config.displayName} scraper response:`, response.data);
  }

  const data = response.data;

  if (!data || typeof data !== 'object') {
    throw new Error('Invalid scraper response format');
  }

  if (data.success === false) {
    throw new Error(data.error_message || 'Scraper failed to get AI Overview');
  }

  if (!data.ai_overview_text || data.ai_overview_text.length <= 1) {
    throw new Error('Scraper returned empty or insufficient content');
  }

  return {
    success: true,
    ai_overview_text: data.ai_overview_text,
    source_links: data.source_links || [],
  };
}

/**
 * Job submission + polling pattern (New AI Mode)
 */
async function callAIScraperWithJobPolling(
  query: string,
  location: string,
  config: ReturnType<typeof getAIModeConfig>
): Promise<ScraperResponse> {
  // Step 1: Submit job
  const submitResponse = await axios.post(config.scraperEndpoint, {
    query,
    location,
  });

  if (!submitResponse.data || !submitResponse.data.job_id) {
    throw new Error('Failed to submit job: No job_id returned');
  }

  const { job_id } = submitResponse.data;

  if (process.env.NODE_ENV !== 'production') {
    console.log(`Job submitted with ID: ${job_id}`);
  }

  // Step 2: Poll for results
  const pollingInterval = config.pollingInterval || 3000;
  const maxAttempts = config.maxPollAttempts || 60;
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const pollInterval = setInterval(async () => {
      attempts++;

      if (attempts > maxAttempts) {
        clearInterval(pollInterval);
        if (process.env.NODE_ENV !== 'production') {
          console.error(`[AI SCRAPER] Job polling timeout after ${maxAttempts} attempts for job_id: ${job_id}`);
        }
        reject(new Error('Job polling timeout: Job did not complete within expected time'));
        return;
      }

      try {
        const resultResponse = await axios.get(
          `${config.scraperEndpoint.replace('/api/v1/scrape', '/api/job-result')}/${job_id}`
        );

        const result = resultResponse.data;

        if (process.env.NODE_ENV !== 'production') {
          console.log(`[AI SCRAPER] Poll attempt ${attempts}/${maxAttempts}: Status = ${result.status}`);
          console.log(`[AI SCRAPER] Raw response data:`, JSON.stringify(result, null, 2));
          console.log(`[AI SCRAPER] Response type:`, typeof result);
          console.log(`[AI SCRAPER] Response keys:`, Object.keys(result || {}));
        }

        if (result.status === 'completed') {
          clearInterval(pollInterval);

          if (process.env.NODE_ENV !== 'production') {
            console.log(`[AI SCRAPER] Raw response from server:`, JSON.stringify(result, null, 2));
          }

          // Validate and transform response
          if (!validateNewAIResponse(result)) {
            if (process.env.NODE_ENV !== 'production') {
              console.error(`[AI SCRAPER] Validation failed for response:`, {
                hasSuccess: result?.success,
                hasData: !!result?.data,
                dataSuccess: result?.data?.success,
                hasAiOverview: !!result?.data?.ai_overview_text,
                aiOverviewLength: result?.data?.ai_overview_text?.length || 0,
                hasContent: !!result?.content,
                contentLength: result?.content?.length || 0,
                responseKeys: Object.keys(result || {}),
                fullResponse: result
              });
            }
            reject(new Error('New AI Mode scraper returned invalid response'));
            return;
          }

          const transformedData = transformNewAIResponse(result);

          if (process.env.NODE_ENV !== 'production') {
            console.log(`${config.displayName} scraper response:`, transformedData);
          }

          resolve({
            success: true,
            ai_overview_text: transformedData.ai_overview_text,
            source_links: transformedData.source_links || [],
            job_id: transformedData.job_id,
            query: transformedData.query,
            location: transformedData.location,
            timestamp: transformedData.timestamp,
          });
        } else if (result.status === 'failed') {
          clearInterval(pollInterval);
          reject(new Error(result.error_message || 'Job failed to complete'));
        }
        // If status is 'pending', continue polling
      } catch (error: any) {
        clearInterval(pollInterval);
        reject(new Error(`Polling error: ${error.message}`));
      }
    }, pollingInterval);
  });
}
