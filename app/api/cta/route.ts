import { NextRequest, NextResponse } from "next/server";
import { fetchCtaPerformanceFromSupabase } from "@/lib/fetchers/supabase-cta";

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

  try {
    const rows = await fetchCtaPerformanceFromSupabase(productId, userId, pagePath);
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("[CtaAPI] Error:", error.message || error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
