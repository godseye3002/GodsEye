export type DeepAnalysisSource = 'google' | 'perplexity';

export interface DeepAnalysisProcessResponse {
  [key: string]: any;
}

export interface DeepAnalysisStatusResponse {
  [key: string]: any;
}

async function postJson<T>(url: string, data: unknown, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      if (!res.ok) {
        // If it's a 502 (cold start) and we have retries left, retry with delay
        if (res.status === 502 && attempt < retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Exponential backoff, max 5s
          console.log(`[DeepAnalysis] Attempt ${attempt + 1} failed with 502, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        const message =
          (payload && (payload.error || payload.message)) ||
          `Request failed (${res.status})`;
        throw new Error(message);
      }

      return payload as T;
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      
      // For network errors, also retry with delay
      const delay = Math.min(1000 * Math.pow(2, attempt), 3000);
      console.log(`[DeepAnalysis] Network error on attempt ${attempt + 1}, retrying in ${delay}ms...`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export async function startDeepAnalysis(productId: string, source: DeepAnalysisSource) {
  const process = await postJson<DeepAnalysisProcessResponse>('/api/deep-analysis/process', {
    product_id: productId,
    source,
  });

  // lightweight status ping (non-blocking signal for UI)
  await new Promise((r) => setTimeout(r, 2000));
  const status = await postJson<DeepAnalysisStatusResponse>('/api/deep-analysis/status', {
    product_id: productId,
  });

  return { process, status };
}

export function startGoogleDeepAnalysis(productId: string) {
  return startDeepAnalysis(productId, 'google');
}

export function startPerplexityDeepAnalysis(productId: string) {
  return startDeepAnalysis(productId, 'perplexity');
}
