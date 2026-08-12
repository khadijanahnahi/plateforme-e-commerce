import { useQuery } from "@tanstack/react-query";
import { couponApi } from "../api/couponApi";

function normalizeCoupons(data) {
  if (Array.isArray(data)) return data;
  return data?.content ?? data?.items ?? [];
}

export function usePublicCoupons({ alwaysFresh = false } = {}) {
  return useQuery({
    queryKey: ["public", "coupons", "active"],
    queryFn: async () => {
      const response = await couponApi.getActivePublicCoupons();
      return normalizeCoupons(response.data);
    },
    staleTime: alwaysFresh ? 0 : 2 * 60_000,
    refetchOnMount: alwaysFresh ? "always" : true,
    refetchOnWindowFocus: alwaysFresh,
  });
}
