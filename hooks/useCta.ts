import useSWR from "swr";
import type { CtaPerformanceRow } from "@/lib/fetchers/supabase-cta";

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) {
    const info = await r.json().catch(() => ({}));
    throw new Error(info.error || 'Fetch failed');
  }
  return r.json();
};

export function useCtaPerformance({
  productId,
  userId,
  pagePath,
  interval = 10000,
}: {
  productId: string;
  userId:    string;
  pagePath?: string;
  interval?: number;
}) {
  const params = new URLSearchParams({ product_id: productId, user_id: userId });
  if (pagePath) params.set("page_path", pagePath);

  const { data, error, isLoading } = useSWR<CtaPerformanceRow[]>(
    productId && userId ? `/api/cta?${params}` : null,
    fetcher,
    { refreshInterval: interval }
  );

  return { data, error, isLoading };
}
