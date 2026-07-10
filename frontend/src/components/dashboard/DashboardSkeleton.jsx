export default function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton" aria-label="Chargement du tableau de bord" aria-busy="true">
      <div className="dashboard-kpi-grid">
        {[0, 1, 2, 3].map((item) => <div className="dashboard-skeleton-card" key={item} />)}
      </div>
      <div className="dashboard-charts-grid">
        <div className="dashboard-skeleton-panel" />
        <div className="dashboard-skeleton-panel" />
      </div>
    </div>
  );
}
