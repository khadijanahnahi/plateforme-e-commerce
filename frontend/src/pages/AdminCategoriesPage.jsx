import { useEffect, useMemo, useState } from "react";
import http from "../api/http";

const emptyForm = {
  name: "",
  description: "",
  imageUrl: "",
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch = !keyword
        || category.name?.toLowerCase().includes(keyword)
        || category.description?.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === "ALL"
        || (statusFilter === "ACTIVE" && category.active)
        || (statusFilter === "INACTIVE" && !category.active);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

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
      imageUrl: category.imageUrl ?? "",
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

  async function changeCategoryStatus(category) {
    setMessage("");
    setError("");

    try {
      if (category.active) {
        await http.patch(`/admin/categories/${category.id}/deactivate`);
        setMessage("Category deactivated.");
      } else {
        await http.patch(`/admin/categories/${category.id}/activate`);
        setMessage("Category activated.");
      }
      await loadCategories();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to update category status."));
    }
  }

  async function uploadCategoryImage(event) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setImageUploading(true);
    setMessage("");
    setError("");

    try {
      const response = await http.post("/admin/uploads/product-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setForm((current) => ({ ...current, imageUrl: response.data.imageUrl }));
      setMessage("Category image uploaded.");
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to upload category image."));
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  }

  return (
    <section className="page admin-page">
      <div className="admin-hero admin-hero-actions">
        <div>
          <span className="section-kicker">Admin taxonomy</span>
          <h1>Categories</h1>
          <p>Organiser le catalogue avec des categories actives ou desactivees.</p>
        </div>
        <button className="button button-primary" type="button" onClick={resetForm}>
          + New Category
        </button>
      </div>

      {message ? <div className="admin-alert admin-success">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="admin-panel-grid">
        <form className="admin-panel admin-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Update category" : "Create category"}</h2>
          <input name="name" value={form.name} onChange={updateField} placeholder="Category name" required />
          <textarea name="description" value={form.description} onChange={updateField} placeholder="Description" />
          <input name="imageUrl" value={form.imageUrl} onChange={updateField} placeholder="Image URL" />

          <div className="category-image-upload">
            <label>
              <span>Image locale</span>
              <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={uploadCategoryImage} />
              <small>{imageUploading ? "Uploading to Cloudinary..." : "PNG, JPG or WEBP accepted."}</small>
            </label>
            <div className="category-image-preview">
              {form.imageUrl ? (
                <img src={form.imageUrl} alt="Category preview" />
              ) : (
                <span>No image selected</span>
              )}
            </div>
          </div>

          <label className="check-row category-active-toggle">
            <input name="active" type="checkbox" checked={form.active} onChange={updateField} />
            <span className="toggle-ui" aria-hidden="true" />
            <span>Active category</span>
          </label>
          <div className="admin-form-actions">
            <button className="button button-primary" type="submit" disabled={imageUploading}>
              {editingId ? "Update category" : "Create category"}
            </button>
            {editingId ? <button className="button button-secondary" type="button" onClick={resetForm}>Cancel edit</button> : null}
          </div>
        </form>

        <div className="admin-panel">
          <div className="admin-product-toolbar admin-category-toolbar">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories..." />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="ALL">Status: All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6">Loading categories...</td></tr>
                ) : filteredCategories.length === 0 ? (
                  <tr><td colSpan="6">No categories found.</td></tr>
                ) : filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      {category.imageUrl ? (
                        <img className="admin-product-thumb" src={category.imageUrl} alt={category.name} />
                      ) : (
                        <span className="admin-product-thumb admin-product-thumb-empty">No image</span>
                      )}
                    </td>
                    <td>{category.name}</td>
                    <td>{category.description ?? "-"}</td>
                    <td>{category.productCount ?? 0}</td>
                    <td>
                      <span className={`status-pill ${category.active ? "status-active" : "status-archived"}`}>
                        {category.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="table-actions">
                      <button type="button" onClick={() => editCategory(category)}>Edit</button>
                      <button type="button" onClick={() => changeCategoryStatus(category)}>
                        {category.active ? "Deactivate" : "Activate"}
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
