import { useEffect, useMemo, useState } from "react";
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
    <section className="admin-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">ADMIN CRM</span>
          <h1>Customers</h1>
          <p>Suivre les clients inscrits, leurs commandes et leur valeur commerciale.</p>
        </div>
      </div>

      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}

      <div className="admin-stats-grid">
        <article>
          <span>Total Customers</span>
          <strong>{stats.total}</strong>
        </article>
        <article>
          <span>Active</span>
          <strong>{stats.active}</strong>
        </article>
        <article>
          <span>Inactive</span>
          <strong>{stats.inactive}</strong>
        </article>
        <article>
          <span>Total Spent</span>
          <strong>{formatMoney(stats.revenue)}</strong>
        </article>
      </div>

      <div className="admin-card">
        <div className="admin-toolbar">
          <input
            type="search"
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Status: All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button className="button button-secondary" type="button" onClick={resetFilters}>
            Reset filters
          </button>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Total spent</th>
                <th>Registered</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7">Loading customers...</td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="7">No customers found.</td>
                </tr>
              ) : filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <strong>{customer.fullName}</strong>
                  </td>
                  <td>{customer.email}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.orderCount ?? 0}</td>
                  <td>{formatMoney(customer.totalSpent)}</td>
                  <td>{formatDate(customer.registeredAt)}</td>
                  <td>
                    <span className={`status-badge ${customer.active ? "status-active" : "status-archived"}`}>
                      {customer.active ? "ACTIVE" : "INACTIVE"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="admin-table-note">
          Showing {filteredCustomers.length} of {customers.length} customers.
        </p>
      </div>
    </section>
  );
}
