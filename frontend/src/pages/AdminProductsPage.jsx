import { useState } from "react";
import { adminProductsApi, getApiErrorMessage } from "../api/adminProductsApi";
import AdminPageHeader from "../components/layout/AdminPageHeader";
import AdminProductsTable from "../components/product/AdminProductsTable";
import ProductImportModal from "../components/product/ProductImportModal";
import AdminStatsCard from "../components/ui/AdminStatsCard";
import { Button, ConfirmDialog, Input, Pagination, Select, Textarea, Toast } from "../components/ui";
import {
  ADMIN_PRODUCTS_PAGE_SIZE,
  CLOTHING_SIZES,
  useAdminProducts,
} from "../hooks/useAdminProducts";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  hasOriginalPrice: false,
  originalPrice: "",
  stockQuantity: 0,
  imageUrl: "",
  sku: "",
  status: "ACTIVE",
  categoryId: "",
  audience: "UNISEXE",
  hasSizes: false,
  variants: CLOTHING_SIZES.map((size) => ({ size, stockQuantity: 0, sku: "" })),
};

const productStatusOptions = [
  { value: "ACTIVE", label: "Actif" },
  { value: "DRAFT", label: "Brouillon" },
  { value: "OUT_OF_STOCK", label: "Rupture" },
  { value: "ARCHIVED", label: "Archivé" },
];

const audienceOptions = [
  { value: "UNISEXE", label: "Unisexe" },
  { value: "HOMME", label: "Homme" },
  { value: "FEMME", label: "Femme" },
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
    loadProducts,
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  function updateField(event) {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function updateVariant(size, field, value) {
    setForm((current) => ({
      ...current,
      variants: current.variants.map((variant) => (
        variant.size === size ? { ...variant, [field]: value } : variant
      )),
    }));
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
    setIsModalOpen(true);
  }

  function openEditModal(product) {
    const sizedVariants = (product.variants ?? []).filter((variant) => variant.size !== "TAILLE_UNIQUE");
    setEditingId(product.id);
    setForm({
      name: product.name ?? "",
      description: product.description ?? "",
      price: product.price ?? "",
      hasOriginalPrice: Boolean(product.promotionActive && Number(product.originalPrice) > Number(product.price)),
      originalPrice: product.originalPrice ?? "",
      stockQuantity: product.stockQuantity ?? 0,
      imageUrl: product.imageUrl ?? "",
      sku: product.sku ?? "",
      status: product.status ?? "ACTIVE",
      categoryId: product.categoryId ?? "",
      audience: product.audience ?? "UNISEXE",
      hasSizes: sizedVariants.length > 0,
      variants: CLOTHING_SIZES.map((size) => {
        const existing = sizedVariants.find((variant) => variant.size === size);
        return {
          id: existing?.id ?? null,
          size,
          stockQuantity: existing?.stockQuantity ?? 0,
          sku: existing?.sku ?? "",
        };
      }),
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

  async function handleProductsImported(report) {
    await loadProducts(search);
    setMessage(`${report.importedCount} produit${report.importedCount > 1 ? "s" : ""} importé${report.importedCount > 1 ? "s" : ""}.`);
  }

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

      <div className="admin-products-bulk-action">
        <div>
          <strong>Import catalogue en lot</strong>
          <span>Ajoutez jusqu’à 100 produits et leurs photos en une seule opération.</span>
        </div>
        <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>Importer CSV + ZIP</Button>
      </div>

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
                <label className="product-variant-toggle">
                  <input type="checkbox" name="hasOriginalPrice" checked={form.hasOriginalPrice} onChange={updateField} />
                  <span>
                    <strong>Afficher un ancien prix</strong>
                    <small>Créer une remise visible pour les clients</small>
                  </span>
                </label>
                {form.hasSizes ? (
                  <div className="product-total-stock" aria-live="polite">
                    <span>Stock total calculé</span>
                    <strong>{form.variants.reduce((total, variant) => total + Number(variant.stockQuantity || 0), 0)}</strong>
                  </div>
                ) : (
                  <Input fullWidth label="Quantité en stock" name="stockQuantity" value={form.stockQuantity} onChange={updateField} type="number" min="0" required />
                )}
              </div>
              {form.hasOriginalPrice ? (
                <Input
                  fullWidth
                  label="Ancien prix (DH)"
                  name="originalPrice"
                  value={form.originalPrice}
                  onChange={updateField}
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                />
              ) : null}
              <div className="admin-form-row">
                <Input fullWidth label="SKU" name="sku" value={form.sku} onChange={updateField} placeholder="Ex. TSHIRT-BLK-001" />
                <Select fullWidth label="Statut" name="status" value={form.status} onChange={updateField} options={productStatusOptions} />
              </div>
              <div className="admin-form-row">
                <Select fullWidth label="Public" name="audience" value={form.audience} onChange={updateField} options={audienceOptions} />
                <label className="product-variant-toggle">
                  <input type="checkbox" name="hasSizes" checked={form.hasSizes} onChange={updateField} />
                  <span>
                    <strong>Produit avec tailles</strong>
                    <small>Activer XS, S, M, L, XL et XXL</small>
                  </span>
                </label>
              </div>
              {form.hasSizes ? (
                <fieldset className="product-variants-editor">
                  <legend>Stock par taille</legend>
                  <p>Le stock total est calculé automatiquement depuis les tailles.</p>
                  <div className="product-variants-grid">
                    {form.variants.map((variant) => (
                      <div className="product-variant-row" key={variant.size}>
                        <strong>{variant.size}</strong>
                        <Input
                          aria-label={`Stock taille ${variant.size}`}
                          min="0"
                          type="number"
                          value={variant.stockQuantity}
                          onChange={(event) => updateVariant(variant.size, "stockQuantity", event.target.value)}
                        />
                        <Input
                          aria-label={`SKU taille ${variant.size}`}
                          placeholder={`SKU-${variant.size}`}
                          value={variant.sku}
                          onChange={(event) => updateVariant(variant.size, "sku", event.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </fieldset>
              ) : null}
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

      <ProductImportModal
        open={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImported={handleProductsImported}
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
