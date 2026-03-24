// lib/fetchers/supabase-conversions.ts
// Plain-fetch helper to query the Supabase `conversions_with_rate` view.
// Returns RAW rows — the API route's groupByPage() shapes them identically
// to the Tinybird output, so hooks + dashboard need zero changes.

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type SupabaseConversionRow = {
  user_id:                  string;
  product_id:               string;
  page_path:                string;
  page_description:         string;
  source:                   string;
  detected_via_base:        string;
  entry_conversions:        number;
  continuation_conversions: number;
  conversions:              number;
  total_visits:             number;
  conversion_rate:          number;
  last_seen:                string;
};

export async function fetchConversionsFromSupabase(
  productId: string,
  userId: string,
  pagePath?: string | null,
): Promise<SupabaseConversionRow[]> {
  let url = `${SUPABASE_URL}/rest/v1/conversions_with_rate?product_id=eq.${encodeURIComponent(productId)}&user_id=eq.${encodeURIComponent(userId)}`;

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
    throw new Error(`Supabase conversions fetch failed (${res.status}): ${body}`);
  }

  return res.json();
}
