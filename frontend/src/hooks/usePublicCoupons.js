import { useQuery } from "@tanstack/react-query";
import { couponApi } from "../api/couponApi";

function normalizeCoupons(data) {
  if (Array.isArray(data)) return data;
  return data?.content ?? data?.items ?? [];
}

export function usePublicCoupons() {
  return useQuery({
    queryKey: ["public", "coupons", "active"],
    queryFn: async () => {
      const response = await couponApi.getActivePublicCoupons();
      return normalizeCoupons(response.data);
    },
    staleTime: 2 * 60_000,
  });
}
