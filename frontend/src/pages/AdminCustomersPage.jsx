import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";

function getApiErrorMessage(exception, fallback) {
  const status = exception.response?.status;
  const data = exception.response?.data;
  const validationErrors = data?.validationErrors
    ? Object.values(data.validationErrors).filter(Boolean).join(" ")
    : "";
  const message = validationErrors || data?.message || exception.message || fallback;

  return status ? `${message} (HTTP ${status})` : message;
}

function formatMoney(value) {
  return `${Number(value ?? 0).toFixed(2)} DH`;
}

function formatDate(value) {
  if (!value) {
    return "Non disponible";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCustomers() {
      try {
        const response = await http.get("/admin/customers");
        if (mounted) {
          setCustomers(Array.isArray(response.data) ? response.data : []);
          setError("");
        }
      } catch (exception) {
        if (mounted) {
          setError(getApiErrorMessage(exception, "Unable to load customers."));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCustomers();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch = query
        ? [customer.fullName, customer.email, customer.phone]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(query))
        : true;
      const matchesStatus = statusFilter
        ? String(customer.active) === statusFilter
        : true;

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const stats = {
    total: customers.length,
    active: customers.filter((customer) => customer.active).length,
    inactive: customers.filter((customer) => !customer.active).length,
    revenue: customers.reduce((sum, customer) => sum + Number(customer.totalSpent ?? 0), 0),
  };

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
  }

  return (
    <section className="admin-page customers-admin-page">
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}

      <div className="customers-stats-grid">
        <article className="customers-stat-card">
          <span>Total Customers</span>
          <strong>{stats.total}</strong>
          <small>Registered customer accounts</small>
        </article>
        <article className="customers-stat-card">
          <span>Active Customers</span>
          <strong>{stats.active}</strong>
          <small>Enabled accounts</small>
        </article>
        <article className="customers-stat-card">
          <span>Inactive Customers</span>
          <strong>{stats.inactive}</strong>
          <small>Disabled or blocked accounts</small>
        </article>
        <article className="customers-stat-card customers-stat-card-wide">
          <span>Total Spent</span>
          <strong>{formatMoney(stats.revenue)}</strong>
          <small>Revenue excluding cancelled orders</small>
        </article>
      </div>

      <div className="admin-card customers-card">
        <div className="customers-toolbar">
          <input
            type="search"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button className="customers-reset-button" type="button" onClick={resetFilters}>
            Reset filters
          </button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table customers-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Total spent</th>
                <th>Registered</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8">
                    <div className="customers-state">Loading customers...</div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="customers-state">
                      <strong>No customers found</strong>
                      <span>Try another search term or reset filters.</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div className="customer-cell">
                      <span>{customer.fullName?.slice(0, 1)?.toUpperCase() ?? "C"}</span>
                      <div>
                        <strong>{customer.fullName}</strong>
                        <small>ID #{customer.id}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="customer-secondary">{customer.email}</span>
                  </td>
                  <td>
                    <span className="customer-secondary">{customer.phone}</span>
                  </td>
                  <td>
                    <strong>{customer.orderCount ?? 0}</strong>
                  </td>
                  <td className="customers-money">{formatMoney(customer.totalSpent)}</td>
                  <td>{formatDate(customer.registeredAt)}</td>
                  <td>
                    <span className={`customer-status-badge ${customer.active ? "customer-status-active" : "customer-status-inactive"}`}>
                      {customer.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions customers-actions">
                      <Link className="table-link" to={`/admin/customers/${customer.id}`}>
                        View
                      </Link>
                      <Link className="table-link" to={`/admin/orders?customer=${encodeURIComponent(customer.email ?? "")}`}>
                        Orders
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="customers-table-note">
          Showing {filteredCustomers.length} of {customers.length} customers.
        </p>
      </div>
    </section>
  );
}
