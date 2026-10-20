export default function DashboardStatsGrid({ cards, loading }) {
  return (
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
  );
}
