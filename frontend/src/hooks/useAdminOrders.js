import { useEffect, useMemo, useState } from "react";
import { adminOrdersApi } from "../api/adminOrdersApi";

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
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

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
    setSelectedStatuses({});
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
    if (!status) {
      return;
    }

    setMessage("");
    setError("");
    try {
      await adminOrdersApi.updateOrderStatus(id, status);
      setMessage("Order status updated.");
      await refreshOrders();
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Invalid status transition.");
    }
  }

  async function handleMarkAsPaid(id) {
    setMessage("");
    setError("");
    try {
      await adminOrdersApi.markAsPaid(id);
      setMessage("Payment marked as paid.");
      await refreshOrders();
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Unable to update payment status.");
    }
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
