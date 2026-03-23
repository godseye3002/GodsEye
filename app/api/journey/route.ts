import { NextRequest, NextResponse } from "next/server";

const TINYBIRD_TOKEN = process.env.TINYBIRD_TOKEN!;
const JOURNEY_PIPE   = "visitor_journey";

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
  return NextResponse.json(json.data as JourneyRow[]);
}
