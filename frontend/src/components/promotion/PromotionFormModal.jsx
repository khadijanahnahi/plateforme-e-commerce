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
            <span className="section-kicker">Promotion form</span>
            <h2 id="promotion-modal-title">{editingId ? "Edit promotion" : "Create promotion"}</h2>
          </div>
          <button className="modal-close" type="button" onClick={onClose}>Close</button>
        </div>

        <form className="admin-form" onSubmit={onSubmit}>
          <Select name="productId" value={form.productId} onChange={onFieldChange} required>
            <option value="">Select product</option>
            {selectableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - {formatPromotionMoney(product.price)}
              </option>
            ))}
          </Select>
          {activeProducts.length === 0 ? (
            <small className="admin-muted">No ACTIVE products available for a new promotion.</small>
          ) : null}

          <input name="title" value={form.title} onChange={onFieldChange} placeholder="Promotion title" required />
          <textarea name="description" value={form.description} onChange={onFieldChange} placeholder="Description" />

          <div className="admin-form-row">
            <Select name="promotionType" value={form.promotionType} onChange={onFieldChange}>
              {promotionTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </Select>
            <input
              name="promotionalPrice"
              value={form.promotionalPrice}
              onChange={onFieldChange}
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Promotional price"
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
            <input name="priority" value={form.priority} onChange={onFieldChange} type="number" min="0" placeholder="Priority" />
          </div>

          <input name="badgeLabel" value={form.badgeLabel} onChange={onFieldChange} placeholder="Badge label, example FLASH SALE" />

          <div className="admin-form-note">
            Backend keeps the final price source of truth. This form only sends the promotion data.
          </div>

          <div className="admin-form-actions">
            <button className="button button-primary" type="submit">
              {editingId ? "Update promotion" : "Create promotion"}
            </button>
            <button className="button button-secondary" type="button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
