import {
  formatPromotionMoney,
  promotionStatuses,
  promotionTypes,
} from "../../hooks/useAdminPromotions";
import { Input, Select } from "../ui";

export default function PromotionFormModal({
  activeProducts,
  editingId,
  form,
  onClose,
  onFieldChange,
  onSubmit,
  products,
}) {
  const selectableProducts = editingId ? products : activeProducts;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="product-modal promotion-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promotion-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="section-kicker">Formulaire de promotion</span>
            <h2 id="promotion-modal-title">{editingId ? "Modifier la promotion" : "Créer une promotion"}</h2>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>Fermer</button>
        </div>

        <form className="admin-form" onSubmit={onSubmit}>
          <Select name="productId" value={form.productId} onChange={onFieldChange} required>
            <option value="">Sélectionner un produit</option>
            {selectableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - {formatPromotionMoney(product.price)}
              </option>
            ))}
          </Select>
          {activeProducts.length === 0 ? (
            <small className="admin-muted">Aucun produit actif disponible pour une nouvelle promotion.</small>
          ) : null}

          <input name="title" value={form.title} onChange={onFieldChange} placeholder="Titre de la promotion" required />
          <textarea name="description" value={form.description} onChange={onFieldChange} placeholder="Description" />

          <div className="admin-form-row">
            <Select name="promotionType" value={form.promotionType} onChange={onFieldChange}>
              {promotionTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
            <input
              name="originalPrice"
              value={form.originalPrice}
              onChange={onFieldChange}
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Prix avant remise"
              required
            />
            <input
              name="promotionalPrice"
              value={form.promotionalPrice}
              onChange={onFieldChange}
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Prix promotionnel"
              required
            />
          </div>

          <div className="admin-form-row">
            <Input label="Début" name="startsAt" value={form.startsAt} onChange={onFieldChange} type="datetime-local" required />
            <Input label="Fin" name="endsAt" value={form.endsAt} onChange={onFieldChange} type="datetime-local" required />
          </div>

          <div className="admin-form-row">
            <Select name="status" value={form.status} onChange={onFieldChange}>
              {promotionStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </Select>
              <input name="priority" value={form.priority} onChange={onFieldChange} type="number" min="0" placeholder="Priorité" />
          </div>

          <input name="badgeLabel" value={form.badgeLabel} onChange={onFieldChange} placeholder="Libellé du badge, exemple PROMOTION" />

          <div className="admin-form-note">
            Le serveur reste la source de vérité du prix final. Ce formulaire envoie uniquement les données de promotion.
          </div>

          <div className="admin-form-actions">
            <button className="button button-primary" type="submit">
              {editingId ? "Modifier la promotion" : "Créer la promotion"}
            </button>
            <button className="button button-secondary" type="button" onClick={onClose}>Annuler</button>
          </div>
        </form>
      </div>
    </div>
  );
}
