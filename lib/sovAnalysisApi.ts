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
        [key: string]: any;
      };
      message?: string;
      [key: string]: any;
    }
  | {
      success?: false;
      error: string;
      status?: number;
      details?: any;
    };

function toUserFriendlyError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'Something went wrong. Please try again.';
}

export async function triggerSovAnalysis({ productId, engine, debug }: SovAnalyzeRequest): Promise<SovAnalyzeResult> {
  try {
    const response = await fetch('/api/sov/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, engine, debug: Boolean(debug) }),
    });

    const text = await response.text();
    let json: any = null;
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

    if (!response.ok) {
      return {
        success: false,
        error: json?.error || 'Failed to start SOV analysis.',
        status: response.status,
        details: json,
      };
    }

    return json as SovAnalyzeResult;
  } catch (err) {
    return { success: false, error: toUserFriendlyError(err) };
  }
}
