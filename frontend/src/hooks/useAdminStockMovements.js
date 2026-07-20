import { useCallback, useEffect, useMemo, useState } from "react";
import { adminStockMovementsApi } from "../api/adminStockMovementsApi";

export const ADMIN_STOCK_MOVEMENTS_PAGE_SIZE = 10;

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
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(
    1,
    Math.ceil(movements.length / ADMIN_STOCK_MOVEMENTS_PAGE_SIZE),
  );
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * ADMIN_STOCK_MOVEMENTS_PAGE_SIZE;
    return movements.slice(start, start + ADMIN_STOCK_MOVEMENTS_PAGE_SIZE);
  }, [currentPage, movements]);

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
      setCurrentPage(1);
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
    currentPage,
    error,
    filters,
    loading,
    movements,
    paginatedMovements,
    products,
    totalPages,
    applyFilters,
    loadData: () => loadData(filters),
    resetFilters,
    setCurrentPage,
    updateFilter,
  };
}
