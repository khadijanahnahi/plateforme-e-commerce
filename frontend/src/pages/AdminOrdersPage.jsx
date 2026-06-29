import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";

const orderStatuses = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];
const PAGE_SIZE = 10;

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const normalizedSearch = search.trim().toLowerCase();
  const filteredOrders = orders.filter((order) => {
    const matchesStatus = statusFilter ? order.status === statusFilter : true;
    const matchesSearch = normalizedSearch
      ? [
          order.orderNumber,
          order.customerName,
          order.customerPhone,
          order.customerEmail,
        ].some((value) => String(value ?? "").toLowerCase().includes(normalizedSearch))
      : true;

    return matchesStatus && matchesSearch;
  });
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  );

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

  function handleSearchChange(event) {
    setSearch(event.target.value);
    setCurrentPage(1);
  }

  function handleStatusFilterChange(event) {
    setStatusFilter(event.target.value);
    setCurrentPage(1);
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
        <div className="admin-search admin-orders-toolbar">
          <input
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by order number, customer name or phone"
          />
          <select value={statusFilter} onChange={handleStatusFilterChange}>
            <option value="">All statuses</option>
            {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
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
                <tr><td colSpan="8">Loading orders...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan="8">No orders found.</td></tr>
              ) : paginatedOrders.map((order) => (
                <tr key={order.id}>
                  <td>{order.orderNumber}</td>
                  <td>
                    <strong>{order.customerName ?? "-"}</strong>
                    <small className="admin-muted">{order.customerPhone ?? order.customerEmail ?? "-"}</small>
                  </td>
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

        {!loading && filteredOrders.length > 0 ? (
          <div className="pagination-bar">
            <span>
              Showing {(safeCurrentPage - 1) * PAGE_SIZE + 1}-{Math.min(safeCurrentPage * PAGE_SIZE, filteredOrders.length)} of {filteredOrders.length}
            </span>
            <div className="pagination-controls">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={safeCurrentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  className={page === safeCurrentPage ? "pagination-active" : ""}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={safeCurrentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
