import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("product_id");
    const userId    = searchParams.get("user_id");

    // 1. Validate Input
    if (!productId || !userId) {
      return NextResponse.json(
        { error: "product_id and user_id are required" },
        { status: 400 }
      );
    }

    // 2. Configuration Check
    const TINYBIRD_TOKEN = process.env.TINYBIRD_TOKEN;
    const TINYBIRD_PIPE = "conversions_by_source";

    if (!TINYBIRD_TOKEN) {
      console.error("[API Conversions] Error: TINYBIRD_TOKEN environment variable is missing.");
      return NextResponse.json(
        { error: "Tinybird configuration error: Token is not set." },
        { status: 500 }
      );
    }

    // 3. Prepare Fetch
    const params = new URLSearchParams({
      product_id: productId,
      user_id: userId,
    });

    const url = `https://api.us-east.aws.tinybird.co/v0/pipes/${TINYBIRD_PIPE}.json?${params}`;

    // 4. Execute Fetch
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TINYBIRD_TOKEN}` },
      next: { revalidate: 10 },
    });

    // 5. Handle Response
    if (!res.ok) {
      let errorDetail = "";
      try {
        const errorJson = await res.json();
        errorDetail = errorJson.error || JSON.stringify(errorJson);
      } catch {
        errorDetail = `Status ${res.status}: ${res.statusText}`;
      }

      console.error(`[API Conversions] Tinybird API Error: ${errorDetail}`);
      return NextResponse.json(
        { error: `Tinybird request failed: ${errorDetail}` },
        { status: res.status === 401 ? 401 : 500 }
      );
    }

    // 6. Return Data
    const data = await res.json();
    return NextResponse.json(data.data || []);

  } catch (err: any) {
    console.error("[API Conversions] Internal Server Error:", err);
    return NextResponse.json(
      { error: "An internal server error occurred.", details: err.message },
      { status: 500 }
    );
  }
}
