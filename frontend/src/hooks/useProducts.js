import { useEffect, useState } from "react";
import { productApi } from "../api/productApi";

export function useProducts(params = {}) {
  const [products, setProducts] = useState([]);
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
          setProducts(response.data);
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

  return { products, setProducts, loading, error };
}
