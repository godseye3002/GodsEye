import { create } from 'zustand'

// ── Engine types ──────────────────────────────────────────────
type EngineType = 'Perplexity' | 'Google AI Mode' | 'ChatGPT'

// Map sidebar engine names → API engine parameter values
const ENGINE_API_MAP: Record<EngineType, string> = {
    'Perplexity': 'perplexity',
    'Google AI Mode': 'google',
    'ChatGPT': 'chatgpt',
}

// ── Dashboard data types ──────────────────────────────────────
export interface TopCardsData {
    brand_coverage: number | null
    total_mentions: number | null
    visibility_rate: number | null
    global_sov_score: number | null
    citation_score: number | null
    avg_dominance_rate: number | null
    avg_conversion_probability: number | null
    brand_coverage_trend: number | null
    total_mentions_trend: number | null
    visibility_rate_trend: number | null
    global_sov_score_trend: number | null
    citation_score_trend: number | null
    avg_dominance_rate_trend: number | null
    avg_conversion_probability_trend: number | null
    prev_brand_coverage: number | null
    prev_total_mentions: number | null
    prev_visibility_rate: number | null
    prev_global_sov_score: number | null
    prev_citation_score: number | null
    prev_avg_dominance_rate: number | null
    prev_avg_conversion_probability: number | null
    best_brand_coverage: number | null
    best_total_mentions: number | null
    best_visibility_rate: number | null
    best_global_sov_score: number | null
    best_citation_score: number | null
    best_avg_dominance_rate: number | null
    best_avg_conversion_probability: number | null
}

export interface CoverageGraphPoint {
    date: string
    brand_coverage: number | null
    avg_dominance_rate: number | null
    avg_conversion_probability: number | null
    visibility_rate?: number | null
    citation_score?: number | null
    category_relevance?: number | null
}

export interface BrandCoverageGraphPoint {
    date: string
    [brandKey: string]: string | number | null | undefined
}

export interface BrandInfo {
    name: string
    key: string
    isClient?: boolean
}

export interface BrandRankingItem {
    brand_name: string
    total_mentions: number
    sov_percentage: number
    brand_coverage: number
    mentions_trend?: number | null
    sov_trend?: number | null
    coverage_trend?: number | null
}

export interface TopPromptItem {
    rank: number
    query: string
    run_count: number
    dominance_rate: number
    visibility_occurrence_rate: number
    text_snippet: string | null
    conversion_probability: number | null
    conversion_reasoning: string | null
    dominance_trend?: number | null
    conversion_trend?: number | null
}

export interface CitationRankingItem {
    rank: number
    url: string
    total_mentions: number
    citation_share: number
    rank_change?: number | null
    mentions_trend?: number | null
}

export interface ClientCitationItem {
    rank: number
    url: string
    total_mentions: number
    text_snippet: string | null
    rank_change?: number | null
}

// ── Store interface ───────────────────────────────────────────
interface DashboardStore {
    // Engine & product context
    activeEngine: EngineType
    setActiveEngine: (engine: EngineType) => void

    // UI section
    activeSection: 'overview' | 'product_information' | 'competitors_data' | 'queries' | 'documentation'
    setActiveSection: (section: 'overview' | 'product_information' | 'competitors_data' | 'queries' | 'documentation') => void

    // Snapshot tracking
    snapshotId: string | null
    setSnapshotId: (id: string | null) => void

    // Loading / error
    isLoading: boolean
    error: string | null

    // Data slices
    topCards: TopCardsData | null
    coverageGraph: CoverageGraphPoint[]
    brandCoverageGraph: BrandCoverageGraphPoint[]
    brandCoverageBrands: BrandInfo[]
    brandRanking: BrandRankingItem[]
    topPrompts: TopPromptItem[]
    citationRanking: CitationRankingItem[]
    clientCitations: ClientCitationItem[]
    vishnuGraph: any[]
    shivaGraph: any[]

    // Main fetch action: calls all 6 API routes in parallel
    fetchDashboardData: (productId: string, engine: EngineType) => Promise<void>

    // Reset
    resetDashboardData: () => void
}

