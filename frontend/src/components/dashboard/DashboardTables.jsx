import { Link } from "react-router-dom";
import OrderStatusBadge from "../order/OrderStatusBadge";
import { formatDashboardMoney } from "../../hooks/useAdminDashboard";

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "-";
}

export default function DashboardTables({ lowStockProducts, recentOrders }) {
  return (
    <div className="dashboard-tables-grid">
      <article className="dashboard-panel reveal-card">
        <div className="dashboard-panel-heading">
          <div><span>Activité</span><h2>Commandes récentes</h2></div>
          <Link to="/admin/orders">Tout voir</Link>
        </div>
        {recentOrders.length ? (
          <div className="dashboard-table-scroll">
            <table className="dashboard-compact-table">
              <thead><tr><th>Commande</th><th>Client</th><th>Date</th><th>Total</th><th>Statut</th><th /></tr></thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.orderNumber}</strong></td>
                    <td>{order.customerName || "Client"}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>{formatDashboardMoney(order.totalAmount)}</td>
                    <td><OrderStatusBadge status={order.status} /></td>
                    <td><Link className="dashboard-table-action" to={`/admin/orders/${order.id}`}>Voir</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="dashboard-empty-state">Aucune commande récente.</div>}
      </article>

      <article className="dashboard-panel reveal-card">
        <div className="dashboard-panel-heading">
          <div><span>Inventaire</span><h2>Stock faible</h2></div>
          <Link to="/admin/products">Gérer</Link>
        </div>
        {lowStockProducts.length ? (
          <div className="dashboard-stock-list">
            {lowStockProducts.map((product) => (
              <div className="dashboard-stock-row" key={product.id}>
                <div><strong>{product.name}</strong><small>{product.categoryName || "Sans catégorie"}</small></div>
                <span className={Number(product.stockQuantity) === 0 ? "stock-critical" : "stock-low"}>
                  {Number(product.stockQuantity) === 0 ? "Rupture" : `${product.stockQuantity} restant(s)`}
                </span>
                <Link to="/admin/products">Gérer le stock</Link>
              </div>
            ))}
          </div>
        ) : <div className="dashboard-empty-state">Aucun produit avec un stock faible.</div>}
      </article>
    </div>
  );
}
