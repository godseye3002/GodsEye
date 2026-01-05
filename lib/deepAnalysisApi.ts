export type DeepAnalysisSource = 'google' | 'perplexity';

export interface DeepAnalysisProcessResponse {
  [key: string]: any;
}

export interface DeepAnalysisStatusResponse {
  [key: string]: any;
}

async function postJson<T>(url: string, data: unknown): Promise<T> {
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
    const message =
      (payload && (payload.error || payload.message)) ||
      `Request failed (${res.status})`;
    throw new Error(message);
  }

  return payload as T;
}

export async function startDeepAnalysis(productId: string, source: DeepAnalysisSource) {
  const process = await postJson<DeepAnalysisProcessResponse>('/api/deep-analysis/process', {
    product_id: productId,
    source,
  });

  // lightweight status ping (non-blocking signal for the UI)
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