const EMPTY_STATE = {
    topCards: null,
    coverageGraph: [],
    brandCoverageGraph: [],
    brandCoverageBrands: [],
    brandRanking: [],
    topPrompts: [],
    citationRanking: [],
    clientCitations: [],
    vishnuGraph: [],
    shivaGraph: [],
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
    activeEngine: 'Perplexity',
    setActiveEngine: (engine) => set({ activeEngine: engine }),

    activeSection: 'overview',
    setActiveSection: (section) => set({ activeSection: section }),

    snapshotId: null,
    setSnapshotId: (id) => set({ snapshotId: id }),

    isLoading: false,
    error: null,

    ...EMPTY_STATE,

    resetDashboardData: () => set({ ...EMPTY_STATE, snapshotId: null, error: null }),

    fetchDashboardData: async (productId: string, engine: EngineType) => {
        // Prevent redundant parallel fetches
        const currentSnapshotId = get().snapshotId
        const activeEngineState = get().activeEngine
        const isLoadingState = get().isLoading

        // We allow fetching if snapshotId is null or if the engine/productId is different
        // But if already loading, we might want to skip.
        if (isLoadingState) return

        set({ isLoading: true, error: null })

        const apiEngine = ENGINE_API_MAP[engine]

        try {
            // Step 1: Resolve the latest snapshot_id for this product + engine
            const snapshotRes = await fetch(`/api/sov?productId=${productId}&engine=${apiEngine}`)
            if (!snapshotRes.ok) {
                const errBody: any = await snapshotRes.json().catch(() => ({}))
                const message = errBody?.error || `No data found for ${engine}. Run an analysis for this engine first.`
                set({
                    ...EMPTY_STATE,
                    snapshotId: null,
                    isLoading: false,
                    error: message,
                })
                return
            }
            const snapshotJson = await snapshotRes.json()
            const snapshotId = snapshotJson?.latestSnapshot?.id

            if ((process.env.NODE_ENV as string) === 'debug') {
                console.log('[DashboardStore] Snapshot resolved:', { productId, engine, apiEngine, snapshotId })
            }

            if (!snapshotId) {
                set({
                    ...EMPTY_STATE,
                    snapshotId: null,
                    isLoading: false,
                    error: `No data found for ${engine}. Run an analysis for this engine first.`,
                })
                return
            }

            set({ snapshotId })

            // Step 2: Fetch all data sources in parallel
            const [topCardsRes, coverageRes, brandCoverageRes, brandRes, promptsRes, citationRes, clientCitRes, vishnuRes, shivaRes] = await Promise.allSettled([
                fetch(`/api/dashboard/top-cards?snapshotId=${snapshotId}&engine=${apiEngine}`).then(r => r.ok ? r.json() : Promise.reject(new Error(`Top cards failed: ${r.status}`))),
                fetch(`/api/dashboard/coverage-graph?productId=${productId}&engine=${apiEngine}`).then(r => r.ok ? r.json() : Promise.reject(new Error(`Coverage graph failed: ${r.status}`))),
                fetch(`/api/dashboard/brand-coverage-graph?productId=${productId}&engine=${apiEngine}`).then(r => r.ok ? r.json() : Promise.reject(new Error(`Brand coverage graph failed: ${r.status}`))),
                fetch(`/api/dashboard/brand-ranking?snapshotId=${snapshotId}&engine=${apiEngine}&productId=${productId}`).then(r => r.ok ? r.json() : Promise.reject(new Error(`Brand ranking failed: ${r.status}`))),
                fetch(`/api/dashboard/top-prompts?productId=${productId}&engine=${apiEngine}&snapshotId=${snapshotId}`).then(r => r.ok ? r.json() : Promise.reject(new Error(`Top prompts failed: ${r.status}`))),
                fetch(`/api/dashboard/citation-ranking?snapshotId=${snapshotId}&engine=${apiEngine}&productId=${productId}`).then(r => r.ok ? r.json() : Promise.reject(new Error(`Citation ranking failed: ${r.status}`))),
                fetch(`/api/dashboard/client-citations?snapshotId=${snapshotId}&engine=${apiEngine}&productId=${productId}`).then(r => r.ok ? r.json() : Promise.reject(new Error(`Client citations failed: ${r.status}`))),
                fetch(`/api/dashboard/vishnu-graph?productId=${productId}&engine=${apiEngine}`).then(r => r.ok ? r.json() : Promise.reject(new Error(`Vishnu graph failed: ${r.status}`))),
                fetch(`/api/dashboard/shiva-graph?productId=${productId}&engine=${apiEngine}`).then(r => r.ok ? r.json() : Promise.reject(new Error(`Shiva graph failed: ${r.status}`))),
            ])

            // Debug logging
            console.log('[DashboardStore] API Results:', {
                topCards: topCardsRes.status === 'fulfilled' ? 'fulfilled' : topCardsRes.reason,
                brandCoverage: brandCoverageRes.status === 'fulfilled'
                    ? { dataLength: brandCoverageRes.value?.data?.length, brandsLength: brandCoverageRes.value?.brands?.length }
                    : brandCoverageRes.reason,
                brandRanking: brandRes.status === 'fulfilled'
                    ? { dataLength: brandRes.value?.data?.length }
                    : brandRes.reason,
                topPrompts: promptsRes.status === 'fulfilled'
                    ? { dataLength: promptsRes.value?.data?.length }
                    : promptsRes.reason,
            })

            set({
                topCards: topCardsRes.status === 'fulfilled' ? topCardsRes.value?.data ?? null : null,
                coverageGraph: coverageRes.status === 'fulfilled' ? coverageRes.value?.data ?? [] : [],
                brandCoverageGraph: brandCoverageRes.status === 'fulfilled' ? brandCoverageRes.value?.data ?? [] : [],
                brandCoverageBrands: brandCoverageRes.status === 'fulfilled' ? brandCoverageRes.value?.brands ?? [] : [],
                brandRanking: brandRes.status === 'fulfilled' ? brandRes.value?.data ?? [] : [],
                topPrompts: promptsRes.status === 'fulfilled' ? promptsRes.value?.data ?? [] : [],
                citationRanking: citationRes.status === 'fulfilled' ? citationRes.value?.data ?? [] : [],
                clientCitations: clientCitRes.status === 'fulfilled' ? clientCitRes.value?.data ?? [] : [],
                vishnuGraph: vishnuRes.status === 'fulfilled' ? vishnuRes.value?.data ?? [] : [],
                shivaGraph: shivaRes.status === 'fulfilled' ? shivaRes.value?.data ?? [] : [],
                isLoading: false,
            })
        } catch (err: any) {
            console.error('[DashboardStore] fetchDashboardData error:', err)
            set({
                ...EMPTY_STATE,
                isLoading: false,
                error: err?.message || 'Failed to load dashboard data',
            })
        }
    },
}))
