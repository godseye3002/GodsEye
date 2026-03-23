// hooks/useConversions.ts
import useSWR from "swr";
import type { PageConversions } from "@/app/api/conversions/route";

const fetcher = async (url: string) => {
  const r = await fetch(url);
  if (!r.ok) {
    const info = await r.json().catch(() => ({}));
    throw new Error(info.error || 'Fetch failed');
  }
  return r.json();
};

export function useConversions({
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

  const { data, error, isLoading } = useSWR<PageConversions[]>(
    productId && userId ? `/api/conversions?${params}` : null,
    fetcher,
    { refreshInterval: interval }
  );

  const grandTotal = Array.isArray(data) 
    ? data.reduce((sum, p) => sum + p.total, 0) 
    : 0;

  const totalVisits = Array.isArray(data)
    ? data.reduce((sum, p) => sum + p.total_visits, 0)
    : 0;
    
  return { data, grandTotal, totalVisits, error, isLoading };
}
