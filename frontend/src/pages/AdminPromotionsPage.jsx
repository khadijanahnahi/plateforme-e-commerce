import { useState } from "react";
import AdminPageHeader from "../components/layout/AdminPageHeader";
import AdminPromotionsTable from "../components/promotion/AdminPromotionsTable";
import PromotionFormModal from "../components/promotion/PromotionFormModal";
import {
  emptyPromotionForm,
  promotionStatuses,
  promotionTypes,
  toPromotionInputDateTime,
  useAdminPromotions,
} from "../hooks/useAdminPromotions";
import useFeedbackToast from "../hooks/useFeedbackToast";
import { Select } from "../components/ui";

export default function AdminPromotionsPage() {
  const {
    activeProducts,
    error,
    filters,
    loading,
    message,
    products,
    promotions,
    activatePromotion,
    applyFilters,
    deactivatePromotion,
    deletePromotion,
    expirePromotion,
    resetFilters,
    savePromotion,
    updateFilter,
  } = useAdminPromotions();
  useFeedbackToast(message, error);

  const [form, setForm] = useState(emptyPromotionForm);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => {
      if (name !== "productId") {
        return { ...current, [name]: value };
      }

      const selectedProduct = products.find((product) => String(product.id) === value);
      return {
        ...current,
        productId: value,
        originalPrice: selectedProduct?.price ?? current.originalPrice,
      };
    });
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyPromotionForm);
    setIsModalOpen(true);
  }

  function openEditModal(promotion) {
    setEditingId(promotion.id);
    setForm({
      productId: promotion.productId ?? "",
      title: promotion.title ?? "",
      description: promotion.description ?? "",
      promotionType: promotion.promotionType ?? "FLASH_SALE",
      originalPrice: promotion.originalPrice ?? "",
      promotionalPrice: promotion.promotionalPrice ?? "",
      startsAt: toPromotionInputDateTime(promotion.startsAt),
      endsAt: toPromotionInputDateTime(promotion.endsAt),
      status: promotion.status ?? "DRAFT",
      priority: promotion.priority ?? "100",
      badgeLabel: promotion.badgeLabel ?? "",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyPromotionForm);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const saved = await savePromotion(editingId, form);
    if (saved) {
      closeModal();
    }
  }

  async function runAction(promotion, action) {
    if (action === "delete") {
      const confirmed = window.confirm("Delete this promotion? It will be deactivated, not physically removed.");
      if (!confirmed) {
        return;
      }
      await deletePromotion(promotion.id);
      return;
    }

    if (action === "activate") {
      await activatePromotion(promotion.id);
    } else if (action === "deactivate") {
      await deactivatePromotion(promotion.id);
    } else if (action === "expire") {
      await expirePromotion(promotion.id);
    }
  }

  return (
    <section className="page admin-page">
      <AdminPageHeader
        kicker="Marketing"
        title="Promotions"
        description="Gérez les promotions saisonnières et les remises sur les produits."
        actionLabel="Créer une promotion"
        onAction={openCreateModal}
      />

      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="admin-panel promotions-panel">
        <form className="admin-search promotions-toolbar" onSubmit={applyFilters}>
          <Select name="status" value={filters.status} onChange={updateFilter}>
            <option value="">Statut : tous</option>
            {promotionStatuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </Select>
          <Select name="type" value={filters.type} onChange={updateFilter}>
            <option value="">Type : tous</option>
            {promotionTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </Select>
          <Select name="productId" value={filters.productId} onChange={updateFilter}>
            <option value="">Produit : tous</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </Select>
          <label className="check-row compact-check">
            <input name="activeOnly" type="checkbox" checked={filters.activeOnly} onChange={updateFilter} />
            <span>Actives uniquement</span>
          </label>
          <button className="button button-secondary" type="submit">Appliquer</button>
          <button className="button button-secondary" type="button" onClick={resetFilters}>Réinitialiser</button>
        </form>

        <div className="admin-list-summary">
          {promotions.length} promotion{promotions.length === 1 ? "" : "s"} affichée{promotions.length === 1 ? "" : "s"}
        </div>

        <AdminPromotionsTable
          loading={loading}
          onAction={runAction}
          onEdit={openEditModal}
          products={products}
          promotions={promotions}
        />
      </div>

      {isModalOpen ? (
        <PromotionFormModal
          activeProducts={activeProducts}
          editingId={editingId}
          form={form}
          onClose={closeModal}
          onFieldChange={updateField}
          onSubmit={handleSubmit}
          products={products}
        />
      ) : null}
    </section>
  );
}
