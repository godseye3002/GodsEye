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

export type ConversionRow = {
  product_id:  string;
  user_id:     string;
  source:      string;
  conversions: number;
  last_seen:   string;
};

export function useConversions(productId?: string, userId?: string) {
  // Use a stable URL or null if missing keys
  const params = new URLSearchParams({ 
    ...(productId ? { product_id: productId } : {}), 
    ...(userId    ? { user_id: userId } : {}) 
  });
  const url = `/api/conversions?${params.toString()}`;

  // If productId and userId are required for the fetch, use them as the key
  const { data, error, isLoading } = useSWR<ConversionRow[]>(
    productId && userId ? url : null, 
    fetcher,
    { refreshInterval: 10000 }
  );

  return { data, error, isLoading };
}
