import { Link } from "react-router-dom";
import { AsyncState, StatusBadge } from "../components/ui";
import { useOrders } from "../hooks/useOrders";

function formatDate(value) {
  return value ? new Date(value).toLocaleString("fr-FR") : "-";
}

function formatPrice(value) {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export default function OrdersPage() {
  const { orders, loading, error, loadOrders } = useOrders();
  const activeOrders = orders.filter((order) => !["DELIVERED", "CANCELLED"].includes(order.status)).length;
  const totalSpent = orders
    .filter((order) => order.status !== "CANCELLED")
    .reduce((sum, order) => sum + Number(order.totalAmount ?? 0), 0);

  return (
    <section className="page admin-page orders-page">
      <div className="admin-hero orders-hero">
        <div className="orders-hero-copy">
          <span className="section-kicker">Suivi des commandes</span>
          <h1>Mes commandes</h1>
          <p>Consultez l'historique et le statut de vos commandes ShopSphere.</p>
        </div>
        <div className="orders-hero-note" aria-label="Information sur le suivi">
          <span>Besoin d'aide ?</span>
          <strong>Chaque commande est suivie en temps réel.</strong>
        </div>
      </div>

      {!loading && !error && orders.length > 0 ? (
        <div className="orders-summary" aria-label="Résumé des commandes">
          <div className="orders-summary-card">
            <span>Commandes</span>
            <strong>{orders.length}</strong>
            <small>dans votre historique</small>
          </div>
          <div className="orders-summary-card orders-summary-card-accent">
            <span>En cours</span>
            <strong>{activeOrders}</strong>
            <small>en préparation ou livraison</small>
          </div>
          <div className="orders-summary-card">
            <span>Total commandé</span>
            <strong>{formatPrice(totalSpent)}</strong>
            <small>hors commandes annulées</small>
          </div>
        </div>
      ) : null}

      <div className="admin-panel orders-panel">
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
            <table className="admin-table orders-table">
              <caption>Historique de vos commandes</caption>
              <thead>
                <tr>
                  <th>Commande</th><th>Date</th><th>Total</th><th>Suivi</th><th>Articles</th>
                  <th><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const itemCount = (order.items ?? []).length;
                  return (
                    <tr key={order.id}>
                      <td>
                        <strong className="orders-number">{order.orderNumber}</strong>
                        <small className="admin-muted">{itemCount} article{itemCount > 1 ? "s" : ""}</small>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td><strong className="orders-total">{formatPrice(order.totalAmount)}</strong></td>
                      <td>
                        <StatusBadge type="order" value={order.status} />
                        <small className={`orders-payment ${order.paymentStatus === "PAID" ? "is-paid" : ""}`}>
                          {order.paymentStatus === "PAID" ? "Paiement confirmé" : "Paiement en attente"}
                        </small>
                      </td>
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
                      <td><Link className="table-link orders-details-link" to={`/orders/${order.id}`}>Voir le détail <span aria-hidden="true">→</span></Link></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </AsyncState>
      </div>
    </section>
  );
}
