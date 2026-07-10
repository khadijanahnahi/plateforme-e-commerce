import { useCallback, useEffect, useState } from "react";
import { adminStockMovementsApi } from "../api/adminStockMovementsApi";

export const stockMovementTypes = [
  "ORDER_CREATED",
  "ORDER_CANCELLED",
  "MANUAL_ADJUSTMENT",
  "RESTOCK",
  "RETURN",
  "DAMAGED",
];

export const emptyStockMovementFilters = {
  productId: "",
  movementType: "",
  orderId: "",
  dateFrom: "",
  dateTo: "",
};

export function useAdminStockMovements() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState(emptyStockMovementFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async (nextFilters = emptyStockMovementFilters, loadProducts = false) => {
    setLoading(true);
    setError("");
    try {
      if (loadProducts) {
        const [movementsResponse, productsResponse] = await Promise.all([
          adminStockMovementsApi.getMovements(nextFilters),
          adminStockMovementsApi.getProducts(),
        ]);
        setMovements(movementsResponse.data);
        setProducts(productsResponse.data);
      } else {
        const response = await adminStockMovementsApi.getMovements(nextFilters);
        setMovements(response.data);
      }
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Impossible de charger l'historique du stock.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(emptyStockMovementFilters, true);
  }, [loadData]);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function applyFilters(event) {
    event?.preventDefault();
    await loadData(filters);
  }

  async function resetFilters() {
    setFilters(emptyStockMovementFilters);
    await loadData(emptyStockMovementFilters);
  }

  return {
    error,
    filters,
    loading,
    movements,
    products,
    applyFilters,
    loadData: () => loadData(filters),
    resetFilters,
    updateFilter,
  };
}
