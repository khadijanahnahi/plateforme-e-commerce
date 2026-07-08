import { useState } from "react";
import { adminProductsApi, getApiErrorMessage } from "../api/adminProductsApi";
import AdminPageHeader from "../components/layout/AdminPageHeader";
import AdminProductsTable from "../components/product/AdminProductsTable";
import AdminFilterBar from "../components/ui/AdminFilterBar";
import AdminStatsCard from "../components/ui/AdminStatsCard";
import {
  ADMIN_PRODUCTS_PAGE_SIZE,
  productStatuses,
  useAdminProducts,
} from "../hooks/useAdminProducts";

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

export default function AdminProductsPage() {
  const {
    categories,
    categoryFilter,
    currentPage,
    error,
    filteredProducts,
    loading,
    message,
    paginatedProducts,
    productStats,
    search,
    statusFilter,
    totalPages,
    archiveProduct,
    resetFilters,
    saveProduct,
    searchProducts,
    setCurrentPage,
    setError,
    setMessage,
    setSearch,
    updateCategoryFilter,
    updateStatusFilter,
    updateStock,
  } = useAdminProducts();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

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
      await saveProduct(editingId, form);
      closeModal();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to save product."));
    }
  }

  async function handleArchiveProduct(id) {
    const confirmed = window.confirm("Archive this product? It will no longer be visible to customers.");
    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");
    try {
      await archiveProduct(id);
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to archive product."));
    }
  }

  async function handleStockChange(product) {
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
      await updateStock(product, stockQuantity);
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to update stock."));
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
      const response = await adminProductsApi.uploadProductImage(formData);
      setForm((current) => ({ ...current, imageUrl: response.data.imageUrl }));
      setMessage("Image uploaded.");
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to upload image."));
    } finally {
      setImageUploading(false);
      event.target.value = "";
    }
  }

  const firstShown = filteredProducts.length === 0 ? 0 : (currentPage - 1) * ADMIN_PRODUCTS_PAGE_SIZE + 1;
  const lastShown = Math.min(currentPage * ADMIN_PRODUCTS_PAGE_SIZE, filteredProducts.length);

  return (
    <section className="page admin-page">
      <AdminPageHeader
        kicker="Admin inventory"
        title="Gestion des produits"
        description="Creer, modifier, archiver et gerer le stock des produits ShopSphere."
        actionLabel="+ Ajouter un produit"
        onAction={openCreateModal}
      />

      {message ? <div className="admin-alert admin-success">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="admin-product-stats">
        <AdminStatsCard label="Total Products" value={productStats.total} />
        <AdminStatsCard label="Active" value={productStats.active} />
        <AdminStatsCard label="Low Stock" value={productStats.lowStock} />
        <AdminStatsCard label="Out of Stock" value={productStats.outOfStock} />
      </div>

      <div className="admin-panel">
        <AdminFilterBar
          categories={categories}
          categoryFilter={categoryFilter}
          onCategoryChange={updateCategoryFilter}
          onReset={resetFilters}
          onSearchChange={setSearch}
          onStatusChange={updateStatusFilter}
          onSubmit={searchProducts}
          search={search}
          statusFilter={statusFilter}
          statuses={productStatuses}
        />

        <div className="admin-list-summary">
          Showing {firstShown}-{lastShown} of {filteredProducts.length} products
        </div>

        <AdminProductsTable
          loading={loading}
          onArchive={handleArchiveProduct}
          onEdit={openEditModal}
          onStockChange={handleStockChange}
          products={paginatedProducts}
        />

        {!loading && filteredProducts.length > ADMIN_PRODUCTS_PAGE_SIZE ? (
          <div className="pagination-bar">
            <span>Page {currentPage} of {totalPages}</span>
            <div className="pagination-controls">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  className={page === currentPage ? "pagination-active" : ""}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
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
