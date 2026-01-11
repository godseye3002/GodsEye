export type SovEngine = 'google' | 'perplexity';

export interface SovAnalyzeRequest {
  productId: string;
  engine: SovEngine;
  debug?: boolean;
}

export type SovAnalyzeResult =
  | {
      success: true;
      data?: {
        global_score?: number;
        narrative?: string;
        [key: string]: unknown;
      };
      message?: string;
      [key: string]: unknown;
    }
  | {
      success?: false;
      error: string;
      status?: number;
      details?: unknown;
    };

function toUserFriendlyError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Something went wrong. Please try again.';
}

export async function triggerSovAnalysis({ productId, engine, debug }: SovAnalyzeRequest): Promise<SovAnalyzeResult> {
  const maxRetries = 2;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/api/sov/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, engine, debug: Boolean(debug) }),
      });

      const text = await response.text();
      let json: unknown = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        return {
          success: false,
          error: 'Server returned an invalid response. Please try again.',
          status: response.status,
          details: text,
        };
      }

      if (response.ok) {
        return json as SovAnalyzeResult;
      }

      // If 502 (cold start) and we have retries left, retry with delay
      if (response.status === 502 && attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 3000);
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[SOV Analysis] Attempt ${attempt + 1} failed with 502, retrying in ${delay}ms...`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Return error for non-retryable failures
      return {
        success: false,
        error: (json && typeof json === 'object' && 'error' in json) ? (json as any).error : 'Failed to start SOV analysis.',
        status: response.status,
        details: json,
      };
    } catch (err) {
      if (attempt === maxRetries) {
        return { success: false, error: toUserFriendlyError(err) };
      }
      
      // Retry network errors too
      const delay = Math.min(1000 * Math.pow(2, attempt), 2000);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[SOV Analysis] Network error on attempt ${attempt + 1}, retrying in ${delay}ms...`, err);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return { success: false, error: 'Max retries exceeded. Please try again.' };
}
