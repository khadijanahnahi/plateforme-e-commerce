import { useEffect, useMemo, useState } from "react";
import http from "../api/http";

const promotionStatuses = ["DRAFT", "ACTIVE", "INACTIVE", "EXPIRED"];
const promotionTypes = ["FLASH_SALE", "SEASONAL", "CLEARANCE", "NEW_DROP", "MEMBER_DEAL"];

const emptyForm = {
  productId: "",
  title: "",
  description: "",
  promotionType: "FLASH_SALE",
  promotionalPrice: "",
  startsAt: "",
  endsAt: "",
  status: "DRAFT",
  priority: "100",
  badgeLabel: "",
};

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
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  return `${Number(value).toFixed(2)} DH`;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toInputDateTime(value) {
  if (!value) {
    return "";
  }
  return value.slice(0, 16);
}

function toPromotionRequest(form) {
  return {
    productId: Number(form.productId),
    title: form.title.trim(),
    description: form.description.trim() || null,
    promotionType: form.promotionType,
    promotionalPrice: Number(form.promotionalPrice),
    startsAt: form.startsAt,
    endsAt: form.endsAt,
    status: form.status,
    priority: form.priority === "" ? 100 : Number(form.priority),
    badgeLabel: form.badgeLabel.trim() || null,
  };
}

