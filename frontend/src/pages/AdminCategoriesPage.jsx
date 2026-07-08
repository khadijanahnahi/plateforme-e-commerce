import { useState } from "react";
import CategoryFormPanel from "../components/category/CategoryFormPanel";
import AdminCategoriesTable from "../components/category/AdminCategoriesTable";
import AdminPageHeader from "../components/layout/AdminPageHeader";
import {
  categoryStatusFilters,
  emptyCategoryForm,
  useAdminCategories,
} from "../hooks/useAdminCategories";

export default function AdminCategoriesPage() {
  const {
    error,
    filteredCategories,
    imageUploading,
    loading,
    message,
    search,
    statusFilter,
    changeCategoryStatus,
    resetFilters,
    saveCategory,
    setSearch,
    setStatusFilter,
    uploadCategoryImage,
  } = useAdminCategories();

  const [form, setForm] = useState(emptyCategoryForm);
  const [editingId, setEditingId] = useState(null);

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
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyCategoryForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const saved = await saveCategory(editingId, form);
    if (saved) {
      resetForm();
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

  return (
    <section className="page admin-page">
      <AdminPageHeader
        kicker="Admin taxonomy"
        title="Categories"
        description="Organiser le catalogue avec des categories actives ou desactivees."
        actionLabel="+ New Category"
        onAction={resetForm}
      />

      {message ? <div className="admin-alert admin-success">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="admin-panel-grid">
        <CategoryFormPanel
          editingId={editingId}
          form={form}
          imageUploading={imageUploading}
          onCancelEdit={resetForm}
          onFieldChange={updateField}
          onImageUpload={handleImageUpload}
          onSubmit={handleSubmit}
        />

        <div className="admin-panel">
          <div className="admin-product-toolbar admin-category-toolbar">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories..." />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {categoryStatusFilters.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "Status: All" : status === "ACTIVE" ? "Active" : "Inactive"}
                </option>
              ))}
            </select>
            <button className="button button-secondary" type="button" onClick={resetFilters}>
              Reset
            </button>
          </div>

          <AdminCategoriesTable
            categories={filteredCategories}
            loading={loading}
            onEdit={editCategory}
            onToggleStatus={changeCategoryStatus}
          />
        </div>
      </div>
    </section>
  );
}
