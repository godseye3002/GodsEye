// lib/fetchers/supabase-journey.ts
// Plain-fetch helper to query the Supabase `visitor_journey_view` view.
// Returns JourneyRow[] shaped identically to the Tinybird pipe output.

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type SupabaseJourneyRow = {
  user_id:          string;
  product_id:       string;
  source:           string;
  session_id:       number;
  entry_page:       string;
  exit_page:        string;
  path_array:       string[];
  journey:          string;
  pages_visited:    number;
  session_start:    string;
  session_end:      string;
  duration_seconds: number;
};

export async function fetchJourneyFromSupabase(
  productId: string,
  userId: string,
): Promise<SupabaseJourneyRow[]> {
  const url = `${SUPABASE_URL}/rest/v1/visitor_journey_view?product_id=eq.${encodeURIComponent(productId)}&user_id=eq.${encodeURIComponent(userId)}&order=session_start.desc`;

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
    throw new Error(`Supabase journey fetch failed (${res.status}): ${body}`);
  }

  return res.json();
}
