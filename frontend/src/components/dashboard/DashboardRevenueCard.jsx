import { formatDashboardMoney } from "../../hooks/useAdminDashboard";

export default function DashboardRevenueCard({ loading, totalRevenue }) {
  return (
    <div className="revenue-card reveal-card">
      <span>Total Revenue</span>
      <strong>{loading ? "..." : formatDashboardMoney(totalRevenue)}</strong>
      <small>Somme des commandes non CANCELLED pour la periode selectionnee</small>
    </div>
  );
}
