import { useEffect, useState } from "react";
import http from "../api/http";
import { queryClient } from "../api/queryClient";
import { Input, Select } from "../components/ui";

const emptyForm = {
  code: "",
  name: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minimumOrderAmount: "",
  maxDiscountAmount: "",
  usageLimit: "",
  perUserLimit: "",
  active: true,
  publiclyVisible: false,
  startsAt: "",
  expiresAt: "",
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

function toRequest(form) {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    description: form.description.trim() || null,
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    minimumOrderAmount: form.minimumOrderAmount === "" ? null : Number(form.minimumOrderAmount),
    maxDiscountAmount: form.maxDiscountAmount === "" ? null : Number(form.maxDiscountAmount),
    usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
    perUserLimit: form.perUserLimit === "" ? null : Number(form.perUserLimit),
    active: form.active,
    publiclyVisible: form.publiclyVisible,
    startsAt: form.startsAt || null,
    expiresAt: form.expiresAt || null,
  };
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCoupons() {
    const response = await http.get("/admin/coupons");
    setCoupons(response.data);
  }

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const response = await http.get("/admin/coupons");
        if (mounted) {
          setCoupons(response.data);
        }
      } catch (exception) {
        if (mounted) {
          setError(getApiErrorMessage(exception, "Unable to load coupons."));
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

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function editCoupon(coupon) {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code ?? "",
      name: coupon.name ?? "",
      description: coupon.description ?? "",
      discountType: coupon.discountType ?? "PERCENTAGE",
      discountValue: coupon.discountValue ?? "",
      minimumOrderAmount: coupon.minimumOrderAmount ?? "",
      maxDiscountAmount: coupon.maxDiscountAmount ?? "",
      usageLimit: coupon.usageLimit ?? "",
      perUserLimit: coupon.perUserLimit ?? "",
      active: Boolean(coupon.active),
      publiclyVisible: Boolean(coupon.publiclyVisible),
      startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 16) : "",
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 16) : "",
    });
    setMessage("");
    setError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      if (editingId) {
        await http.put(`/admin/coupons/${editingId}`, toRequest(form));
        setMessage("Coupon updated.");
      } else {
        await http.post("/admin/coupons", toRequest(form));
        setMessage("Coupon created.");
      }
      resetForm();
      await loadCoupons();
      await queryClient.invalidateQueries({ queryKey: ["public", "coupons", "active"] });
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to save coupon."));
    }
  }

  async function changeStatus(coupon) {
    setMessage("");
    setError("");
    try {
      await http.patch(`/admin/coupons/${coupon.id}/${coupon.active ? "deactivate" : "activate"}`);
      setMessage(coupon.active ? "Coupon deactivated." : "Coupon activated.");
      await loadCoupons();
      await queryClient.invalidateQueries({ queryKey: ["public", "coupons", "active"] });
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to update coupon status."));
    }
  }

  return (
    <section className="page admin-page">
      {message ? <div className="admin-alert admin-success">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="admin-panel-grid">
        <form className="admin-panel admin-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Update coupon" : "Create coupon"}</h2>
          <input name="code" value={form.code} onChange={updateField} placeholder="Code, example WELCOME20" required />
          <input name="name" value={form.name} onChange={updateField} placeholder="Coupon name" required />
          <textarea name="description" value={form.description} onChange={updateField} placeholder="Description" />
          <div className="admin-form-row">
            <Select name="discountType" value={form.discountType} onChange={updateField}>
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED_AMOUNT">Fixed amount</option>
            </Select>
            <input name="discountValue" type="number" min="0" step="0.01" value={form.discountValue} onChange={updateField} placeholder="Discount value" required />
          </div>
          <div className="admin-form-row">
            <input name="minimumOrderAmount" type="number" min="0" step="0.01" value={form.minimumOrderAmount} onChange={updateField} placeholder="Minimum order amount" />
            <input name="maxDiscountAmount" type="number" min="0" step="0.01" value={form.maxDiscountAmount} onChange={updateField} placeholder="Max discount amount" />
          </div>
          <div className="admin-form-row">
            <input name="usageLimit" type="number" min="1" value={form.usageLimit} onChange={updateField} placeholder="Usage limit" />
            <input name="perUserLimit" type="number" min="1" value={form.perUserLimit} onChange={updateField} placeholder="Per user limit" />
          </div>
          <div className="admin-form-row">
            <Input label="Début" name="startsAt" type="datetime-local" value={form.startsAt} onChange={updateField} />
            <Input label="Expiration" name="expiresAt" type="datetime-local" value={form.expiresAt} onChange={updateField} />
          </div>
          <label className="check-row category-active-toggle">
            <input name="active" type="checkbox" checked={form.active} onChange={updateField} />
            <span className="toggle-ui" aria-hidden="true" />
            <span>Active coupon</span>
          </label>
          <label className="check-row category-active-toggle">
            <input name="publiclyVisible" type="checkbox" checked={form.publiclyVisible} onChange={updateField} />
            <span className="toggle-ui" aria-hidden="true" />
            <span>Afficher publiquement aux clients</span>
          </label>
          <div className="admin-form-actions">
            <button className="button button-primary" type="submit">{editingId ? "Update coupon" : "Create coupon"}</button>
            {editingId ? <button className="button button-secondary" type="button" onClick={resetForm}>Cancel</button> : null}
          </div>
        </form>

        <div className="admin-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Discount</th>
                  <th>Usage</th>
                  <th>Status</th>
                  <th>Visibilité</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7">Loading coupons...</td></tr>
                ) : coupons.length === 0 ? (
                  <tr><td colSpan="7">No coupons found.</td></tr>
                ) : coupons.map((coupon) => (
                  <tr key={coupon.id}>
                    <td><strong>{coupon.code}</strong></td>
                    <td>{coupon.name}</td>
                    <td>{coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : `${Number(coupon.discountValue).toFixed(2)} DH`}</td>
                    <td>{coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}</td>
                    <td>
                      <span className={`status-pill ${coupon.active ? "status-active" : "status-archived"}`}>
                        {coupon.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill ${coupon.publiclyVisible ? "status-active" : "status-archived"}`}>
                        {coupon.publiclyVisible ? "PUBLIC" : "PRIVÉ"}
                      </span>
                    </td>
                    <td className="table-actions">
                      <button type="button" onClick={() => editCoupon(coupon)}>Edit</button>
                      <button type="button" onClick={() => changeStatus(coupon)}>
                        {coupon.active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
