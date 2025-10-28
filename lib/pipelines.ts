export type PipelineId = 'perplexity' | 'google_overview' | 'chatgpt' | 'gemini';

export const PIPELINES: Record<PipelineId, { label: string; description: string }> = {
  perplexity: { label: 'Perplexity Search Analysis', description: 'Pipeline using Perplexity search, query generation, scraping, and strategic analysis.' },
  google_overview: { label: 'Google Overview Analysis', description: 'Coming soon: Google AI Overview analysis pipeline.' },
  chatgpt: { label: 'ChatGPT Analysis', description: 'Coming soon: ChatGPT answer analysis pipeline.' },
  gemini: { label: 'Gemini Analysis', description: 'Coming soon: Gemini answer analysis pipeline.' },
};

export const DEFAULT_PIPELINE: PipelineId = 'perplexity';
