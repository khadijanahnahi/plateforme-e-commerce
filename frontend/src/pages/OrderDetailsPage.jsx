import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import http from "../api/http";

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

function formatDate(value) {
  return value ? new Date(value).toLocaleString("fr-FR") : "-";
}

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

function maskEmail(value) {
  if (!value || !value.includes("@")) {
    return value ?? "-";
  }

  const [name, domain] = value.split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

function maskPhone(value) {
  if (!value) {
    return "-";
  }

  return `${value.slice(0, 3)}****${value.slice(-2)}`;
}

function maskAddress(value) {
  if (!value || value === "-") {
    return value ?? "-";
  }

  return "Adresse masquée pour la démonstration";
}

function buildTimeline(status) {
  if (status === "CANCELLED") {
    return [
      { key: "PENDING", label: "Commande créée", completed: true },
      { key: "CANCELLED", label: "Annulée", completed: true },
    ];
  }

  const order = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];
  const currentIndex = Math.max(0, order.indexOf(status));

  return [
    { key: "PENDING", label: "Commande créée" },
    { key: "CONFIRMED", label: "Confirmée" },
    { key: "SHIPPED", label: "Expédiée" },
    { key: "DELIVERED", label: "Livrée" },
  ].map((step, index) => ({
    ...step,
    completed: index <= currentIndex,
  }));
}

