import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import http from "../api/http";

function formatMoney(value) {
  return `${Number(value ?? 0).toFixed(2)} DH`;
}

function formatDate(value) {
  if (!value) {
    return "Non disponible";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  }).format(new Date(value));
}

export default function AdminCustomerDetailsPage() {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCustomer() {
      try {
        const response = await http.get("/admin/customers");
        const customers = Array.isArray(response.data) ? response.data : [];
        const selectedCustomer = customers.find((item) => String(item.id) === String(id));

        if (mounted) {
          setCustomer(selectedCustomer ?? null);
          setError(selectedCustomer ? "" : "Customer not found.");
        }
      } catch (exception) {
        if (mounted) {
          setError(exception.response?.data?.message ?? "Impossible de charger le client.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCustomer();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <section className="admin-page customers-admin-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">CUSTOMER PROFILE</span>
          <h1>{customer?.fullName ?? "Customer details"}</h1>
          <p>Vue rapide du profil client, de son statut et de sa valeur commerciale.</p>
        </div>
        <Link className="button button-secondary" to="/admin/customers">Back to customers</Link>
      </div>

      {loading ? <div className="admin-card customers-card">Loading customer...</div> : null}
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}

      {customer ? (
        <div className="customers-detail-grid">
          <article className="customers-detail-card">
            <span>Identity</span>
            <strong>{customer.fullName}</strong>
            <p>{customer.email}</p>
            <p>{customer.phone}</p>
          </article>
          <article className="customers-detail-card">
            <span>Commercial value</span>
            <strong>{formatMoney(customer.totalSpent)}</strong>
            <p>{customer.orderCount ?? 0} orders</p>
          </article>
          <article className="customers-detail-card">
            <span>Account</span>
            <strong>{customer.active ? "Actif" : "Inactif"}</strong>
            <p>Registered {formatDate(customer.registeredAt)}</p>
          </article>
          <article className="customers-detail-card">
            <span>Actions</span>
            <div className="table-actions customers-actions">
              <Link className="table-link" to={`/admin/orders?customer=${encodeURIComponent(customer.email ?? "")}`}>
                View orders
              </Link>
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
