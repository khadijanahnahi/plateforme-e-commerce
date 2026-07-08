import { Link } from "react-router-dom";

export default function ProductCard({ product, onAddToCart }) {
  const displayPrice = product.effectivePrice ?? product.price;

  return (
    <article className="product-card reveal-card">
      <div className="product-image">
        <span className="favorite-chip">{product.promotionBadgeLabel || product.status}</span>
        {product.imageUrl ? (
          <img className="catalog-image" src={product.imageUrl} alt={product.name} />
        ) : (
          <div className="product-placeholder"><span>{product.categoryName}</span></div>
        )}
      </div>
      <div className="product-copy">
        <h3>{product.name}</h3>
        <p>{product.description ?? "Article premium ShopSphere."}</p>
        <div className="price-row">
          <strong>{Number(displayPrice).toFixed(2)} DH</strong>
          <small>Stock: {product.stockQuantity}</small>
        </div>
        <div className="catalog-card-actions">
          <Link className="button button-secondary" to={`/products/${product.id}`}>Voir détails</Link>
          <button
            className="button button-primary"
            type="button"
            onClick={() => onAddToCart?.(product)}
            disabled={product.status !== "ACTIVE"}
          >
            Ajouter
          </button>
        </div>
      </div>
    </article>
  );
}
