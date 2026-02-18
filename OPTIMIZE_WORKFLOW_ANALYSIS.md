# Optimize Product AI Workflow Analysis

## Overview
This document analyzes the "Optimize for AI Search" workflow in the GodsEye application. It details the sequence of actions, data flow, error handling, and parallel execution logic triggered by the user.

## Workflow Initiation

**Trigger:** "Optimize for AI Search" button in `app/optimize/page.tsx`.
**Handler:** `handleUseSelectedQueries` (Line ~1634)

### Step 1: Validation & Setup
1.  **User Authentication:** Checks if `user` exists.
2.  **Query Validation:** Ensures queries are selected and not empty. Checks if queries have already been used (prevents re-running used queries via this flow).
3.  **Snapshot Creation:** 
    - Calls `createAnalysisSnapshot` API.
    - Tracks `totalQueries`, `batchId`, and `productId`.
4.  **Mode Detection:** Determines execution mode (`perplexity`, `google_overview`, or `all`) based on selected queries.
5.  **State Update:** Updates `generatedQuery` state to reflect the queries being used.

## Execution Logic

The workflow branches based on the detected mode:
- **Single Pipeline:** Calls `startAnalysisWithSelectedQueries`
- **Dual Pipeline:** Calls `startAnalysisWithBothQueries`

### Parallel Execution Strategy (`startAnalysisWithBothQueries`)

1.  **Credit Check:** 
    - Calculates total required credits (Perplexity count + Google count).
    - Calls `/api/analyze/check-credits`.
    - Block execution if insufficient credits.

2.  **Data Preparation:** `prepareDataForAI(formData)` ensures clean data structure.

3.  **Parallel Scraping & Analysis:**
    - Uses `Promise.all` to run Perplexity and Google pipelines concurrently.
    - Inside each pipeline, `Promise.allSettled` is used to run individual queries in parallel.
    - **Per Query Flow:**
        1.  **Scrape:** Call `callPerplexityScraper` or `callAIScraper`.
        2.  **Strategic Analysis:** Call `/api/strategic-analysis` with scraped data.
        3.  **Source Processing (Perplexity only):** Call `/api/process-sources` to categorize sources.
    - **Partial Success Handling:** If some queries fail, they are logged/warned, but successful ones proceed. Fails completey only if *all* queries fail.

4.  **Data Persistence:**
    - **Product Record:** Creates/Updates product in `products` table via `createProductRecord`.
    - **Query Data:** Updates `queries` table.
    - **Individual Analysis Results:** Saves each successful query execution to `product_analyses` or `product_analysis_google` tables.

5.  **Credit Deduction:**
    - Deducts credits *only* for successful query executions via `/api/analyze`.

6.  **State Updates:**
    - Updates `usedPerplexityQueries` / `usedGoogleQueries`.
    - Sets analysis results in state (`optimizationAnalysis`, `googleOverviewAnalysis`).
    - Updates snapshot status to `completed` or `failed`.

7.  **Navigation:** Redirects to `/results` or `/results/google`.

## Key Components

| Component | Location | Purpose |
| to | to | to |
| `handleUseSelectedQueries` | `app/optimize/page.tsx` | Main entry point |
| `startAnalysisWithBothQueries` | `app/optimize/page.tsx` | Orchestrates parallel execution |
| `prepareDataForAI` | `app/optimize/page.tsx` | Formats product data |
| `callAIScraper` / `callPerplexityScraper` | `lib/ai-scraper.ts` | Interfaces with external scraping APIs |
| `/api/strategic-analysis` | `app/api/strategic-analysis/route.ts` | Generates AI insights |
| `/api/process-sources` | `app/api/process-sources/route.ts` | Categorizes sources |

## Current Optimizations
- **Parallelism:** High concurrency for scraping and analysis.
- **Resiliency:** `Promise.allSettled` prevents one failed query from crashing the whole batch.
- **Data Integrity:** Snapshots track progress; transactions (logical) ensure data consistency; credits deducted only on success.

## Potential Areas for Improvement
1.  **Code Deduplication:** `startAnalysisWithBothQueries` and `startAnalysisWithSelectedQueries` share significant logic. Refactoring into a unified `runAnalysisPipeline` could improve maintainability.
2.  **Granular Feedback:** UI shows a generic "Analyzing..." state. Real-time progress (e.g., "3/5 queries analyzed") could enhance UX.
3.  **Error Recovery:** Better UI prompts for partial failures (e.g., "2 queries failed, would you like to retry them?").
