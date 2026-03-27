// lib/fetchers/supabase-cta.ts
// Plain-fetch helper to query the Supabase `cta_performance` view.

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type CtaPerformanceRow = {
  user_id: string;
  product_id: string;
  cta_label: string;
  page_path: string;
  source: string;
  detected_via: string;
  detection_methods: string;
  click_count: number;
  last_clicked: string;
  sessions_converted: number;
  sessions_visited: number;
  cta_click_rate_pct: number;
};

export async function fetchCtaPerformanceFromSupabase(
  productId: string,
  userId: string,
  pagePath?: string | null,
): Promise<CtaPerformanceRow[]> {
  let url = `${SUPABASE_URL}/rest/v1/cta_performance?product_id=eq.${encodeURIComponent(productId)}&user_id=eq.${encodeURIComponent(userId)}`;

  if (pagePath) {
    url += `&page_path=eq.${encodeURIComponent(pagePath)}`;
  }

  const res = await fetch(url, {
    headers: {
      apikey:         SUPABASE_KEY,
      Authorization:  `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 10 },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Supabase CTA performance fetch failed (${res.status}): ${body}`);
  }

  return res.json();
}
