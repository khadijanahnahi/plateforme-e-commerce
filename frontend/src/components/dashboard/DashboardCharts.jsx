import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDashboardMoney } from "../../hooks/useAdminDashboard";

const statusColors = ["#b48a55", "#7c8798", "#6f596e", "#54705e", "#8a3b4b"];

function EmptyChart({ children }) {
  return <div className="dashboard-empty-chart">{children}</div>;
}

export default function DashboardCharts({ ordersByStatus, revenueByDay, topProducts }) {
  return (
    <div className="dashboard-charts-grid">
      <article className="dashboard-panel dashboard-chart-panel reveal-card">
        <div className="dashboard-panel-heading">
          <div><span>Performance</span><h2>Évolution du chiffre d’affaires</h2></div>
          <small>14 derniers points disponibles</small>
        </div>
        {revenueByDay.length ? (
          <div className="dashboard-chart-canvas">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueByDay} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7b2d42" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#7b2d42" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e8e2da" strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#716a63", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} width={65} tick={{ fill: "#716a63", fontSize: 12 }} tickFormatter={(value) => `${value} DH`} />
                <Tooltip formatter={(value) => [formatDashboardMoney(value), "Revenu"]} labelStyle={{ color: "#111" }} />
                <Area type="monotone" dataKey="revenue" stroke="#7b2d42" strokeWidth={2.5} fill="url(#revenueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyChart>Aucune donnée de revenu pour cette période.</EmptyChart>}
      </article>

      <article className="dashboard-panel dashboard-chart-panel reveal-card">
        <div className="dashboard-panel-heading">
          <div><span>Commandes</span><h2>Répartition par statut</h2></div>
        </div>
        {ordersByStatus.some((entry) => entry.value > 0) ? (
          <div className="dashboard-chart-canvas">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersByStatus} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#e8e2da" strokeDasharray="3 5" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#716a63", fontSize: 11 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#716a63", fontSize: 12 }} />
                <Tooltip formatter={(value) => [value, "Commandes"]} cursor={{ fill: "rgba(123,45,66,0.04)" }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={48}>
                  {ordersByStatus.map((entry, index) => <Cell key={entry.status} fill={statusColors[index]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyChart>Aucune commande pour cette période.</EmptyChart>}
      </article>

      <article className="dashboard-panel dashboard-chart-panel dashboard-chart-wide reveal-card">
        <div className="dashboard-panel-heading">
          <div><span>Catalogue</span><h2>Produits les plus vendus</h2></div>
          <small>Quantités hors commandes annulées</small>
        </div>
        {topProducts.length ? (
          <div className="dashboard-chart-canvas dashboard-top-products-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 6, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid stroke="#e8e2da" strokeDasharray="3 5" horizontal={false} />
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#716a63", fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={150} axisLine={false} tickLine={false} tick={{ fill: "#24211e", fontSize: 12 }} />
                <Tooltip formatter={(value) => [value, "Unités vendues"]} cursor={{ fill: "rgba(123,45,66,0.04)" }} />
                <Bar dataKey="quantity" fill="#171412" radius={[0, 8, 8, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : <EmptyChart>Les lignes produit des commandes ne sont pas disponibles pour cette période.</EmptyChart>}
      </article>
    </div>
  );
}
