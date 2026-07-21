import { useEffect, useState } from "react";
import { productApi } from "../api/productApi";

export function useProducts(params = {}) {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalElements: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      setLoading(true);
      setError("");
      try {
        const response = await productApi.getProducts(params);
        if (mounted) {
          const data = response.data;
          setProducts(data.content ?? data);
          setPagination({
            page: (data.number ?? 0) + 1,
            totalElements: data.totalElements ?? data.length ?? 0,
            totalPages: Math.max(1, data.totalPages ?? 1),
          });
        }
      } catch (exception) {
        if (mounted) {
          setError(exception.response?.data?.message ?? "Impossible de charger les produits.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProducts();
    return () => {
      mounted = false;
    };
  }, [paramsKey]);

  return { products, setProducts, pagination, loading, error };
}
