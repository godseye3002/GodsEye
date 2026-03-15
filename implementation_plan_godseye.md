# Dashboard Real-Time Data Integration

The Dashboard page currently uses static dummy data from [data.json](file:///c:/Users/santo/OneDrive/Desktop/sunny/GodsEye%20-%20FrontEnd%20with%20Backend%20py/GodsEye%20-%20FrontEnd/godseye/app/Dashboard/data.json). This plan migrates it to use **real Supabase data** by creating:
1. Six new Next.js API routes (mirroring the 6 pseudocode functions).
2. A **shared Zustand store** (`useDashboardDataStore`) that holds the fetched dashboard data.
3. Updated Dashboard UI components that read from the shared store instead of [data.json](file:///c:/Users/santo/OneDrive/Desktop/sunny/GodsEye%20-%20FrontEnd%20with%20Backend%20py/GodsEye%20-%20FrontEnd/godseye/app/Dashboard/data.json).
4. An improved sidebar that reflects the **currently selected product** from the optimize store.

---

## UX Comparison: /optimize vs /Dashboard

| Aspect | /optimize (MUI Joy) | /Dashboard (shadcn/Tailwind) |
|---|---|---|
| Framework | MUI Joy (heavy, MUI-based) | shadcn/ui (lightweight, Tailwind) |
| Sidebar | None — full-page layout | Left collapsible sidebar with engine switcher |
| Data Source | Real-time scraper + Supabase | Currently static [data.json](file:///c:/Users/santo/OneDrive/Desktop/sunny/GodsEye%20-%20FrontEnd%20with%20Backend%20py/GodsEye%20-%20FrontEnd/godseye/app/Dashboard/data.json) |
| Product Context | `currentProductId` in zustand store | Not connected — no product context |
| Engine Tabs | Tabs within the product card | Sidebar items: Perplexity, Google AI Mode, ChatGPT |

---

## User Review Required

> [!IMPORTANT]
> The Dashboard needs to know **which product** to display data for. The most natural approach is to **read `currentProductId` from the existing `useProductStore`** (set by the optimize page when a user selects/creates a product). If no product is selected, the Dashboard will show an "empty state" prompting the user to run an analysis first.

> [!WARNING]  
> The [/api/sov/route.ts](file:///c:/Users/santo/OneDrive/Desktop/sunny/GodsEye%20-%20FrontEnd%20with%20Backend%20py/GodsEye%20-%20FrontEnd/godseye/app/api/sov/route.ts) query for `sov_query_insights` does not currently join with raw scraping tables to get the full prompt text. Pseudocode step 4 requires fetching `original_query_text` from a raw scraping table. I'll implement a best-effort lookup via `analysis_queries` table (already used in `analysis-queries/route.ts`). If the join doesn't return text, the prompt field will show the query hash/id as a fallback.

---

## Proposed Changes

### 1. New API Routes (backend data fetching)

These routes implement the 6 pseudocode functions. All use the Supabase admin client server-side.

---

#### [NEW] [dashboard/top-cards/route.ts](file:///c:/Users/santo/OneDrive/Desktop/sunny/GodsEye%20-%20FrontEnd%20with%20Backend%20py/GodsEye%20-%20FrontEnd/godseye/app/api/dashboard/top-cards/route.ts)
`GET /api/dashboard/top-cards?snapshotId=&engine=`  
→ Queries `sov_product_snapshots` for `brand_coverage`, `total_mentions`, `visibility_rate`, `global_sov_score`, `citation_score`, `avg_dominance_rate`, `avg_conversion_probability`.

#### [NEW] [dashboard/coverage-graph/route.ts](file:///c:/Users/santo/OneDrive/Desktop/sunny/GodsEye%20-%20FrontEnd%20with%20Backend%20py/GodsEye%20-%20FrontEnd/godseye/app/api/dashboard/coverage-graph/route.ts)
`GET /api/dashboard/coverage-graph?productId=&engine=`  
→ Returns ordered time-series data from `sov_product_snapshots` for the line chart.

#### [NEW] [dashboard/brand-ranking/route.ts](file:///c:/Users/santo/OneDrive/Desktop/sunny/GodsEye%20-%20FrontEnd%20with%20Backend%20py/GodsEye%20-%20FrontEnd/godseye/app/api/dashboard/brand-ranking/route.ts)
`GET /api/dashboard/brand-ranking?snapshotId=&engine=`  
→ Queries `brand_visibility_tracking`, groups by brand, computes SOV% and brand coverage.

#### [NEW] [dashboard/top-prompts/route.ts](file:///c:/Users/santo/OneDrive/Desktop/sunny/GodsEye%20-%20FrontEnd%20with%20Backend%20py/GodsEye%20-%20FrontEnd/godseye/app/api/dashboard/top-prompts/route.ts)
`GET /api/dashboard/top-prompts?productId=&engine=&snapshotId=`  
→ Queries `sov_query_insights`, joins with `analysis_queries` for query text, returns ranked list with text snippets and conversion data.

#### [NEW] [dashboard/citation-ranking/route.ts](file:///c:/Users/santo/OneDrive/Desktop/sunny/GodsEye%20-%20FrontEnd%20with%20Backend%20py/GodsEye%20-%20FrontEnd/godseye/app/api/dashboard/citation-ranking/route.ts)
`GET /api/dashboard/citation-ranking?snapshotId=&engine=`  
→ Queries `citation_analytics`, groups by URL, computes citation share.

#### [NEW] [dashboard/client-citations/route.ts](file:///c:/Users/santo/OneDrive/Desktop/sunny/GodsEye%20-%20FrontEnd%20with%20Backend%20py/GodsEye%20-%20FrontEnd/godseye/app/api/dashboard/client-citations/route.ts)
`GET /api/dashboard/client-citations?snapshotId=&engine=`  
→ Same as above but filters `is_client_url = true`. Includes best text_snippet.

---

### 2. Shared Data Store

#### [MODIFY] [store.ts](file:///c:/Users/santo/OneDrive/Desktop/sunny/GodsEye%20-%20FrontEnd%20with%20Backend%20py/GodsEye%20-%20FrontEnd/godseye/lib/store.ts)

Expand the existing `useDashboardStore` to add:
- `snapshotId: string | null` — the current snapshot being viewed
- Dashboard data slices: `topCards`, `coverageGraph`, `brandRanking`, `topPrompts`, `citationRanking`, `clientCitations`
- `isLoading: boolean`, `error: string | null`
- An action `fetchDashboardData(productId, snapshotId, engine)` that calls all 6 API routes in parallel and populates the store.
- **No persistence** — dashboard data is always live-fetched, not stored in localStorage.

---

### 3. Updated Dashboard Components

#### [MODIFY] [page.tsx](file:///c:/Users/santo/OneDrive/Desktop/sunny/GodsEye%20-%20FrontEnd%20with%20Backend%20py/GodsEye%20-%20FrontEnd/godseye/app/Dashboard/page.tsx)
- Read `currentProductId` from `useProductStore`.
- Read `activeEngine` from `useDashboardStore`.
- On mount and on engine/product change → call `fetchDashboardData(productId, snapshotId, activeEngine)`.
- Show a loading skeleton while data loads.
- Show an "empty state" prompt if no product is selected.

#### [MODIFY] [section-cards.tsx](file:///c:/Users/santo/OneDrive/Desktop/sunny/GodsEye%20-%20FrontEnd%20with%20Backend%20py/GodsEye%20-%20FrontEnd/godseye/components/section-cards.tsx)
- Accept data as props from the page (from the store).
- Display `brand_coverage`, `total_mentions`, `visibility_rate` dynamically.
- Show change vs previous snapshot using a trend badge.

#### [MODIFY] [chart-area-interactive.tsx](file:///c:/Users/santo/OneDrive/Desktop/sunny/GodsEye%20-%20FrontEnd%20with%20Backend%20py/GodsEye%20-%20FrontEnd/godseye/components/chart-area-interactive.tsx)
- Accept `coverageGraph` data as props.
- Render each unique `brand_name` in the data as a separate line series dynamically (replaces the hardcoded `client/compA/compB/compC`).

#### [MODIFY] [data-table.tsx](file:///c:/Users/santo/OneDrive/Desktop/sunny/GodsEye%20-%20FrontEnd%20with%20Backend%20py/GodsEye%20-%20FrontEnd/godseye/components/data-table.tsx)
- Accept all four table data arrays as props from the page.
- Remove dependency on [data.json](file:///c:/Users/santo/OneDrive/Desktop/sunny/GodsEye%20-%20FrontEnd%20with%20Backend%20py/GodsEye%20-%20FrontEnd/godseye/app/Dashboard/data.json).
- Add new columns for `avg_dominance_rate`, `conversion_probability`, `conversion_reasoning` in Top Prompts.

---

### 4. Sidebar Enhancement

#### [MODIFY] [app-sidebar.tsx](file:///c:/Users/santo/OneDrive/Desktop/sunny/GodsEye%20-%20FrontEnd%20with%20Backend%20py/GodsEye%20-%20FrontEnd/godseye/components/app-sidebar.tsx)
- Import `useProductStore` to read the product list and `currentProductId`.
- Replace the dummy `NavUser` footer with the actual user info from `useProductStore`'s `userInfo`.
- Add a **product name display** badge in the sidebar header or above the engine tabs to signal which product is currently being analyzed.

#### [MODIFY] [nav-main.tsx](file:///c:/Users/santo/OneDrive/Desktop/sunny/GodsEye%20-%20FrontEnd%20with%20Backend%20py/GodsEye%20-%20FrontEnd/godseye/components/nav-main.tsx)
- Highlight the active engine sub-item (currently no active indicator).
- Minor: show a loading dot next to the engine label while `isLoading` is true.

---

## Verification Plan

### 1. No existing automated tests apply.
The project has no test files under `/app` or `/components`. All verification is manual.

### 2. Manual Verification Steps

**Pre-condition:** You must have at least one product that has been analyzed via the `/optimize` page (so that Supabase has rows in `sov_product_snapshots`, `brand_visibility_tracking`, etc.).

**Step A — Happy path (data loads):**
1. Run `npm run dev`.
2. Log in and navigate to `/optimize`.
3. Select a previously-analyzed product. Confirm `currentProductId` is set (you can check with React DevTools → Zustand).
4. Click the GodsEye sidebar logo or navigate to `/Dashboard`.
5. Click **Perplexity** in the left sidebar under Overview.
6. **Expected:** Top cards show real numbers (Brand Coverage, Mentions, Visibility Rate).
7. **Expected:** Brand Coverage line chart shows a time-series line per brand.
8. **Expected:** The 4 table tabs (Brand Ranking, Top Prompts, Citations Rank, Your Brands Citations Rank) all show real data from Supabase.
9. Click **Google AI Mode** → All data should re-fetch and update.
10. Click **ChatGPT** → Same.

**Step B — Empty state:**
1. Clear the product store (or open in Incognito so no product is selected).
2. Navigate to `/Dashboard`.
3. **Expected:** An empty state message is shown: "No product selected. Please run an analysis on the Optimize page first."

**Step C — Loading state:**
1. On a slow network (DevTools → Network → Slow 3G), navigate to `/Dashboard`.
2. **Expected:** A loading skeleton or spinner is visible while data is being fetched.
