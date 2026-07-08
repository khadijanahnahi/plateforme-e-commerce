import { useMemo } from "react";
import {
  formatPromotionDateTime,
  formatPromotionMoney,
} from "../../hooks/useAdminPromotions";
import PromotionStatusBadge from "./PromotionStatusBadge";

export default function AdminPromotionsTable({
  loading,
  onAction,
  onEdit,
  products,
  promotions,
}) {
  const productMap = useMemo(() => {
    return new Map(products.map((product) => [Number(product.id), product]));
  }, [products]);

  return (
    <div className="admin-table-wrap">
      <table className="admin-table promotions-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Promotion</th>
            <th>Type</th>
            <th>Prices</th>
            <th>Dates</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="8">Loading promotions...</td></tr>
          ) : promotions.length === 0 ? (
            <tr><td colSpan="8">No promotions found.</td></tr>
          ) : promotions.map((promotion) => {
            const product = productMap.get(Number(promotion.productId));
            const imageUrl = promotion.productImageUrl ?? product?.imageUrl;
            const productName = promotion.productName ?? product?.name ?? "-";

            return (
              <tr key={promotion.id}>
                <td>
                  <div className="promotion-product-cell">
                    {imageUrl ? (
                      <img src={imageUrl} alt={productName} />
                    ) : (
                      <span>No image</span>
                    )}
                    <div>
                      <strong>{productName}</strong>
                      <small className="admin-muted">ID: {promotion.productId}</small>
                    </div>
                  </div>
                </td>
                <td>
                  <strong>{promotion.title}</strong>
                  <small className="admin-muted">
                    {promotion.badgeLabel || promotion.description || "No badge"}
                  </small>
                </td>
                <td>{promotion.promotionType}</td>
                <td>
                  <div className="promotion-price-stack">
                    <span className="promotion-old-price">
                      {formatPromotionMoney(promotion.originalPrice)}
                    </span>
                    <strong>{formatPromotionMoney(promotion.promotionalPrice)}</strong>
                    <small>-{Number(promotion.discountPercentage ?? 0).toFixed(2)}%</small>
                  </div>
                </td>
                <td>
                  <small className="admin-muted">Start: {formatPromotionDateTime(promotion.startsAt)}</small>
                  <small className="admin-muted">End: {formatPromotionDateTime(promotion.endsAt)}</small>
                </td>
                <td>
                  <PromotionStatusBadge activeNow={promotion.activeNow} status={promotion.status} />
                </td>
                <td>{promotion.priority}</td>
                <td className="table-actions promotion-actions">
                  <button type="button" onClick={() => onEdit(promotion)}>Edit</button>
                  {promotion.status !== "ACTIVE" ? (
                    <button type="button" onClick={() => onAction(promotion, "activate")}>Activate</button>
                  ) : (
                    <button type="button" onClick={() => onAction(promotion, "deactivate")}>Deactivate</button>
                  )}
                  <button type="button" onClick={() => onAction(promotion, "expire")}>Expire</button>
                  <button type="button" onClick={() => onAction(promotion, "delete")}>Delete</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
