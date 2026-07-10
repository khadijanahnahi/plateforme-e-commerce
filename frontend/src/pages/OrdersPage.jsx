import { Link } from "react-router-dom";
import { AsyncState, StatusBadge } from "../components/ui";
import { useOrders } from "../hooks/useOrders";

function formatDate(value) {
  return value ? new Date(value).toLocaleString("fr-FR") : "-";
}

export default function OrdersPage() {
  const { orders, loading, error, loadOrders } = useOrders();

  return (
    <section className="page admin-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">Suivi des commandes</span>
          <h1>Mes commandes</h1>
          <p>Consultez l'historique et le statut de vos commandes ShopSphere.</p>
        </div>
      </div>

      <div className="admin-panel">
        <AsyncState
          empty={orders.length === 0}
          emptyAction={<Link className="button button-primary" to="/products">Découvrir les produits</Link>}
          emptyDescription="Vos prochaines commandes apparaîtront ici."
          emptyTitle="Aucune commande"
          error={error}
          loading={loading}
          onRetry={() => loadOrders().catch(() => undefined)}
          skeletonVariant="table"
        >
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Commande</th><th>Date</th><th>Client</th><th>Total</th><th>Statut</th><th>Produits</th><th>Action</th></tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.orderNumber}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td><strong>{order.customerName ?? "-"}</strong><small className="admin-muted">{order.customerPhone ?? order.customerEmail ?? "-"}</small></td>
                    <td>{Number(order.totalAmount).toFixed(2)} DH</td>
                    <td><StatusBadge type="order" value={order.status} /></td>
                    <td>
                      <div className="order-items-review-list">
                        {(order.items ?? []).map((item) => (
                          <div key={`${order.id}-${item.productId}`}>
                            <span>{item.productName}</span>
                            {order.status === "DELIVERED" && order.paymentStatus === "PAID" ? (
                              <Link className="table-link" to={`/products/${item.productId}?review=1`}>Laisser un avis</Link>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td><Link className="table-link" to={`/orders/${order.id}`}>Détails</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </div>
    </section>
  );
}
