import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import http from "../api/http";

const orderStatuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

export default function AdminOrderDetailsPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadOrder() {
    const response = await http.get(`/admin/orders/${id}`);
    setOrder(response.data);
  }

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const response = await http.get(`/admin/orders/${id}`);
        if (mounted) {
          setOrder(response.data);
          setError("");
        }
      } catch (exception) {
        if (mounted) {
          setError(exception.response?.data?.message ?? "Unable to load order.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [id]);

  async function updateStatus(status) {
    setMessage("");
    setError("");
    try {
      await http.patch(`/admin/orders/${id}/status`, { status });
      setMessage("Order status updated.");
      await loadOrder();
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Invalid status transition.");
    }
  }

  if (loading) {
    return <section className="page admin-page"><div className="admin-panel">Loading order...</div></section>;
  }

  return (
    <section className="page admin-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">Order details</span>
          <h1>{order?.orderNumber ?? "Order not found"}</h1>
          <p>Detail des articles, total, adresse et statut de livraison.</p>
        </div>
        <Link className="button button-secondary" to="/admin/orders">Back to orders</Link>
      </div>

      {message ? <div className="admin-alert admin-success">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      {order ? (
        <>
          <div className="admin-detail-grid">
            <article className="admin-stat-card">
              <span>Total</span>
              <strong>{Number(order.totalAmount).toFixed(2)} DH</strong>
              <small>{order.paymentStatus}</small>
            </article>
            <article className="admin-stat-card">
              <span>Status</span>
              <strong>{order.status}</strong>
              <small>{formatDate(order.createdAt)}</small>
            </article>
            <article className="admin-stat-card">
              <span>Shipping</span>
              <strong>{order.shippingAddress ? "Provided" : "Missing"}</strong>
              <small>{order.shippingAddress ?? "No address"}</small>
            </article>
          </div>

          <div className="admin-panel">
            <div className="admin-detail-toolbar">
              <h2>Items</h2>
              <select value={order.status} onChange={(event) => updateStatus(event.target.value)}>
                {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Unit price</th>
                    <th>Quantity</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => (
                    <tr key={`${order.id}-${item.productId}-${item.productName}`}>
                      <td>{item.productName}</td>
                      <td>{Number(item.unitPrice).toFixed(2)} DH</td>
                      <td>{item.quantity}</td>
                      <td>{Number(item.subtotal).toFixed(2)} DH</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </section>
  );
}
