import { useEffect, useMemo, useState } from "react";
import { adminDashboardApi, getApiErrorMessage } from "../api/adminDashboardApi";
import { subscribeAdminRealtime } from "../events/adminRealtime";

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
  { value: "all", label: "Depuis le début" },
  { value: "today", label: "Aujourd’hui" },
  { value: "week", label: "Cette semaine" },
  { value: "month", label: "Ce mois" },
];

export function formatDashboardMoney(value) {
  return `${new Intl.NumberFormat("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0))} DH`;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.content)) return value.content;
  return [];
}

function getPeriodStart(period) {
  const now = new Date();
  if (period === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "week") {
    const day = now.getDay() || 7;
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1);
  }
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  return null;
}

function filterOrdersByPeriod(orders, period) {
  const start = getPeriodStart(period);
  if (!start) return orders;
  return orders.filter((order) => order.createdAt && new Date(order.createdAt) >= start);
}

function buildRevenueByDay(orders) {
  const revenue = new Map();
  orders
    .filter((order) => order.status !== "CANCELLED" && order.createdAt)
    .forEach((order) => {
      const date = new Date(order.createdAt);
      const key = date.toISOString().slice(0, 10);
      revenue.set(key, (revenue.get(key) ?? 0) + Number(order.totalAmount ?? 0));
    });

  return [...revenue.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-14)
    .map(([date, amount]) => ({
      date,
      label: new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      revenue: Number(amount.toFixed(2)),
    }));
}

function buildTopProducts(orders) {
  const products = new Map();
  orders.filter((order) => order.status !== "CANCELLED").forEach((order) => {
    asArray(order.items).forEach((item) => {
      const key = item.productId ?? item.productName;
      const current = products.get(key) ?? { name: item.productName ?? "Produit", quantity: 0 };
      current.quantity += Number(item.quantity ?? 0);
      products.set(key, current);
    });
  });

  return [...products.values()]
    .sort((left, right) => right.quantity - left.quantity)
    .slice(0, 5);
}

const statusLabels = {
  PENDING: "En attente",
  CONFIRMED: "Confirmées",
  SHIPPED: "Expédiées",
  DELIVERED: "Livrées",
  CANCELLED: "Annulées",
};

export function useAdminDashboard() {
  const [period, setPeriod] = useState("all");
  const [stats, setStats] = useState(defaultDashboardStats);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [customers, setCustomers] = useState(null);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [partialWarning, setPartialWarning] = useState("");

  const cards = useMemo(() => [
    { label: "Chiffre d’affaires", value: stats.totalRevenue, money: true, helper: "Commandes non annulées" },
    { label: "Commandes", value: stats.totalOrders, helper: "Sur la période sélectionnée" },
    { label: "Clients", value: customers?.length ?? stats.totalUsers, helper: "Comptes clients enregistrés" },
    { label: "En attente", value: stats.pendingOrders, helper: "Commandes à traiter" },
  ], [customers, stats]);

  const periodOrders = useMemo(() => filterOrdersByPeriod(orders, period), [orders, period]);
  const revenueByDay = useMemo(() => buildRevenueByDay(periodOrders), [periodOrders]);
  const topProducts = useMemo(() => buildTopProducts(periodOrders), [periodOrders]);
  const recentOrders = useMemo(() => [...periodOrders]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 6), [periodOrders]);
  const lowStockProducts = useMemo(() => products
    .filter((product) => product.status !== "ARCHIVED" && Number(product.stockQuantity) <= lowStockThreshold)
    .sort((left, right) => Number(left.stockQuantity) - Number(right.stockQuantity))
    .slice(0, 6), [lowStockThreshold, products]);
  const ordersByStatus = useMemo(() => [
    ["PENDING", stats.pendingOrders],
    ["CONFIRMED", stats.confirmedOrders],
    ["SHIPPED", stats.shippedOrders],
    ["DELIVERED", stats.deliveredOrders],
    ["CANCELLED", stats.cancelledOrders],
  ].map(([status, value]) => ({ status, label: statusLabels[status], value: Number(value ?? 0) })), [stats]);
  const pendingReviews = useMemo(() => reviews.filter((review) => review.status === "PENDING").length, [reviews]);

  async function loadStats(nextPeriod = period, { silent = false } = {}) {
    if (!silent) setLoading(true);
    try {
      const overview = await adminDashboardApi.getOverview(nextPeriod);
      setStats({ ...defaultDashboardStats, ...overview.stats });
      setOrders(asArray(overview.orders));
      setProducts(asArray(overview.products));
      setReviews(asArray(overview.reviews));
      setCustomers(overview.customers === null ? null : asArray(overview.customers));
      setLowStockThreshold(Number(overview.settings?.lowStockThreshold ?? 5));
      setPartialWarning(overview.unavailableSections.length
        ? `Certaines données détaillées sont indisponibles : ${overview.unavailableSections.join(", ")}.`
        : "");
      setError("");
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de charger le tableau de bord."));
    } finally {
      if (!silent) setLoading(false);
    }
  }

  function updatePeriod(value) {
    setPeriod(value);
  }

  useEffect(() => {
    loadStats(period);
  }, [period]);

  useEffect(() => subscribeAdminRealtime((notification) => {
    if (notification?.type === "ORDER_CREATED") {
      loadStats(period, { silent: true });
    }
  }), [period]);

  return {
    cards,
    error,
    loading,
    lowStockProducts,
    ordersByStatus,
    partialWarning,
    pendingReviews,
    period,
    recentOrders,
    revenueByDay,
    stats,
    topProducts,
    loadStats,
    updatePeriod,
  };
}
