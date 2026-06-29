import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";

const defaultStats = {
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

const dashboardPeriods = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

function formatMoney(value) {
  return `${Number(value ?? 0).toFixed(2)} DH`;
}

export default function AdminDashboardPage() {
  const [period, setPeriod] = useState("all");
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      setLoading(true);
      try {
        const response = await http.get("/admin/dashboard/stats", {
          params: { period },
        });
        if (mounted) {
          setStats(response.data);
          setError("");
        }
      } catch (exception) {
        if (mounted) {
          setError(exception.response?.data?.message ?? "Unable to load dashboard stats.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadStats();
    return () => {
      mounted = false;
    };
  }, [period]);

  const cards = [
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
  ];

  return (
    <section className="page admin-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">Admin command center</span>
          <h1>ShopSphere Dashboard</h1>
          <p>Vue rapide sur les produits, commandes, clients et revenu non annule.</p>
        </div>
        <div className="admin-actions">
          <select className="dashboard-period-select" value={period} onChange={(event) => setPeriod(event.target.value)}>
            {dashboardPeriods.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <Link className="button button-secondary" to="/admin/categories">Manage Categories</Link>
          <Link className="button button-secondary" to="/admin/products">Manage Products</Link>
          <Link className="button button-primary" to="/admin/orders">View Orders</Link>
        </div>
      </div>

      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="revenue-card reveal-card">
        <span>Total Revenue</span>
        <strong>{loading ? "..." : formatMoney(stats.totalRevenue)}</strong>
        <small>Somme des commandes non CANCELLED pour la periode selectionnee</small>
      </div>

      <div className="admin-stats-grid">
        {cards.map(([label, value, hint], index) => (
          <article
            className="admin-stat-card reveal-card"
            key={label}
            style={{ "--delay": `${index * 0.035}s` }}
          >
            <span>{label}</span>
            <strong>{loading ? "..." : value}</strong>
            <small>{hint}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
