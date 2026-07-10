import { Link } from "react-router-dom";
import { Button } from "../ui";

export default function ProductCard({
  addPending = false,
  isWishlisted = false,
  onAddToCart,
  onToggleWishlist,
  product,
  wishlistPending = false,
}) {
  const displayPrice = product.effectivePrice ?? product.price;

  return (
    <article className="product-card reveal-card">
      <div className="product-image">
        <span className="favorite-chip">{product.promotionBadgeLabel || product.status}</span>
        <button
          className={`wishlist-heart-button ${isWishlisted ? "is-active" : ""}`}
          type="button"
          aria-label={isWishlisted ? "Supprimer de la wishlist" : "Ajouter à la wishlist"}
          disabled={wishlistPending}
          onClick={() => onToggleWishlist?.(product)}
        >
          {isWishlisted ? "\u2665" : "\u2661"}
        </button>
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
          <small>Stock : {product.stockQuantity}</small>
        </div>
        <div className="catalog-card-actions">
          <Link className="button button-secondary" to={`/products/${product.id}`}>Voir détails</Link>
          <Button
            loading={addPending}
            onClick={() => onAddToCart?.(product)}
            disabled={product.status !== "ACTIVE"}
          >
            Ajouter
          </Button>
        </div>
      </div>
    </article>
  );
}
