import { useEffect, useMemo, useState } from "react";
import http from "../api/http";

const emptyForm = {
  title: "",
  subtitle: "",
  imageUrl: "",
  buttonText: "",
  targetUrl: "",
  placement: "HOME_HERO",
  priority: "100",
  startsAt: "",
  endsAt: "",
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

function toRequest(form) {
  return {
    title: form.title.trim(),
    subtitle: form.subtitle.trim() || null,
    imageUrl: form.imageUrl.trim() || null,
    buttonText: form.buttonText.trim() || null,
    targetUrl: form.targetUrl.trim() || null,
    placement: form.placement,
    priority: form.priority === "" ? 100 : Number(form.priority),
    startsAt: form.startsAt || null,
    endsAt: form.endsAt || null,
    active: form.active,
  };
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [placementFilter, setPlacementFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredBanners = useMemo(() => {
    if (placementFilter === "ALL") {
      return banners;
    }
    return banners.filter((banner) => banner.placement === placementFilter);
  }, [banners, placementFilter]);

  async function loadBanners() {
    const response = await http.get("/admin/banners");
    setBanners(response.data);
  }

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const response = await http.get("/admin/banners");
        if (mounted) {
          setBanners(response.data);
        }
      } catch (exception) {
        if (mounted) {
          setError(getApiErrorMessage(exception, "Unable to load banners."));
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

  function editBanner(banner) {
    setEditingId(banner.id);
    setForm({
      title: banner.title ?? "",
      subtitle: banner.subtitle ?? "",
      imageUrl: banner.imageUrl ?? "",
      buttonText: banner.buttonText ?? "",
      targetUrl: banner.targetUrl ?? "",
      placement: banner.placement ?? "HOME_HERO",
      priority: banner.priority ?? "100",
      startsAt: banner.startsAt ? banner.startsAt.slice(0, 16) : "",
      endsAt: banner.endsAt ? banner.endsAt.slice(0, 16) : "",
      active: Boolean(banner.active),
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
        await http.put(`/admin/banners/${editingId}`, toRequest(form));
        setMessage("Banner updated.");
      } else {
        await http.post("/admin/banners", toRequest(form));
        setMessage("Banner created.");
      }
      resetForm();
      await loadBanners();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to save banner."));
    }
  }

  async function changeStatus(banner) {
    setMessage("");
    setError("");
    try {
      await http.patch(`/admin/banners/${banner.id}/${banner.active ? "deactivate" : "activate"}`);
      setMessage(banner.active ? "Banner deactivated." : "Banner activated.");
      await loadBanners();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to update banner status."));
    }
  }

  async function deleteBanner(banner) {
    setMessage("");
    setError("");
    try {
      await http.delete(`/admin/banners/${banner.id}`);
      setMessage("Banner deleted.");
      if (editingId === banner.id) {
        resetForm();
      }
      await loadBanners();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to delete banner."));
    }
  }

  async function uploadBannerImage(event) {
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
      setMessage("Banner image uploaded.");
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to upload banner image."));
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  }

  return (
    <section className="page admin-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">Admin marketing</span>
          <h1>Banners</h1>
          <p>Manage internal homepage campaigns and promotional placements.</p>
        </div>
      </div>

      {message ? <div className="admin-alert admin-success">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="admin-panel-grid">
        <form className="admin-panel admin-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Update banner" : "Create banner"}</h2>
          <input name="title" value={form.title} onChange={updateField} placeholder="Title" required />
          <textarea name="subtitle" value={form.subtitle} onChange={updateField} placeholder="Subtitle" />
          <input name="imageUrl" value={form.imageUrl} onChange={updateField} placeholder="Image URL" />

          <div className="banner-image-upload">
            <label>
              <span>Image locale</span>
              <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={uploadBannerImage} />
              <small>{imageUploading ? "Uploading..." : "PNG, JPG or WEBP accepted."}</small>
            </label>
            <div className="banner-form-preview">
              {form.imageUrl ? <img src={form.imageUrl} alt="Banner preview" /> : <span>No image selected</span>}
            </div>
          </div>
          <div className="admin-form-row">
            <input name="buttonText" value={form.buttonText} onChange={updateField} placeholder="Button text" />
            <input name="targetUrl" value={form.targetUrl} onChange={updateField} placeholder="/products or https://..." />
          </div>
          <div className="admin-form-row">
            <select name="placement" value={form.placement} onChange={updateField}>
              <option value="HOME_HERO">Home hero</option>
              <option value="HOME_MIDDLE">Home middle</option>
              <option value="HOME_BOTTOM">Home bottom</option>
            </select>
            <input name="priority" type="number" value={form.priority} onChange={updateField} placeholder="Priority" />
          </div>
          <div className="admin-form-row">
            <input name="startsAt" type="datetime-local" value={form.startsAt} onChange={updateField} />
            <input name="endsAt" type="datetime-local" value={form.endsAt} onChange={updateField} />
          </div>
          <label className="check-row category-active-toggle">
            <input name="active" type="checkbox" checked={form.active} onChange={updateField} />
            <span className="toggle-ui" aria-hidden="true" />
            <span>Active banner</span>
          </label>
          <div className="admin-form-actions">
            <button className="button button-primary" type="submit" disabled={imageUploading}>{editingId ? "Update banner" : "Create banner"}</button>
            {editingId ? <button className="button button-secondary" type="button" onClick={resetForm}>Cancel</button> : null}
          </div>
        </form>

        <div className="admin-panel">
          <div className="admin-search">
            <select value={placementFilter} onChange={(event) => setPlacementFilter(event.target.value)}>
              <option value="ALL">Placement: All</option>
              <option value="HOME_HERO">Home hero</option>
              <option value="HOME_MIDDLE">Home middle</option>
              <option value="HOME_BOTTOM">Home bottom</option>
            </select>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Title</th>
                  <th>Placement</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6">Loading banners...</td></tr>
                ) : filteredBanners.length === 0 ? (
                  <tr><td colSpan="6">No banners found.</td></tr>
                ) : filteredBanners.map((banner) => (
                  <tr key={banner.id}>
                    <td>
                      <div className="admin-product-thumb">
                        {banner.imageUrl ? (
                          <img src={banner.imageUrl} alt={banner.title} />
                        ) : (
                          <span className="admin-product-thumb-empty">No image</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <strong>{banner.title}</strong>
                      <small>{banner.subtitle}</small>
                    </td>
                    <td>{banner.placement}</td>
                    <td>{banner.priority}</td>
                    <td>
                      <span className={`status-pill ${banner.active ? "status-active" : "status-archived"}`}>
                        {banner.active ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="table-actions">
                      <button type="button" onClick={() => editBanner(banner)}>Edit</button>
                      <button type="button" onClick={() => changeStatus(banner)}>
                        {banner.active ? "Deactivate" : "Activate"}
                      </button>
                      <button type="button" onClick={() => deleteBanner(banner)}>Delete</button>
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
