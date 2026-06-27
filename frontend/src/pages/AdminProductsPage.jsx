import { useEffect, useState } from "react";
import http from "../api/http";

const productStatuses = ["DRAFT", "ACTIVE", "OUT_OF_STOCK", "ARCHIVED"];

const emptyForm = {
  name: "",
  description: "",
  price: "",
  stockQuantity: 0,
  imageUrl: "",
  sku: "",
  status: "ACTIVE",
  categoryId: "",
};

function toProductRequest(form) {
  return {
    name: form.name,
    description: form.description || null,
    price: Number(form.price),
    stockQuantity: Number(form.stockQuantity),
    imageUrl: form.imageUrl || null,
    sku: form.sku || null,
    status: form.status,
    categoryId: Number(form.categoryId),
  };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);

  const filteredProducts = statusFilter
    ? products.filter((product) => product.status === statusFilter)
    : products;

  async function loadProducts(nextSearch = search) {
    const response = await http.get("/admin/products", {
      params: { search: nextSearch || undefined },
    });
    setProducts(response.data);
  }

  useEffect(() => {
    let mounted = true;

    async function loadInitialData() {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          http.get("/admin/products"),
          http.get("/categories"),
        ]);
        if (mounted) {
          setProducts(productsResponse.data);
          setCategories(categoriesResponse.data);
          setError("");
        }
      } catch (exception) {
        if (mounted) {
          setError(exception.response?.data?.message ?? "Unable to load admin products.");
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

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
    setIsModalOpen(true);
  }

  function openEditModal(product) {
    setEditingId(product.id);
    setForm({
      name: product.name ?? "",
      description: product.description ?? "",
      price: product.price ?? "",
      stockQuantity: product.stockQuantity ?? 0,
      imageUrl: product.imageUrl ?? "",
      sku: product.sku ?? "",
      status: product.status ?? "ACTIVE",
      categoryId: product.categoryId ?? "",
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

    try {
      if (editingId) {
        await http.put(`/admin/products/${editingId}`, toProductRequest(form));
        setMessage("Product updated.");
      } else {
        await http.post("/admin/products", toProductRequest(form));
        setMessage("Product created.");
      }
      closeModal();
      await loadProducts();
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Unable to save product.");
    }
  }

  async function archiveProduct(id) {
    setMessage("");
    setError("");
    try {
      await http.delete(`/admin/products/${id}`);
      setMessage("Product archived.");
      await loadProducts();
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Unable to archive product.");
    }
  }

  async function changeStock(product) {
    const value = window.prompt("New stock quantity", product.stockQuantity);
    if (value === null) {
      return;
    }

    const stockQuantity = Number(value);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      setError("Stock must be a positive integer or zero.");
      return;
    }

    setMessage("");
    setError("");
    try {
      await http.patch(`/admin/products/${product.id}/stock`, { stockQuantity });
      setMessage("Stock updated.");
      await loadProducts();
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Unable to update stock.");
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await loadProducts(search);
      setError("");
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Unable to search products.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadProductImage(event) {
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
      setMessage("Image uploaded.");
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Unable to upload image.");
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  }

  return (
    <section className="page admin-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">Admin inventory</span>
          <h1>Gestion des produits</h1>
          <p>Creer, modifier, archiver et gerer le stock des produits ShopSphere.</p>
        </div>
        <button className="button button-primary" type="button" onClick={openCreateModal}>
          + Ajouter un produit
        </button>
      </div>

      {message ? <div className="admin-alert admin-success">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="admin-panel">
        <form className="admin-search admin-product-toolbar" onSubmit={handleSearch}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product..." />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">Status: All</option>
            {productStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <button className="button button-secondary" type="submit">Search</button>
        </form>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Nom produit</th>
                <th>Categorie</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7">Loading products...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="7">No products found.</td></tr>
              ) : filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    {product.imageUrl ? (
                      <img className="admin-product-thumb" src={product.imageUrl} alt={product.name} />
                    ) : (
                      <span className="admin-product-thumb admin-product-thumb-empty">No image</span>
                    )}
                  </td>
                  <td>
                    <strong>{product.name}</strong>
                    <small className="admin-muted">SKU: {product.sku ?? "-"}</small>
                  </td>
                  <td>{product.categoryName}</td>
                  <td>{Number(product.price).toFixed(2)} DH</td>
                  <td>{product.stockQuantity}</td>
                  <td><span className={`status-pill status-${product.status.toLowerCase()}`}>{product.status}</span></td>
                  <td className="table-actions">
                    <button type="button" onClick={() => openEditModal(product)}>Modifier</button>
                    <button type="button" onClick={() => changeStock(product)}>Stock</button>
                    <button type="button" onClick={() => archiveProduct(product.id)}>Archiver</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="section-kicker">Product form</span>
                <h2 id="product-modal-title">{editingId ? "Modifier le produit" : "Ajouter un produit"}</h2>
              </div>
              <button className="modal-close" type="button" onClick={closeModal}>Close</button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <input name="name" value={form.name} onChange={updateField} placeholder="Nom du produit" required />
              <textarea name="description" value={form.description} onChange={updateField} placeholder="Description" />
              <div className="admin-form-row">
                <input name="price" value={form.price} onChange={updateField} type="number" min="0" step="0.01" placeholder="Prix" required />
                <input name="stockQuantity" value={form.stockQuantity} onChange={updateField} type="number" min="0" placeholder="Quantite en stock" required />
              </div>
              <div className="admin-form-row">
                <input name="sku" value={form.sku} onChange={updateField} placeholder="SKU" />
                <select name="status" value={form.status} onChange={updateField}>
                  {productStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </div>
              <div className="product-image-upload">
                <label>
                  <span>Image locale</span>
                  <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={uploadProductImage} />
                </label>
                {imageUploading ? <small>Uploading image...</small> : null}
                {form.imageUrl ? (
                  <img className="product-image-preview" src={form.imageUrl} alt="Product preview" />
                ) : (
                  <div className="product-image-preview product-image-preview-empty">No image selected</div>
                )}
              </div>
              <input name="imageUrl" value={form.imageUrl} onChange={updateField} placeholder="Image URL" />
              <select name="categoryId" value={form.categoryId} onChange={updateField} required>
                <option value="">Categorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <div className="admin-form-actions">
                <button className="button button-primary" type="submit">
                  {editingId ? "Enregistrer" : "Ajouter le produit"}
                </button>
                <button className="button button-secondary" type="button" onClick={closeModal}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
