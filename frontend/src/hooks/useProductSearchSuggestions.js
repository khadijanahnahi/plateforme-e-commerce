import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { productApi } from "../api/productApi";

export default function useProductSearchSuggestions(query, limit = 6) {
  const normalizedQuery = query.trim();
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    if (normalizedQuery.length < 2) {
      setDebouncedQuery("");
      return undefined;
    }

    const timer = window.setTimeout(() => setDebouncedQuery(normalizedQuery), 300);
    return () => window.clearTimeout(timer);
  }, [normalizedQuery]);

  const request = useQuery({
    queryKey: ["product-search-suggestions", debouncedQuery.toLocaleLowerCase("fr"), limit],
    enabled: debouncedQuery.length >= 2,
    staleTime: 45_000,
    retry: (failureCount, error) => {
      const status = error?.response?.status;
      return ![401, 403].includes(status) && failureCount < 1;
    },
    queryFn: async ({ signal }) => {
      const response = await productApi.searchProductSuggestions(debouncedQuery, limit, signal);
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  return {
    ...request,
    debouncedQuery,
    isDebouncing: normalizedQuery.length >= 2 && debouncedQuery !== normalizedQuery,
    suggestions: normalizedQuery.length >= 2 ? request.data ?? [] : [],
  };
}
