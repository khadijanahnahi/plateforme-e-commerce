import { useState } from "react";
import { adminProductsApi, getApiErrorMessage } from "../api/adminProductsApi";
import AdminPageHeader from "../components/layout/AdminPageHeader";
import AdminProductsTable from "../components/product/AdminProductsTable";
import AdminStatsCard from "../components/ui/AdminStatsCard";
import { Button, ConfirmDialog, Input, Pagination, Select, Textarea, Toast } from "../components/ui";
import {
  ADMIN_PRODUCTS_PAGE_SIZE,
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

const productStatusOptions = [
  { value: "ACTIVE", label: "Actif" },
  { value: "DRAFT", label: "Brouillon" },
  { value: "OUT_OF_STOCK", label: "Rupture" },
  { value: "ARCHIVED", label: "Archivé" },
];

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
    deleteProduct,
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
  const [archiveTargetId, setArchiveTargetId] = useState(null);
  const [archiving, setArchiving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

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
      setError(getApiErrorMessage(exception, "Impossible d’enregistrer le produit."));
    }
  }

  async function handleArchiveProduct() {
    if (!archiveTargetId) return;
    setArchiving(true);
    setMessage("");
    setError("");
    try {
      await archiveProduct(archiveTargetId);
      setArchiveTargetId(null);
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible d’archiver le produit."));
    } finally {
      setArchiving(false);
    }
  }

  async function handleDeleteProduct() {
    if (!deleteTargetId) return;
    setDeleting(true);
    setMessage("");
    setError("");
    try {
      await deleteProduct(deleteTargetId);
      setDeleteTargetId(null);
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de supprimer le produit."));
    } finally {
      setDeleting(false);
    }
  }

  async function handleStockChange(product) {
    const value = window.prompt("Nouvelle quantité en stock", product.stockQuantity);
    if (value === null) {
      return;
    }

    const stockQuantity = Number(value);
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      setError("Le stock doit être un entier positif ou égal à zéro.");
      return;
    }

    setMessage("");
    setError("");
    try {
      await updateStock(product, stockQuantity);
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de modifier le stock."));
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
      setMessage("Image importée avec succès.");
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible d’importer l’image."));
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
        kicker="Inventaire admin"
        title="Gestion des produits"
        description="Créer, modifier, archiver, supprimer et gérer le stock des produits ShopSphere."
        actionLabel="+ Ajouter un produit"
        onAction={openCreateModal}
      />

      <Toast message={message} open={Boolean(message)} onClose={() => setMessage("")} />
      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="admin-product-stats">
        <AdminStatsCard label="Total produits" value={productStats.total} />
        <AdminStatsCard label="Actifs" value={productStats.active} />
        <AdminStatsCard label="Stock faible" value={productStats.lowStock} />
        <AdminStatsCard label="Rupture de stock" value={productStats.outOfStock} />
      </div>

      <div className="admin-panel">
        <form className="admin-search admin-product-toolbar ui-product-filterbar" onSubmit={searchProducts}>
          <Input aria-label="Rechercher un produit" fullWidth placeholder="Rechercher un produit..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select
            aria-label="Filtrer par statut"
            options={productStatusOptions}
            placeholder="Tous les statuts"
            value={statusFilter}
            onChange={(event) => updateStatusFilter(event.target.value)}
          />
          <Select
            aria-label="Filtrer par catégorie"
            options={categories.map((category) => ({ value: category.id, label: category.name }))}
            placeholder="Toutes les catégories"
            value={categoryFilter}
            onChange={(event) => updateCategoryFilter(event.target.value)}
          />
          <Button type="submit" variant="outline">Rechercher</Button>
          <Button type="button" variant="ghost" onClick={resetFilters}>Réinitialiser</Button>
        </form>

        <div className="admin-list-summary">
          Affichage de {firstShown} à {lastShown} sur {filteredProducts.length} produits
        </div>

        <AdminProductsTable
          loading={loading}
          onArchive={setArchiveTargetId}
          onDelete={setDeleteTargetId}
          onEdit={openEditModal}
          onStockChange={handleStockChange}
          products={paginatedProducts}
        />

        {!loading && filteredProducts.length > ADMIN_PRODUCTS_PAGE_SIZE ? (
          <div className="pagination-bar"><Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} /></div>
        ) : null}
      </div>

      {isModalOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={closeModal}>
          <div className="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="section-kicker">Formulaire produit</span>
                <h2 id="product-modal-title">{editingId ? "Modifier le produit" : "Ajouter un produit"}</h2>
              </div>
              <Button size="sm" variant="ghost" onClick={closeModal}>Fermer</Button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <Input fullWidth label="Nom du produit" name="name" value={form.name} onChange={updateField} placeholder="Ex. T-shirt oversize noir" required />
              <Textarea fullWidth label="Description" name="description" value={form.description} onChange={updateField} placeholder="Description du produit" />
              <div className="admin-form-row">
                <Input fullWidth label="Prix (DH)" name="price" value={form.price} onChange={updateField} type="number" min="0" step="0.01" required />
                <Input fullWidth label="Quantité en stock" name="stockQuantity" value={form.stockQuantity} onChange={updateField} type="number" min="0" required />
              </div>
              <div className="admin-form-row">
                <Input fullWidth label="SKU" name="sku" value={form.sku} onChange={updateField} placeholder="Ex. TSHIRT-BLK-001" />
                <Select fullWidth label="Statut" name="status" value={form.status} onChange={updateField} options={productStatusOptions} />
              </div>
              <div className="product-image-upload">
                <label>
                  <span>Image locale</span>
                  <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={uploadProductImage} />
                </label>
                {imageUploading ? <small>Importation de l’image...</small> : null}
                {form.imageUrl ? (
                  <img className="product-image-preview" src={form.imageUrl} alt="Aperçu du produit" />
                ) : (
                  <div className="product-image-preview product-image-preview-empty">Aucune image sélectionnée</div>
                )}
              </div>
              <Input fullWidth label="URL de l’image" name="imageUrl" value={form.imageUrl} onChange={updateField} placeholder="https://..." />
              <Select fullWidth label="Catégorie" name="categoryId" value={form.categoryId} onChange={updateField} placeholder="Sélectionner une catégorie" options={categories.map((category) => ({ value: category.id, label: category.name }))} required />
              {categories.length === 0 ? (
                <small className="admin-muted">Aucune catégorie active disponible. Créez ou réactivez une catégorie avant d’ajouter un produit.</small>
              ) : null}
              <div className="admin-form-actions">
                <Button type="submit">{editingId ? "Enregistrer" : "Ajouter le produit"}</Button>
                <Button type="button" variant="outline" onClick={closeModal}>Annuler</Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel="Archiver"
        description="Ce produit ne sera plus visible par les clients. Les anciennes commandes resteront intactes."
        loading={archiving}
        open={Boolean(archiveTargetId)}
        title="Archiver ce produit ?"
        variant="danger"
        onClose={() => !archiving && setArchiveTargetId(null)}
        onConfirm={handleArchiveProduct}
      />

      <ConfirmDialog
        confirmLabel="Supprimer"
        description="Cette action supprime définitivement le produit seulement s'il n'est lié à aucune commande, promotion, avis ou historique de stock. Sinon, utilisez Archiver."
        loading={deleting}
        open={Boolean(deleteTargetId)}
        title="Supprimer définitivement ce produit ?"
        variant="danger"
        onClose={() => !deleting && setDeleteTargetId(null)}
        onConfirm={handleDeleteProduct}
      />
    </section>
  );
}
