import { Link } from "react-router-dom";
import DashboardRevenueCard from "../components/dashboard/DashboardRevenueCard";
import DashboardStatsGrid from "../components/dashboard/DashboardStatsGrid";
import AdminPageHeader from "../components/layout/AdminPageHeader";
import { dashboardPeriods, useAdminDashboard } from "../hooks/useAdminDashboard";

export default function AdminDashboardPage() {
  const {
    cards,
    error,
    loading,
    period,
    stats,
    updatePeriod,
  } = useAdminDashboard();

  return (
    <section className="page admin-page">
      <AdminPageHeader
        kicker="Admin command center"
        title="ShopSphere Dashboard"
        description="Vue rapide sur les produits, commandes, clients et revenu non annule."
      />

      <div className="admin-actions">
        <select className="dashboard-period-select" value={period} onChange={(event) => updatePeriod(event.target.value)}>
          {dashboardPeriods.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <Link className="button button-secondary" to="/admin/categories">Manage Categories</Link>
        <Link className="button button-secondary" to="/admin/products">Manage Products</Link>
        <Link className="button button-primary" to="/admin/orders">View Orders</Link>
      </div>

      {error ? <div className="admin-alert">{error}</div> : null}

      <DashboardRevenueCard loading={loading} totalRevenue={stats.totalRevenue} />
      <DashboardStatsGrid cards={cards} loading={loading} />
    </section>
  );
}
