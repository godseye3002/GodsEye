import { NextRequest, NextResponse } from "next/server";
import { fetchJourneyFromSupabase } from "@/lib/fetchers/supabase-journey";

const TINYBIRD_TOKEN = process.env.TINYBIRD_TOKEN!;
const JOURNEY_PIPE   = "visitor_journey";
const USE_TINYBIRD   = process.env.TINYBIRD === "True";

export type CtaInteraction = {
  cta_label: string;
  page_path: string;
  timestamp: string;
};

export type JourneyRow = {
  user_id:        string;
  product_id:     string;
  source:         string;
  session_id:     number;
  entry_page:     string;
  exit_page:      string;
  path_array:     string[];
  journey:        string;
  pages_visited:  number;
  session_start:  string;
  session_end:    string;
  duration_seconds: number;
  clicked_ctas:   CtaInteraction[];
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("product_id");
  const userId    = searchParams.get("user_id");

  if (!productId || !userId) {
    return NextResponse.json(
      { error: "product_id and user_id are required" },
      { status: 400 }
    );
  }

  try {
    let data: JourneyRow[];

    if (USE_TINYBIRD) {
      // ── Tinybird path (original) ──────────────────────────────────
      const params = new URLSearchParams({ product_id: productId, user_id: userId });
      const url = `https://api.us-east.aws.tinybird.co/v0/pipes/${JOURNEY_PIPE}.json?${params}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${TINYBIRD_TOKEN}` },
        next: { revalidate: 10 },
      });

      if (!res.ok) {
        return NextResponse.json({ error: "Tinybird fetch failed" }, { status: 500 });
      }

      const json = await res.json();
      data = json.data as JourneyRow[];
    } else {
      // ── Supabase path ─────────────────────────────────────────────
      data = await fetchJourneyFromSupabase(productId, userId) as JourneyRow[];
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("[journey] fetch error:", err);
    return NextResponse.json({ error: err.message || "Fetch failed" }, { status: 500 });
  }
}
