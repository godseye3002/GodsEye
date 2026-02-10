/**
 * AI Mode Configuration
 * Handles switching between Google AI Overview and New AI Mode scrapers
 */

export type AIMode = 'google_overview' | 'new_ai_mode';

export interface AIModeConfig {
  mode: AIMode;
  scraperEndpoint: string;
  displayName: string;
  usesJobPolling: boolean;
  pollingInterval?: number;
  maxPollAttempts?: number;
}

export function getAIModeConfig(): AIModeConfig {
  const mode = (process.env.NEXT_PUBLIC_GOOGLE_AI_MODE || 'google_overview') as AIMode;
  
  const configs: Record<AIMode, AIModeConfig> = {
    google_overview: {
      mode: 'google_overview',
      scraperEndpoint: process.env.NEXT_PUBLIC_GOOGLE_OVERVIEW_SCRAPER || '',
      displayName: 'Google AI Overview',
      usesJobPolling: false,
    },
    new_ai_mode: {
      mode: 'new_ai_mode',
      scraperEndpoint: process.env.NEXT_PUBLIC_NEW_AI_MODE_SCRAPER || 'https://discerning-dream-production-a744.up.railway.app/api/v1/scrape',
      displayName: 'New AI Mode',
      usesJobPolling: true,
      pollingInterval: 3000, // 3 seconds
      maxPollAttempts: 60, // 3 minutes total (60 * 3s)
    }
  };
  
  return configs[mode];
}

/**
 * Validates Google Overview scraper response
 */
export function validateGoogleOverviewResponse(data: any): boolean {
  return (
    data?.success !== false &&
    data?.ai_overview_text &&
    data?.ai_overview_text.length > 1
  );
}

/**
 * Validates New AI Mode response
 */
export function validateNewAIResponse(data: any): boolean {
  if (!data) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AI MODE] Validation failed: No data provided`);
    }
    return false;
  }
  
  // Debug: Log the entire structure
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AI MODE] Validating response:`, {
      dataType: typeof data,
      dataKeys: Object.keys(data),
      hasSuccess: 'success' in data,
      successValue: data.success,
      hasData: 'data' in data,
      hasAiOverview: 'ai_overview_text' in data,
      hasContent: 'content' in data,
      fullData: data
    });
  }
  
  // Case 1: Response has nested data structure (expected format)
  if (data.data) {
    const isValid = (
      data.status === 'completed' &&           // Fixed: Check status instead of success
      data.data.success === true &&
      data.data.ai_overview_text &&
      data.data.ai_overview_text.length > 0
    );
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AI MODE] Case 1 (nested data): ${isValid}`);
    }
    return isValid;
  }
  
  // Case 2: Response is flat (no nested data)
  if (data.success === true && data.ai_overview_text) {
    const isValid = data.ai_overview_text.length > 0;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AI MODE] Case 2 (flat + ai_overview): ${isValid}`);
    }
    return isValid;
  }
  
  // Case 3: Response has content field instead of ai_overview_text
  if (data.success === true && data.content) {
    const isValid = data.content.length > 0;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AI MODE] Case 3 (flat + content): ${isValid}`);
    }
    return isValid;
  }
  
  // Case 4: Any response with text content (debug mode)
  if (process.env.NODE_ENV !== 'production') {
    const hasAnyText = data.ai_overview_text || data.content || data.text || data.result;
    if (hasAnyText && hasAnyText.length > 0) {
      console.log(`[AI MODE] Case 4 (debug - any text): Accepting for debugging`);
      return true;
    }
  }
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AI MODE] No validation case matched`);
  }
  return false;
}

/**
 * Transforms New AI Mode response to match Google Overview format
 */
export function transformNewAIResponse(data: any): any {
  let innerData;
  let caseUsed;
  
  // Handle different possible response formats
  if (data.data) {
    // Case 1: Nested data structure
    innerData = data.data;
    caseUsed = 'nested_data';
  } else if (data.success === true && (data.ai_overview_text || data.content)) {
    // Case 2: Flat structure
    innerData = data;
    caseUsed = 'flat_structure';
  } else {
    // Case 3: Debug mode - any response with text content
    const textContent = data.ai_overview_text || data.content || data.text || data.result || '';
    if (textContent && textContent.length > 0) {
      innerData = {
        success: true,
        ai_overview_text: textContent,
        source_links: data.source_links || [],
        job_id: data.job_id,
        query: data.query,
        location: data.location,
        timestamp: data.timestamp
      };
      caseUsed = 'debug_any_text';
    } else {
      throw new Error('New AI Mode response missing required data structure');
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AI MODE] Using transformation case: ${caseUsed}`, {
      originalKeys: Object.keys(data),
      innerDataKeys: Object.keys(innerData),
      hasAiOverview: !!innerData.ai_overview_text,
      hasContent: !!innerData.content,
      textLength: innerData.ai_overview_text?.length || innerData.content?.length || 0
    });
  }

  return {
    success: innerData.success,
    ai_overview_text: innerData.ai_overview_text || innerData.content || '',
    source_links: innerData.source_links || [],
    job_id: innerData.job_id,
    query: innerData.query,
    location: innerData.location,
    timestamp: innerData.timestamp,
  };
}
