import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import http from "../api/http";
import { ErrorState, Skeleton } from "../components/ui";

const statusLabels = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

const paymentLabels = {
  UNPAID: "Non payé",
  PAID: "Payé",
  FAILED: "Échec paiement",
};

function formatMoney(value) {
  return `${Number(value ?? 0).toFixed(2)} DH`;
}

function getFullAddress(order) {
  const parts = [
    order?.shippingStreetAddress,
    order?.shippingCity,
    order?.shippingPostalCode,
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : order?.shippingAddress ?? "-";
}

export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadOrder() {
      try {
        const response = await http.get(`/orders/${orderId}`);
        if (mounted) {
          setOrder(response.data);
          setError("");
        }
      } catch (exception) {
        if (mounted) {
          setError(exception.response?.data?.message ?? "Impossible de charger la confirmation de commande.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOrder();
    return () => {
      mounted = false;
    };
  }, [orderId]);

  return (
    <section className="order-success-page">
      <div className="order-success-shell">
        <div className="order-success-card">
          <span className="order-success-badge">Commande enregistrée</span>
          <h1>Merci pour votre commande</h1>
          <p className="order-success-intro">
            Votre commande a bien été enregistrée. Un email de confirmation vous a été envoyé.
          </p>

          {loading ? (
            <div className="order-success-state" aria-label="Chargement de la confirmation" role="status">
              <Skeleton height={24} width="62%" />
              <Skeleton height={92} />
              <Skeleton height={48} width="45%" radius={999} />
            </div>
          ) : null}
          {error ? (
            <ErrorState description={error} onRetry={() => window.location.reload()} title="Confirmation indisponible" />
          ) : null}

          {order ? (
            <>
              <div className="order-success-summary">
                <article>
                  <span>Numéro de commande</span>
                  <strong>{order.orderNumber}</strong>
                </article>
                <article>
                  <span>Statut commande</span>
                  <strong className={`order-status-badge status-${order.status.toLowerCase()}`}>
                    {statusLabels[order.status] ?? order.status}
                  </strong>
                </article>
                <article>
                  <span>Statut paiement</span>
                  <strong className={`order-status-badge payment-${order.paymentStatus.toLowerCase()}`}>
                    {paymentLabels[order.paymentStatus] ?? order.paymentStatus}
                  </strong>
                </article>
                <article>
                  <span>Total</span>
                  <strong>{formatMoney(order.totalAmount)}</strong>
                </article>
              </div>

              <div className="order-success-info">
                <div>
                  <span>Mode de paiement</span>
                  <strong>Paiement à la livraison</strong>
                </div>
                <div>
                  <span>Adresse de livraison</span>
                  <strong>{getFullAddress(order)}</strong>
                </div>
              </div>
            </>
          ) : null}

          <div className="order-success-next">
            <h2>Prochaines étapes</h2>
            <ol>
              <li>Vérification de la commande</li>
              <li>Confirmation par notre équipe</li>
              <li>Préparation et livraison</li>
              <li>Paiement à la livraison</li>
            </ol>
          </div>

          <div className="order-success-actions">
            <Link className="button button-primary" to={`/orders/${orderId}`}>Voir ma commande</Link>
            <Link className="button button-secondary" to="/products">Continuer mes achats</Link>
            <Link className="button button-secondary" to="/">Retour à l'accueil</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
