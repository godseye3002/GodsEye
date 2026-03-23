// hooks/useJourney.ts
import useSWR from "swr";
import type { JourneyRow } from "@/app/api/journey/route";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useJourney({
  productId,
  userId,
  interval = 10000,
}: {
  productId: string;
  userId:    string;
  interval?: number;
}) {
  const params = new URLSearchParams({ product_id: productId, user_id: userId });

  const { data, error, isLoading } = useSWR<JourneyRow[]>(
    productId && userId ? `/api/journey?${params}` : null,
    fetcher,
    { refreshInterval: interval }
  );

  // Group journeys by source for easy rendering
  const bySource = (data ?? []).reduce<Record<string, JourneyRow[]>>((acc, row) => {
    if (!acc[row.source]) acc[row.source] = [];
    acc[row.source].push(row);
    return acc;
  }, {});

  return { data, bySource, error, isLoading };
}
