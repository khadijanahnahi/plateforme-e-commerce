import { useEffect, useState } from "react";
import http from "../api/http";

const productStatuses = ["DRAFT", "ACTIVE", "OUT_OF_STOCK", "ARCHIVED"];
const PAGE_SIZE = 10;

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

function getApiErrorMessage(exception, fallback) {
  const status = exception.response?.status;
  const data = exception.response?.data;
  const validationErrors = data?.validationErrors
    ? Object.values(data.validationErrors).filter(Boolean).join(" ")
    : "";
  const message = validationErrors || data?.message || exception.message || fallback;

  return status ? `${message} (HTTP ${status})` : message;
}

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
  const [categoryFilter, setCategoryFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);

  const filteredProducts = products.filter((product) => {
    const matchesStatus = statusFilter ? product.status === statusFilter : true;
    const matchesCategory = categoryFilter ? String(product.categoryId) === categoryFilter : true;
    return matchesStatus && matchesCategory;
  });
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE,
  );
  const lowStockProducts = products.filter((product) => Number(product.stockQuantity) > 0 && Number(product.stockQuantity) <= 5);
  const productStats = {
    total: products.length,
    active: products.filter((product) => product.status === "ACTIVE").length,
    lowStock: lowStockProducts.length,
    outOfStock: products.filter((product) => Number(product.stockQuantity) === 0 || product.status === "OUT_OF_STOCK").length,
  };

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
          http.get("/admin/categories"),
        ]);
        if (mounted) {
          setProducts(productsResponse.data);
          setCategories(categoriesResponse.data.filter((category) => category.active));
          setError("");
        }
      } catch (exception) {
        if (mounted) {
          setError(getApiErrorMessage(exception, "Unable to load admin products."));
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

  function resetFilters() {
    setSearch("");
    setStatusFilter("");
    setCategoryFilter("");
    setCurrentPage(1);
    setLoading(true);
    loadProducts("")
      .then(() => setError(""))
      .catch((exception) => setError(getApiErrorMessage(exception, "Unable to reset filters.")))
      .finally(() => setLoading(false));
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
      setError(getApiErrorMessage(exception, "Unable to save product."));
    }
  }

  async function archiveProduct(id) {
    const confirmed = window.confirm("Archive this product? It will no longer be visible to customers.");
    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");
    try {
      await http.delete(`/admin/products/${id}`);
      setMessage("Product archived.");
      await loadProducts();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to archive product."));
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
      setError(getApiErrorMessage(exception, "Unable to update stock."));
    }
  }

  async function handleSearch(event) {
    event.preventDefault();
    setLoading(true);
    setCurrentPage(1);
    try {
      await loadProducts(search);
      setError("");
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to search products."));
    } finally {
      setLoading(false);
    }
  }

  function handleStatusFilterChange(event) {
    setStatusFilter(event.target.value);
    setCurrentPage(1);
  }

  function handleCategoryFilterChange(event) {
    setCategoryFilter(event.target.value);
    setCurrentPage(1);
  }

  function getStockBadge(product) {
    const stock = Number(product.stockQuantity);
    if (stock === 0) {
      return { label: "Out of stock", className: "stock-out" };
    }
    if (stock <= 5) {
      return { label: "Low stock", className: "stock-low" };
    }
    return { label: "In stock", className: "stock-in" };
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
      setError(getApiErrorMessage(exception, "Unable to upload image."));
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

      <div className="admin-product-stats">
        <article>
          <span>Total Products</span>
          <strong>{productStats.total}</strong>
        </article>
        <article>
          <span>Active</span>
          <strong>{productStats.active}</strong>
        </article>
        <article>
          <span>Low Stock</span>
          <strong>{productStats.lowStock}</strong>
        </article>
        <article>
          <span>Out of Stock</span>
          <strong>{productStats.outOfStock}</strong>
        </article>
      </div>

      <div className="admin-panel">
        <form className="admin-search admin-product-toolbar" onSubmit={handleSearch}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product..." />
          <select value={statusFilter} onChange={handleStatusFilterChange}>
            <option value="">Status: All</option>
            {productStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={categoryFilter} onChange={handleCategoryFilterChange}>
            <option value="">Category: All</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <button className="button button-secondary" type="submit">Search</button>
          <button className="button button-secondary" type="button" onClick={resetFilters}>Reset filters</button>
        </form>

        <div className="admin-list-summary">
          Showing {filteredProducts.length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1}-{Math.min(safeCurrentPage * PAGE_SIZE, filteredProducts.length)} of {filteredProducts.length} products
        </div>

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
              ) : paginatedProducts.map((product) => {
                const stockBadge = getStockBadge(product);
                return (
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
                    <td>
                      <div className="stock-cell">
                        <strong>{product.stockQuantity}</strong>
                        <span className={`stock-badge ${stockBadge.className}`}>{stockBadge.label}</span>
                      </div>
                    </td>
                    <td><span className={`status-pill status-${product.status.toLowerCase()}`}>{product.status}</span></td>
                    <td className="table-actions">
                      <button type="button" onClick={() => openEditModal(product)}>Modifier</button>
                      <button type="button" onClick={() => changeStock(product)}>Stock</button>
                      <button type="button" onClick={() => archiveProduct(product.id)}>Archiver</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && filteredProducts.length > PAGE_SIZE ? (
          <div className="pagination-bar">
            <span>Page {safeCurrentPage} of {totalPages}</span>
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
              {categories.length === 0 ? (
                <small className="admin-muted">Aucune categorie active disponible. Cree ou reactive une categorie avant d'ajouter un produit.</small>
              ) : null}
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
