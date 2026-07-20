import { Link } from "react-router-dom";
import DashboardCharts from "../components/dashboard/DashboardCharts";
import DashboardKpiGrid from "../components/dashboard/DashboardKpiGrid";
import DashboardSkeleton from "../components/dashboard/DashboardSkeleton";
import DashboardTables from "../components/dashboard/DashboardTables";
import { dashboardPeriods, useAdminDashboard } from "../hooks/useAdminDashboard";

export default function AdminDashboardPage() {
  const {
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
    topProducts,
    updatePeriod,
  } = useAdminDashboard();

  return (
    <section className="page admin-page admin-dashboard-page">
      <div className="admin-actions dashboard-toolbar">
        <span>Période</span>
        <select className="dashboard-period-select" value={period} onChange={(event) => updatePeriod(event.target.value)}>
          {dashboardPeriods.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <Link className="button button-secondary" to="/admin/products">Gérer les produits</Link>
        <Link className="button button-primary" to="/admin/orders">Voir les commandes</Link>
      </div>

      {error ? <div className="admin-alert">{error}</div> : null}
      {partialWarning ? <div className="admin-alert dashboard-partial-warning">{partialWarning}</div> : null}

      {loading ? <DashboardSkeleton /> : (
        <>
          <DashboardKpiGrid cards={cards} />
          <DashboardCharts ordersByStatus={ordersByStatus} revenueByDay={revenueByDay} topProducts={topProducts} />

          <Link className="dashboard-review-callout reveal-card" to="/admin/reviews">
            <div><span>Modération</span><strong>{pendingReviews}</strong></div>
            <p>{pendingReviews ? `${pendingReviews} avis en attente de validation.` : "Aucun avis en attente de validation."}</p>
            <b>Ouvrir les avis →</b>
          </Link>

          <DashboardTables lowStockProducts={lowStockProducts} recentOrders={recentOrders} />
        </>
      )}
    </section>
  );
}
