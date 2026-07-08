import { useEffect, useMemo, useState } from "react";
import { adminDashboardApi, getApiErrorMessage } from "../api/adminDashboardApi";

export const defaultDashboardStats = {
  totalProducts: 0,
  activeProducts: 0,
  outOfStockProducts: 0,
  archivedProducts: 0,
  totalCategories: 0,
  totalOrders: 0,
  pendingOrders: 0,
  confirmedOrders: 0,
  shippedOrders: 0,
  deliveredOrders: 0,
  cancelledOrders: 0,
  totalUsers: 0,
  totalRevenue: 0,
};

export const dashboardPeriods = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

export function formatDashboardMoney(value) {
  return `${Number(value ?? 0).toFixed(2)} DH`;
}

export function useAdminDashboard() {
  const [period, setPeriod] = useState("all");
  const [stats, setStats] = useState(defaultDashboardStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const cards = useMemo(() => [
    ["Products", stats.totalProducts, "Total catalog items"],
    ["Active", stats.activeProducts, "Visible products"],
    ["Out of stock", stats.outOfStockProducts, "Need restock"],
    ["Archived", stats.archivedProducts, "Soft deleted items"],
    ["Categories", stats.totalCategories, "Shop organization"],
    ["Orders", stats.totalOrders, "All customer orders"],
    ["Pending", stats.pendingOrders, "Awaiting validation"],
    ["Confirmed", stats.confirmedOrders, "Ready to ship"],
    ["Shipped", stats.shippedOrders, "In delivery"],
    ["Delivered", stats.deliveredOrders, "Completed"],
    ["Cancelled", stats.cancelledOrders, "Stopped orders"],
    ["Users", stats.totalUsers, "Registered accounts"],
  ], [stats]);

  async function loadStats(nextPeriod = period) {
    setLoading(true);
    try {
      const response = await adminDashboardApi.getStats(nextPeriod);
      setStats(response.data);
      setError("");
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to load dashboard stats."));
    } finally {
      setLoading(false);
    }
  }

  function updatePeriod(value) {
    setPeriod(value);
  }

  useEffect(() => {
    loadStats(period);
  }, [period]);

  return {
    cards,
    error,
    loading,
    period,
    stats,
    loadStats,
    updatePeriod,
  };
}
