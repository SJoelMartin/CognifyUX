import { useQuery } from "@tanstack/react-query";
import { fetchAnalytics } from "@/lib/analytics-engine";

export function useAnalytics(timeRange: string = '24h') {
  return useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: () => fetchAnalytics(timeRange),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}
