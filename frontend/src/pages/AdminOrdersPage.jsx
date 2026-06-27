import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";

const orderStatuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    const response = await http.get("/admin/orders");
    setOrders(response.data);
  }

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const response = await http.get("/admin/orders");
        if (mounted) {
          setOrders(response.data);
          setError("");
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

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  async function updateStatus(id, status) {
    setMessage("");
    setError("");
    try {
      await http.patch(`/admin/orders/${id}/status`, { status });
      setMessage("Order status updated.");
      await loadOrders();
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Invalid status transition.");
    }
  }

  return (
    <section className="page admin-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">Admin fulfillment</span>
          <h1>Orders</h1>
          <p>Suivre les commandes et avancer les statuts autorises.</p>
        </div>
      </div>

      {message ? <div className="admin-alert admin-success">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="admin-panel">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Update</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan="7">No orders found.</td></tr>
              ) : orders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{Number(order.totalAmount).toFixed(2)} DH</td>
                  <td><span className={`status-pill status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                  <td>{order.paymentStatus}</td>
                  <td>
                    <select value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)}>
                      {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </td>
                  <td>
                    <Link className="table-link" to={`/admin/orders/${order.id}`}>Open</Link>
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
