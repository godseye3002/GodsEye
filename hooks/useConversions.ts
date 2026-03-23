import useSWR from "swr";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const error = new Error(errorData.error || 'Failed to fetch conversion data');
    (error as any).status = res.status;
    (error as any).info = errorData;
    throw error;
  }
  return res.json();
};

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

export type UseConversionsOptions = {
  productId?: string;
  userId?: string;
  pagePath?: string;
  refreshInterval?: number;
};

/**
 * useConversions Hook 
 * Fetches hierarchical conversion data (Pages -> Sources)
 */
export function useConversions({ 
  productId, 
  userId, 
  pagePath, 
  refreshInterval = 10000 
}: UseConversionsOptions) {
  
  const params = new URLSearchParams({
    ...(productId ? { product_id: productId } : {}),
    ...(userId    ? { user_id: userId } : {}),
    ...(pagePath  ? { page_path: pagePath } : {}),
  });

  const url = `/api/conversions?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<PageConversions[]>(
    productId && userId ? url : null, 
    fetcher,
    { refreshInterval }
  );

  // Derived Values
  const grandTotal = data?.reduce((sum, page) => sum + (page.total_conversions || 0), 0) || 0;

  return { 
    data, 
    error, 
    isLoading, 
    grandTotal, 
    mutate 
  };
}
