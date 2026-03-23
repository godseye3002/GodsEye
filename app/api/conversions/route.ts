import { NextRequest, NextResponse } from "next/server";

const TINYBIRD_TOKEN = process.env.TINYBIRD_TOKEN!;
const TINYBIRD_PIPE  = "conversions_by_source";

export type SourceBreakdown = {
  source:                   string;
  detected_via_base:        string;   // "utm" or "referrer"
  conversions:              number;
  entry_conversions:        number;   // first landing
  continuation_conversions: number;   // spa hops
  total_visits:             number;
  conversion_rate:          number;
  last_seen:                string;
};

export type PageConversions = {
  page_path:        string;
  page_description: string;
  total:            number;
  total_visits:     number;
  sources:          SourceBreakdown[];
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("product_id");
  const userId    = searchParams.get("user_id");
  const pagePath  = searchParams.get("page_path");

  if (!productId || !userId) {
    return NextResponse.json(
      { error: "product_id and user_id are required" },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({ product_id: productId, user_id: userId });
  if (pagePath) params.set("page_path", pagePath);

  // Note: Using the base Tinybird API URL as provided in the update
  const url = `https://api.us-east.aws.tinybird.co/v0/pipes/${TINYBIRD_PIPE}.json?${params}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TINYBIRD_TOKEN}` },
    next: { revalidate: 10 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Tinybird fetch failed" }, { status: 500 });
  }

  const json = await res.json();
  return NextResponse.json(groupByPage(json.data));
}

type RawRow = SourceBreakdown & { user_id: string; product_id: string; page_path: string; page_description: string; };

function groupByPage(rows: RawRow[]): PageConversions[] {
  const map = new Map<string, PageConversions>();
  for (const row of rows) {
    if (!map.has(row.page_path)) {
      map.set(row.page_path, {
        page_path:        row.page_path,
        page_description: row.page_description,
        total:            0,
        total_visits:     0,
        sources:          [],
      });
    }
    const page = map.get(row.page_path)!;
    page.total += row.conversions;
    page.total_visits += row.total_visits;

    const existingSource = page.sources.find(s => s.source === row.source);
    if (existingSource) {
      existingSource.conversions += row.conversions;
      existingSource.entry_conversions += row.entry_conversions;
      existingSource.continuation_conversions += row.continuation_conversions;
      existingSource.total_visits += row.total_visits;
      existingSource.conversion_rate = existingSource.total_visits > 0 
        ? (existingSource.conversions / existingSource.total_visits) * 100 
        : 0;
      if (new Date(row.last_seen) > new Date(existingSource.last_seen)) {
        existingSource.last_seen = row.last_seen;
      }
    } else {
      page.sources.push({
        source:                   row.source,
        detected_via_base:        row.detected_via_base,
        conversions:              row.conversions,
        entry_conversions:        row.entry_conversions,
        continuation_conversions: row.continuation_conversions,
        total_visits:             row.total_visits,
        conversion_rate:          row.conversion_rate,
        last_seen:                row.last_seen,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}
