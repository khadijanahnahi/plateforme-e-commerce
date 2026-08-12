import { useEffect, useMemo, useRef, useState } from "react";
import { adminOrdersApi } from "../api/adminOrdersApi";
import { subscribeAdminRealtime } from "../events/adminRealtime";
import { useToast } from "./useToast";

export const orderStatuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
export const paymentStatuses = ["UNPAID", "PAID", "FAILED"];
export const ADMIN_ORDERS_PAGE_SIZE = 10;

export const allowedTransitions = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export function useAdminOrders(initialSearch = "") {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingOrderActions, setPendingOrderActions] = useState(new Set());
  const inFlightActions = useRef(new Map());

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus = statusFilter ? order.status === statusFilter : true;
      const matchesPayment = paymentFilter ? order.paymentStatus === paymentFilter : true;
      const matchesSearch = normalizedSearch
        ? [
            order.orderNumber,
            order.customerName,
            order.customerPhone,
            order.customerEmail,
          ].some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch))
        : true;

      return matchesStatus && matchesPayment && matchesSearch;
    });
  }, [orders, paymentFilter, search, statusFilter]);

  const summary = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((order) => order.status === "PENDING").length,
    delivered: orders.filter((order) => order.status === "DELIVERED").length,
    unpaid: orders.filter((order) => order.paymentStatus === "UNPAID").length,
  }), [orders]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / ADMIN_ORDERS_PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (safeCurrentPage - 1) * ADMIN_ORDERS_PAGE_SIZE,
    safeCurrentPage * ADMIN_ORDERS_PAGE_SIZE,
  );

  async function refreshOrders() {
    const response = await adminOrdersApi.getAdminOrders();
    setOrders(response.data);
    return response.data;
  }

  async function loadOrders() {
    setLoading(true);
    try {
      await refreshOrders();
      setError("");
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(id, status) {
    if (!status) return;
    return runOrderAction(
      `status:${id}`,
      () => adminOrdersApi.updateOrderStatus(id, status),
      "Statut de la commande mis à jour.",
      "Transition de statut invalide.",
    );
  }

  async function handleMarkAsPaid(id) {
    return runOrderAction(
      `payment:${id}`,
      () => adminOrdersApi.markAsPaid(id),
      "Paiement marqué comme payé.",
      "Impossible de mettre à jour le paiement.",
    );
  }

  function runOrderAction(key, action, successMessage, fallbackError) {
    if (inFlightActions.current.has(key)) return inFlightActions.current.get(key);

    const promise = (async () => {
      setPendingOrderActions((current) => new Set(current).add(key));
      setMessage("");
      setError("");
      try {
        await action();
        toast.success(successMessage);
        await refreshOrders();
        setSelectedStatuses({});
      } catch (exception) {
        const nextError = exception.response?.data?.message ?? fallbackError;
        setError(nextError);
        toast.error(nextError);
      } finally {
        inFlightActions.current.delete(key);
        setPendingOrderActions((current) => {
          const next = new Set(current);
          next.delete(key);
          return next;
        });
      }
    })();

    inFlightActions.current.set(key, promise);
    return promise;
  }

  function isOrderActionPending(key) {
    return pendingOrderActions.has(key);
  }

  function updateSearch(value) {
    setSearch(value);
    setCurrentPage(1);
  }

  function updateStatusFilter(value) {
    setStatusFilter(value);
    setCurrentPage(1);
  }

  function updatePaymentFilter(value) {
    setPaymentFilter(value);
    setCurrentPage(1);
  }

  function updateSelectedStatus(orderId, status) {
    setSelectedStatuses((current) => ({ ...current, [orderId]: status }));
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setPaymentFilter("");
    setCurrentPage(1);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => subscribeAdminRealtime((notification) => {
    if (notification?.type !== "ORDER_CREATED") return;
    refreshOrders().catch(() => {
      setError("Une nouvelle commande est disponible. Impossible d'actualiser la liste automatiquement.");
    });
  }), []);

  return {
    currentPage: safeCurrentPage,
    error,
    filteredOrders,
    loading,
    message,
    orders,
    paginatedOrders,
    paymentFilter,
    search,
    selectedStatuses,
    statusFilter,
    summary,
    totalPages,
    handleMarkAsPaid,
    handleUpdateStatus,
    isOrderActionPending,
    loadOrders,
    refreshOrders,
    resetFilters,
    setCurrentPage,
    setError,
    setMessage,
    updatePaymentFilter,
    updateSearch,
    updateSelectedStatus,
    updateStatusFilter,
  };
}
