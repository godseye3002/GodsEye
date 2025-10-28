import type { PipelineId } from './pipelines';

type Purpose = 'Generate Search Queries' | 'Extract Product Info' | 'Strategic Analysis' | 'Process Sources';

interface Entry {
  pipeline?: PipelineId;
  purpose: Purpose;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  timestamp: number;
}

const store: Map<string, Entry[]> = new Map();

export function addTokens(analysisId: string | undefined, pipeline: PipelineId | undefined, purpose: Purpose, inputTokens: number, outputTokens: number, totalTokens: number) {
  if (!analysisId) return; // if no id provided, skip aggregation
  const list = store.get(analysisId) ?? [];
  list.push({ pipeline, purpose, inputTokens, outputTokens, totalTokens, timestamp: Date.now() });
  store.set(analysisId, list);
}

export function getBreakdown(analysisId: string | undefined) {
  if (!analysisId) return { total: 0, byPurpose: {} as Record<Purpose, number>, byPipeline: {} as Record<string, number>, entries: [] as Entry[] };
  const list = store.get(analysisId) ?? [];
  const byPurpose: Record<Purpose, number> = {
    'Generate Search Queries': 0,
    'Extract Product Info': 0,
    'Strategic Analysis': 0,
    'Process Sources': 0,
  };
  const byPipeline: Record<string, number> = {};
  let total = 0;
  for (const e of list) {
    total += e.totalTokens;
    byPurpose[e.purpose] += e.totalTokens;
    const key = e.pipeline ?? 'unknown';
    byPipeline[key] = (byPipeline[key] ?? 0) + e.totalTokens;
  }
  return { total, byPurpose, byPipeline, entries: list.slice() };
}

export function clearAnalysis(analysisId: string | undefined) {
  if (!analysisId) return;
  store.delete(analysisId);
}