function validateForm(form) {
  if (!form.productId) {
    return "Product is required.";
  }
  if (!form.title.trim()) {
    return "Title is required.";
  }
  if (Number(form.promotionalPrice) <= 0) {
    return "Promotional price must be greater than 0.";
  }
  if (!form.startsAt || !form.endsAt) {
    return "Start and end dates are required.";
  }
  if (new Date(form.endsAt).getTime() <= new Date(form.startsAt).getTime()) {
    return "End date must be after start date.";
  }
  return "";
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    type: "",
    productId: "",
    activeOnly: false,
  });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const productMap = useMemo(() => {
    return new Map(products.map((product) => [Number(product.id), product]));
  }, [products]);

  const activeProducts = products.filter((product) => product.status === "ACTIVE");

  async function loadPromotions(nextFilters = filters) {
    const response = await http.get("/admin/promotions", {
      params: {
        status: nextFilters.status || undefined,
        type: nextFilters.type || undefined,
        productId: nextFilters.productId || undefined,
        activeOnly: nextFilters.activeOnly || undefined,
      },
    });
    setPromotions(response.data);
  }

  async function loadProducts() {
    const response = await http.get("/admin/products");
    setProducts(response.data);
  }

  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      try {
        const [promotionsResponse, productsResponse] = await Promise.all([
          http.get("/admin/promotions"),
          http.get("/admin/products"),
        ]);
        if (mounted) {
          setPromotions(promotionsResponse.data);
          setProducts(productsResponse.data);
          setError("");
        }
      } catch (exception) {
        if (mounted) {
          setError(getApiErrorMessage(exception, "Unable to load promotions."));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadInitialData();
    return () => {
      mounted = false;
    };
  }, []);

  function updateFilter(event) {
    const { name, value, type, checked } = event.target;
    setFilters((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function applyFilters(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await loadPromotions();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to filter promotions."));
    } finally {
      setLoading(false);
    }
  }

  async function resetFilters() {
    const nextFilters = { status: "", type: "", productId: "", activeOnly: false };
    setFilters(nextFilters);
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await loadPromotions(nextFilters);
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to reset promotion filters."));
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
    setIsModalOpen(true);
  }

  function openEditModal(promotion) {
    setEditingId(promotion.id);
    setForm({
      productId: promotion.productId ?? "",
      title: promotion.title ?? "",
      description: promotion.description ?? "",
      promotionType: promotion.promotionType ?? "FLASH_SALE",
      promotionalPrice: promotion.promotionalPrice ?? "",
      startsAt: toInputDateTime(promotion.startsAt),
      endsAt: toInputDateTime(promotion.endsAt),
      status: promotion.status ?? "DRAFT",
      priority: promotion.priority ?? "100",
      badgeLabel: promotion.badgeLabel ?? "",
    });
    setMessage("");
    setError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    const validationError = validateForm(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      if (editingId) {
        await http.put(`/admin/promotions/${editingId}`, toPromotionRequest(form));
        setMessage("Promotion updated.");
      } else {
        await http.post("/admin/promotions", toPromotionRequest(form));
        setMessage("Promotion created.");
      }
      closeModal();
      await Promise.all([loadPromotions(), loadProducts()]);
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to save promotion."));
    }
  }

  async function runAction(promotion, action) {
    setMessage("");
    setError("");
    try {
      if (action === "delete") {
        const confirmed = window.confirm("Delete this promotion? It will be deactivated, not physically removed.");
        if (!confirmed) {
          return;
        }
        await http.delete(`/admin/promotions/${promotion.id}`);
        setMessage("Promotion deleted.");
      } else {
        await http.patch(`/admin/promotions/${promotion.id}/${action}`);
        setMessage(`Promotion ${action}d.`);
      }
      await loadPromotions();
    } catch (exception) {
      setError(getApiErrorMessage(exception, `Unable to ${action} promotion.`));
    }
  }

  return (
    <section className="page admin-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">Admin marketing</span>
          <h1>Promotions</h1>
          <p>Manage flash sales, seasonal deals and product discounts.</p>
        </div>
        <button className="button button-primary" type="button" onClick={openCreateModal}>
          Create Promotion
        </button>
      </div>

      {message ? <div className="admin-alert admin-success">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="admin-panel promotions-panel">
        <form className="admin-search promotions-toolbar" onSubmit={applyFilters}>
          <select name="status" value={filters.status} onChange={updateFilter}>
            <option value="">Status: All</option>
            {promotionStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select name="type" value={filters.type} onChange={updateFilter}>
            <option value="">Type: All</option>
            {promotionTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select name="productId" value={filters.productId} onChange={updateFilter}>
            <option value="">Product: All</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
          <label className="check-row compact-check">
            <input name="activeOnly" type="checkbox" checked={filters.activeOnly} onChange={updateFilter} />
            <span>Active only</span>
          </label>
          <button className="button button-secondary" type="submit">Apply</button>
          <button className="button button-secondary" type="button" onClick={resetFilters}>Reset</button>
        </form>

        <div className="admin-list-summary">
          Showing {promotions.length} promotion{promotions.length === 1 ? "" : "s"}
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table promotions-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Promotion</th>
                <th>Type</th>
                <th>Prices</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8">Loading promotions...</td></tr>
              ) : promotions.length === 0 ? (
                <tr><td colSpan="8">No promotions found.</td></tr>
              ) : promotions.map((promotion) => {
                const product = productMap.get(Number(promotion.productId));
                return (
                  <tr key={promotion.id}>
                    <td>
                      <div className="promotion-product-cell">
                        {product?.imageUrl ? (
                          <img src={product.imageUrl} alt={promotion.productName} />
                        ) : (
                          <span>No image</span>
                        )}
                        <div>
                          <strong>{promotion.productName}</strong>
                          <small className="admin-muted">ID: {promotion.productId}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{promotion.title}</strong>
                      <small className="admin-muted">{promotion.badgeLabel || promotion.description || "No badge"}</small>
                    </td>
                    <td>{promotion.promotionType}</td>
                    <td>
                      <div className="promotion-price-stack">
                        <span className="promotion-old-price">{formatMoney(promotion.originalPrice)}</span>
                        <strong>{formatMoney(promotion.promotionalPrice)}</strong>
                        <small>-{Number(promotion.discountPercentage).toFixed(2)}%</small>
                      </div>
                    </td>
                    <td>
                      <small className="admin-muted">Start: {formatDateTime(promotion.startsAt)}</small>
                      <small className="admin-muted">End: {formatDateTime(promotion.endsAt)}</small>
                    </td>
                    <td>
                      <span className={`status-pill status-${String(promotion.status).toLowerCase()}`}>
                        {promotion.status}
                      </span>
                      {promotion.activeNow ? <small className="promotion-live-dot">Live now</small> : null}
                    </td>
                    <td>{promotion.priority}</td>
                    <td className="table-actions promotion-actions">
                      <button type="button" onClick={() => openEditModal(promotion)}>Edit</button>
                      {promotion.status !== "ACTIVE" ? (
                        <button type="button" onClick={() => runAction(promotion, "activate")}>Activate</button>
                      ) : (
                        <button type="button" onClick={() => runAction(promotion, "deactivate")}>Deactivate</button>
                      )}
                      <button type="button" onClick={() => runAction(promotion, "expire")}>Expire</button>
                      <button type="button" onClick={() => runAction(promotion, "delete")}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <div className="product-modal promotion-modal" role="dialog" aria-modal="true" aria-labelledby="promotion-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="section-kicker">Promotion form</span>
                <h2 id="promotion-modal-title">{editingId ? "Edit promotion" : "Create promotion"}</h2>
              </div>
              <button className="modal-close" type="button" onClick={closeModal}>Close</button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <select name="productId" value={form.productId} onChange={updateField} required>
                <option value="">Select product</option>
                {(editingId ? products : activeProducts).map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {formatMoney(product.price)}
                  </option>
                ))}
              </select>
              {activeProducts.length === 0 ? (
                <small className="admin-muted">No ACTIVE products available for a new promotion.</small>
              ) : null}

              <input name="title" value={form.title} onChange={updateField} placeholder="Promotion title" required />
              <textarea name="description" value={form.description} onChange={updateField} placeholder="Description" />

              <div className="admin-form-row">
                <select name="promotionType" value={form.promotionType} onChange={updateField}>
                  {promotionTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <input name="promotionalPrice" value={form.promotionalPrice} onChange={updateField} type="number" min="0.01" step="0.01" placeholder="Promotional price" required />
              </div>

              <div className="admin-form-row">
                <input name="startsAt" value={form.startsAt} onChange={updateField} type="datetime-local" required />
                <input name="endsAt" value={form.endsAt} onChange={updateField} type="datetime-local" required />
              </div>

              <div className="admin-form-row">
                <select name="status" value={form.status} onChange={updateField}>
                  {promotionStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                <input name="priority" value={form.priority} onChange={updateField} type="number" min="0" placeholder="Priority" />
              </div>

              <input name="badgeLabel" value={form.badgeLabel} onChange={updateField} placeholder="Badge label, example FLASH SALE" />

              <div className="admin-form-note">
                Backend keeps the final price source of truth. This form only sends the promotion data.
              </div>

              <div className="admin-form-actions">
                <button className="button button-primary" type="submit">
                  {editingId ? "Update promotion" : "Create promotion"}
                </button>
                <button className="button button-secondary" type="button" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
