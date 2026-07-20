import { useState } from "react";
import CategoryFormPanel from "../components/category/CategoryFormPanel";
import AdminCategoriesTable from "../components/category/AdminCategoriesTable";
import AdminPageHeader from "../components/layout/AdminPageHeader";
import AdminStatsCard from "../components/ui/AdminStatsCard";
import { Button, ConfirmDialog, Input, Pagination, Select, Toast } from "../components/ui";
import {
  ADMIN_CATEGORIES_PAGE_SIZE,
  categoryStatusFilters,
  emptyCategoryForm,
  useAdminCategories,
} from "../hooks/useAdminCategories";
import useFeedbackToast from "../hooks/useFeedbackToast";

const categoryStatusOptions = categoryStatusFilters
  .filter((status) => status !== "ALL")
  .map((status) => ({ value: status, label: status === "ACTIVE" ? "Actif" : "Inactif" }));

export default function AdminCategoriesPage() {
  const {
    categoryStats,
    currentPage,
    error,
    filteredCategories,
    imageUploading,
    loading,
    message,
    paginatedCategories,
    search,
    statusFilter,
    totalPages,
    changeCategoryStatus,
    resetFilters,
    saveCategory,
    setCurrentPage,
    setMessage,
    setSearch,
    setStatusFilter,
    uploadCategoryImage,
  } = useAdminCategories();
  useFeedbackToast(message, error);

  const [form, setForm] = useState(emptyCategoryForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivating, setDeactivating] = useState(false);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyCategoryForm);
    setIsModalOpen(true);
  }

  function editCategory(category) {
    setEditingId(category.id);
    setForm({
      name: category.name ?? "",
      description: category.description ?? "",
      imageUrl: category.imageUrl ?? "",
      active: Boolean(category.active),
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyCategoryForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const saved = await saveCategory(editingId, form);
    if (saved) {
      closeModal();
    }
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    const imageUrl = await uploadCategoryImage(file);
    if (imageUrl) {
      setForm((current) => ({ ...current, imageUrl }));
    }
    event.target.value = "";
  }

  async function handleConfirmDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await changeCategoryStatus(deactivateTarget);
      setDeactivateTarget(null);
    } finally {
      setDeactivating(false);
    }
  }

  const firstShown = filteredCategories.length === 0 ? 0 : (currentPage - 1) * ADMIN_CATEGORIES_PAGE_SIZE + 1;
  const lastShown = Math.min(currentPage * ADMIN_CATEGORIES_PAGE_SIZE, filteredCategories.length);

  return (
    <section className="page admin-page">
      <AdminPageHeader
        kicker="Admin taxonomy"
        title="Catégories"
        description="Organiser le catalogue avec des catégories actives ou désactivées."
        actionLabel="+ Ajouter une catégorie"
        onAction={openCreateModal}
      />

      <Toast message={message} open={Boolean(message)} onClose={() => setMessage("")} />
      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="admin-product-stats">
        <AdminStatsCard label="Total catégories" value={categoryStats.total} />
        <AdminStatsCard label="Actives" value={categoryStats.active} />
        <AdminStatsCard label="Inactives" value={categoryStats.inactive} />
      </div>

      <div className="admin-panel">
        <div className="admin-search admin-product-toolbar ui-product-filterbar">
          <Input
            aria-label="Rechercher une catégorie"
            fullWidth
            placeholder="Rechercher une catégorie..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select
            aria-label="Filtrer par statut"
            options={categoryStatusOptions}
            placeholder="Tous les statuts"
            value={statusFilter === "ALL" ? "" : statusFilter}
            onChange={(event) => setStatusFilter(event.target.value || "ALL")}
          />
          <Button type="button" variant="ghost" onClick={resetFilters}>Réinitialiser</Button>
        </div>

        <div className="admin-list-summary">
          Affichage de {firstShown} à {lastShown} sur {filteredCategories.length} catégories
        </div>

        <AdminCategoriesTable
          categories={paginatedCategories}
          loading={loading}
          onEdit={editCategory}
          onRequestDeactivate={setDeactivateTarget}
          onToggleStatus={changeCategoryStatus}
        />

        {!loading && filteredCategories.length > ADMIN_CATEGORIES_PAGE_SIZE ? (
          <div className="pagination-bar">
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        ) : null}
      </div>

      {isModalOpen ? (
        <CategoryFormPanel
          editingId={editingId}
          form={form}
          imageUploading={imageUploading}
          onCancelEdit={closeModal}
          onFieldChange={updateField}
          onImageUpload={handleImageUpload}
          onSubmit={handleSubmit}
        />
      ) : null}

      <ConfirmDialog
        confirmLabel="Désactiver"
        description="Cette catégorie ne sera plus visible par les clients. Les produits associés resteront intacts."
        loading={deactivating}
        open={Boolean(deactivateTarget)}
        title="Désactiver cette catégorie ?"
        variant="danger"
        onClose={() => !deactivating && setDeactivateTarget(null)}
        onConfirm={handleConfirmDeactivate}
      />
    </section>
  );
}
