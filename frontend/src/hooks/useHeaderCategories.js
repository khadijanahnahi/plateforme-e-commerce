import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "../api/productApi";

function normalizeCategories(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export default function useHeaderCategories() {
  const query = useQuery({
    queryKey: ["public", "categories"],
    queryFn: async () => {
      const response = await productApi.getCategories();
      return normalizeCategories(response.data);
    },
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
  });

  const categories = useMemo(
    () => (query.data ?? [])
      .filter((category) => category?.active !== false && Number(category?.productCount ?? 0) > 0)
      .sort((first, second) => String(first.name ?? "").localeCompare(String(second.name ?? ""), "fr")),
    [query.data],
  );

  return {
    categories,
    error: query.error,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

