import { useEffect, useState } from "react";
import http from "../api/http";

const emptyForm = {
  name: "",
  description: "",
  active: true,
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

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCategories() {
    const response = await http.get("/admin/categories");
    setCategories(response.data);
  }

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const response = await http.get("/admin/categories");
        if (mounted) {
          setCategories(response.data);
        }
      } catch (exception) {
        if (mounted) {
          setError(getApiErrorMessage(exception, "Unable to load categories."));
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

  function editCategory(category) {
    setEditingId(category.id);
    setForm({
      name: category.name ?? "",
      description: category.description ?? "",
      active: Boolean(category.active),
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
        await http.put(`/admin/categories/${editingId}`, form);
        setMessage("Category updated.");
      } else {
        await http.post("/admin/categories", form);
        setMessage("Category created.");
      }
      resetForm();
      await loadCategories();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to save category."));
    }
  }

  async function deactivateCategory(id) {
    setMessage("");
    setError("");
    try {
      await http.patch(`/admin/categories/${id}/deactivate`);
      setMessage("Category deactivated.");
      await loadCategories();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to deactivate category."));
    }
  }

  return (
    <section className="page admin-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">Admin taxonomy</span>
          <h1>Categories</h1>
          <p>Organiser le catalogue avec des categories actives ou desactivees.</p>
        </div>
      </div>

      {message ? <div className="admin-alert admin-success">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="admin-panel-grid">
        <form className="admin-panel admin-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Update category" : "Create category"}</h2>
          <input name="name" value={form.name} onChange={updateField} placeholder="Category name" required />
          <textarea name="description" value={form.description} onChange={updateField} placeholder="Description" />
          <label className="check-row">
            <input name="active" type="checkbox" checked={form.active} onChange={updateField} />
            <span>Active category</span>
          </label>
          <div className="admin-form-actions">
            <button className="button button-primary" type="submit">{editingId ? "Save changes" : "Create category"}</button>
            {editingId ? <button className="button button-secondary" type="button" onClick={resetForm}>Cancel</button> : null}
          </div>
        </form>

        <div className="admin-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4">Loading categories...</td></tr>
                ) : categories.length === 0 ? (
                  <tr><td colSpan="4">No categories found.</td></tr>
                ) : categories.map((category) => (
                  <tr key={category.id}>
                    <td>{category.name}</td>
                    <td>{category.description ?? "-"}</td>
                    <td>
                      <span className={`status-pill ${category.active ? "status-active" : "status-archived"}`}>
                        {category.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="table-actions">
                      <button type="button" onClick={() => editCategory(category)}>Edit</button>
                      <button type="button" onClick={() => deactivateCategory(category.id)} disabled={!category.active}>Deactivate</button>
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