function productInitials(name) {
  return String(name ?? "SP")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function OrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceAvailable, setInvoiceAvailable] = useState(false);
  const [invoiceChecked, setInvoiceChecked] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadOrder() {
      try {
        const response = await http.get(`/orders/${id}`);
        if (mounted) {
          setOrder(response.data);
          setError("");
        }
      } catch (exception) {
        if (mounted) {
          setError(exception.response?.data?.message ?? "Impossible de charger les détails de la commande.");
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
  }, [id]);

  useEffect(() => {
    let mounted = true;

    async function checkInvoiceAvailability() {
      setInvoiceAvailable(false);
      setInvoiceChecked(false);

      if (!order?.id || order.paymentStatus !== "PAID") {
        setInvoiceChecked(true);
        return;
      }

      try {
        await http.get(`/orders/${order.id}/invoice/info`);
        if (mounted) {
          setInvoiceAvailable(true);
        }
      } catch {
        if (mounted) {
          setInvoiceAvailable(false);
        }
      } finally {
        if (mounted) {
          setInvoiceChecked(true);
        }
      }
    }

    checkInvoiceAvailability();
    return () => {
      mounted = false;
    };
  }, [order?.id, order?.paymentStatus]);

  async function downloadInvoice() {
    if (!order) {
      return;
    }

    setInvoiceLoading(true);
    setError("");

    try {
      const response = await http.get(`/orders/${order.id}/invoice`, {
        responseType: "blob",
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${order.orderNumber || `commande-${order.id}`}-facture.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (exception) {
      if (exception.response?.status === 404) {
        setInvoiceAvailable(false);
        setError("Facture introuvable. Demandez à l'admin de régénérer la facture.");
      } else {
        setError("Impossible de télécharger la facture.");
      }
    } finally {
      setInvoiceLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="order-details-page">
        <div className="order-details-container">
          <div className="order-details-loading">Chargement des détails de la commande...</div>
        </div>
      </section>
    );
  }

  const timeline = buildTimeline(order?.status);
  const address = getFullAddress(order);
  const safeEmail = demoMode ? maskEmail(order?.customerEmail) : order?.customerEmail ?? "-";
  const safePhone = demoMode ? maskPhone(order?.customerPhone) : order?.customerPhone ?? "-";
  const safeAddress = demoMode ? maskAddress(address) : address;

  return (
    <section className="order-details-page">
      <div className="order-details-container">
        <div className="admin-hero order-details-hero">
          <div>
            <span className="section-kicker">Détails de la commande</span>
            <h1>{order?.orderNumber ?? "Commande introuvable"}</h1>
            <p>Suivez le statut, les produits, l'adresse de livraison et la facture de votre commande.</p>
          </div>
          <div className="order-details-hero-actions">
            <button className="button button-secondary" type="button" onClick={() => setDemoMode((current) => !current)}>
              {demoMode ? "Afficher les données" : "Mode démo"}
            </button>
            <Link className="button button-secondary" to="/orders">Retour aux commandes</Link>
          </div>
        </div>

        {error ? <div className="admin-alert">{error}</div> : null}

        {order ? (
          <>
            <div className="order-details-summary">
              <article className="order-status-card">
                <span>Statut commande</span>
                <strong className={`order-status-badge status-${order.status.toLowerCase()}`}>
                  {statusLabels[order.status] ?? order.status}
                </strong>
                <small>{formatDate(order.createdAt)}</small>
              </article>
              <article className="order-status-card">
                <span>Paiement</span>
                <strong className={`order-status-badge payment-${order.paymentStatus.toLowerCase()}`}>
                  {paymentLabels[order.paymentStatus] ?? order.paymentStatus}
                </strong>
                <small>Paiement à la livraison</small>
              </article>
              <article className="order-status-card">
                <span>Total</span>
                <strong>{formatMoney(order.totalAmount)}</strong>
                <small>{order.couponCode ? `Coupon ${order.couponCode}` : "Aucun coupon"}</small>
              </article>
              <article className="order-status-card">
                <span>Facture</span>
                <strong className={`order-status-badge ${invoiceAvailable ? "invoice-ready" : "invoice-pending"}`}>
                  {order.paymentStatus === "PAID"
                    ? invoiceChecked && invoiceAvailable
                      ? "Disponible"
                      : "En préparation"
                    : "En attente"}
                </strong>
                <small>
                  {order.paymentStatus === "PAID"
                    ? invoiceChecked && invoiceAvailable
                      ? "Facture prête"
                      : "Facture non générée"
                    : "Disponible après paiement"}
                </small>
              </article>
            </div>

            <div className="order-timeline-card">
              <div className="order-section-heading">
                <h2>Suivi de commande</h2>
                <span>{statusLabels[order.status] ?? order.status}</span>
              </div>
              <div className={`order-timeline ${order.status === "CANCELLED" ? "order-timeline-cancelled" : ""}`}>
                {timeline.map((step) => (
                  <div className={`order-timeline-step ${step.completed ? "is-complete" : ""}`} key={step.key}>
                    <span />
                    <strong>{step.label}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-details-grid">
              <article className="order-details-panel">
                <div className="order-section-heading">
                  <h2>Informations de livraison</h2>
                  <span>{demoMode ? "Données masquées" : "Snapshot commande"}</span>
                </div>
                <dl className="order-info-list">
                  <div>
                    <dt>Client</dt>
                    <dd>{order.customerName ?? "-"}</dd>
                  </div>
                  <div>
                    <dt>Email</dt>
                    <dd>{safeEmail}</dd>
                  </div>
                  <div>
                    <dt>Téléphone</dt>
                    <dd>{safePhone}</dd>
                  </div>
                  <div>
                    <dt>Adresse</dt>
                    <dd>{safeAddress}</dd>
                  </div>
                  <div>
                    <dt>Notes de livraison</dt>
                    <dd>{order.deliveryNotes ?? "-"}</dd>
                  </div>
                </dl>
              </article>

              <article className="order-details-panel">
                <div className="order-section-heading">
                  <h2>Résumé du paiement</h2>
                  <span>Cash on Delivery</span>
                </div>
                <div className="order-payment-lines">
                  <div>
                    <span>Sous-total</span>
                    <strong>{formatMoney(order.subtotalAmount ?? order.totalAmount)}</strong>
                  </div>
                  <div>
                    <span>Réduction</span>
                    <strong>- {formatMoney(order.discountAmount)}</strong>
                  </div>
                  <div>
                    <span>Livraison</span>
                    <strong>{Number(order.deliveryFee ?? 0) === 0 ? "Gratuite" : formatMoney(order.deliveryFee)}</strong>
                  </div>
                  <div className="order-payment-total">
                    <span>Total</span>
                    <strong>{formatMoney(order.totalAmount)}</strong>
                  </div>
                </div>

                {order.paymentStatus === "PAID" && invoiceChecked && invoiceAvailable ? (
                  <button
                    className="button button-primary order-invoice-button"
                    type="button"
                    disabled={invoiceLoading}
                    onClick={downloadInvoice}
                  >
                    {invoiceLoading ? "Téléchargement..." : "Télécharger la facture"}
                  </button>
                ) : order.paymentStatus === "PAID" ? (
                  <p className="order-invoice-note">
                    {invoiceChecked
                      ? "Facture en préparation. Si elle reste indisponible, l'admin doit la régénérer."
                      : "Vérification de la facture..."}
                  </p>
                ) : (
                  <p className="order-invoice-note">La facture sera disponible après confirmation du paiement.</p>
                )}
              </article>
            </div>

            <div className="order-details-panel">
              <div className="order-section-heading">
                <h2>Produits</h2>
                <span>{order.items?.length ?? 0} article(s)</span>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table order-details-table">
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Prix unitaire</th>
                      <th>Quantité</th>
                      <th>Sous-total</th>
                      <th>Avis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items ?? []).length === 0 ? (
                      <tr>
                        <td colSpan="5">Aucun produit trouvé pour cette commande.</td>
                      </tr>
                    ) : (order.items ?? []).map((item) => (
                      <tr key={`${order.id}-${item.productId}-${item.productName}`}>
                        <td>
                          <div className="order-product-cell">
                            <div className="order-product-thumb">{productInitials(item.productName)}</div>
                            <div>
                              <strong>{item.productName}</strong>
                              {item.size && item.size !== "TAILLE_UNIQUE" ? <small className="admin-muted">Taille : {item.size}</small> : null}
                              {item.promotionTitle ? <small className="admin-muted">{item.promotionTitle}</small> : null}
                            </div>
                          </div>
                        </td>
                        <td>{formatMoney(item.unitPrice)}</td>
                        <td>{item.quantity}</td>
                        <td>{formatMoney(item.subtotal)}</td>
                        <td>
                          {order.status === "DELIVERED" && order.paymentStatus === "PAID" ? (
                            <Link className="table-link" to={`/products/${item.productId}?review=1`}>
                              Laisser un avis
                            </Link>
                          ) : (
                            <span className="order-review-disabled">Disponible après livraison</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
