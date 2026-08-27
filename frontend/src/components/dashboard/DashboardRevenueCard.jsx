import { formatDashboardMoney } from "../../hooks/useAdminDashboard";

export default function DashboardRevenueCard({ loading, totalRevenue }) {
  return (
    <div className="revenue-card reveal-card">
      <span>Chiffre d’affaires</span>
      <strong>{loading ? "..." : formatDashboardMoney(totalRevenue)}</strong>
      <small>Somme des commandes non annulées pour la période sélectionnée</small>
    </div>
  );
}
