import { NextRequest, NextResponse } from "next/server";

export type SourceBreakdown = {
  source: string;
  conversions: number;
  total_visits: number;
  conversion_rate: number;
};

export type PageConversions = {
  page_path: string;
  page_description: string;
  total_conversions: number;
  sources: SourceBreakdown[];
};

// Helper to group flat rows by page
function groupByPage(rows: any[]): PageConversions[] {
  const groups: Record<string, PageConversions> = {};

  rows.forEach((row) => {
    const path = row.page_path || "/";
    if (!groups[path]) {
      groups[path] = {
        page_path: path,
        page_description: row.page_description || "Homepage",
        total_conversions: 0,
        sources: [],
      };
    }

    groups[path].total_conversions += row.conversions || 0;
    groups[path].sources.push({
      source: row.source,
      conversions: row.conversions || 0,
      total_visits: row.total_visits || 0,
      conversion_rate: row.conversion_rate || 0,
    });
  });

  return Object.values(groups);
}

export async function GET(req: NextRequest) {
  try {
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

    const TINYBIRD_TOKEN = process.env.TINYBIRD_TOKEN;
    const TINYBIRD_PIPE = "conversions_by_source";

    if (!TINYBIRD_TOKEN) {
      return NextResponse.json(
        { error: "Tinybird configuration error: Token is not set." },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      product_id: productId,
      user_id: userId,
      ...(pagePath ? { page_path: pagePath } : {}),
    });

    const url = `https://api.us-east.aws.tinybird.co/v0/pipes/${TINYBIRD_PIPE}.json?${params}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TINYBIRD_TOKEN}` },
      next: { revalidate: 10 },
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: `Tinybird request failed: ${errorJson.error || res.statusText}` },
        { status: res.status === 401 ? 401 : 500 }
      );
    }

    const data = await res.json();
    const rawRows = data.data || [];
    
    // Safety check: Filter rows in JS to ensure strict isolation 
    // especially if Tinybird pipe doesn't have these parameters configured yet
    const flatRows = rawRows.filter((row: any) => 
      String(row.product_id) === productId && 
      String(row.user_id) === userId
    );
    
    const grouped = groupByPage(flatRows);

    return NextResponse.json(grouped);

  } catch (err: any) {
    console.error("[API Conversions] Internal Error:", err);
    return NextResponse.json(
      { error: "An internal server error occurred.", details: err.message },
      { status: 500 }
    );
  }
}
