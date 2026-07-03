import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadOrders() {
      try {
        const response = await http.get("/orders/my-orders");
        if (mounted) {
          setOrders(response.data);
        }
      } catch (exception) {
        if (mounted) {
          setError(exception.response?.data?.message ?? "Unable to load orders.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadOrders();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="page admin-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">Order tracking</span>
          <h1>Mes commandes</h1>
          <p>Consulte l'historique et le statut de tes commandes ShopSphere.</p>
        </div>
      </div>

      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Customer snapshot</th>
                <th>Total</th>
                <th>Status</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    No orders found. <Link className="table-link" to="/products">Go shopping</Link>
                  </td>
                </tr>
              ) : orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    <strong>{order.customerName ?? "-"}</strong>
                    <small className="admin-muted">{order.customerPhone ?? order.customerEmail ?? "-"}</small>
                  </td>
                  <td>{Number(order.totalAmount).toFixed(2)} DH</td>
                  <td><span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                  <td>
                    <div className="order-items-review-list">
                      {(order.items ?? []).map((item) => (
                        <div key={`${order.id}-${item.productId}`}>
                          <span>{item.productName}</span>
                          {order.status === "DELIVERED" && order.paymentStatus === "PAID" ? (
                            <Link className="table-link" to={`/products/${item.productId}?review=1`}>
                              Review Product
                            </Link>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
