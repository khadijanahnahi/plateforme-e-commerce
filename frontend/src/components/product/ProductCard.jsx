import { Link } from "react-router-dom";
import { Button } from "../ui";

function formatMoney(value) {
  return `${Number(value ?? 0).toFixed(2)} DH`;
}

function Rating({ averageRating, reviewCount }) {
  if (!reviewCount) return null;

  const roundedRating = Math.max(0, Math.min(5, Math.round(Number(averageRating) || 0)));
  return (
    <div className="catalog-product-rating" aria-label={`${Number(averageRating).toFixed(1)} sur 5, ${reviewCount} avis`}>
      <span aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <span className={index < roundedRating ? "is-filled" : ""} key={index}>★</span>
        ))}
      </span>
      <small>{Number(averageRating).toFixed(1)} ({reviewCount})</small>
    </div>
  );
}

function StockLabel({ stockQuantity }) {
  const stock = Number(stockQuantity ?? 0);
  if (stock <= 0) return <span className="catalog-product-stock is-out">Rupture de stock</span>;
  if (stock <= 5) return <span className="catalog-product-stock is-low">Plus que {stock} disponible{stock > 1 ? "s" : ""}</span>;
  return <span className="catalog-product-stock is-available">En stock</span>;
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 10h11M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M2.5 3.5h2l1.25 8.1a1.6 1.6 0 0 0 1.58 1.35h7.5a1.6 1.6 0 0 0 1.55-1.2L17.5 7H5.05" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="16" r="1" fill="currentColor" />
      <circle cx="15" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

export default function ProductCard({
  addPending = false,
  isWishlisted = false,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  product,
  wishlistPending = false,
}) {
  const displayPrice = product.effectivePrice ?? product.promotionalPrice ?? product.price;
  const originalPrice = product.originalPrice ?? product.price;
  const hasPromotion = Boolean(product.promotionActive) && Number(originalPrice) > Number(displayPrice);
  const outOfStock = Number(product.stockQuantity ?? 0) <= 0 || product.status === "OUT_OF_STOCK";
  const canBuy = product.status === "ACTIVE" && !outOfStock;
  const promotionLabel = product.promotionBadgeLabel
    || (product.discountPercentage != null ? `-${Math.round(Number(product.discountPercentage))}%` : "Promotion");

  return (
    <article className="catalog-product-card reveal-card">
      <div className="catalog-product-media">
        <div className="catalog-product-badges">
          {hasPromotion ? <span className="catalog-product-badge is-promotion">{promotionLabel}</span> : null}
          {outOfStock ? <span className="catalog-product-badge is-out">Rupture</span> : null}
        </div>

        <button
          className={`catalog-wishlist-button ${isWishlisted ? "is-active" : ""}`}
          type="button"
          aria-label={isWishlisted ? `Retirer ${product.name} de la wishlist` : `Ajouter ${product.name} à la wishlist`}
          aria-pressed={isWishlisted}
          disabled={wishlistPending}
          onClick={() => onToggleWishlist?.(product)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 20.4 4.2 13A5.2 5.2 0 0 1 11.5 5.6l.5.55.5-.55A5.2 5.2 0 0 1 19.8 13L12 20.4Z" />
          </svg>
        </button>

        <Link className="catalog-product-image-link" to={`/products/${product.id}`} aria-label={`Voir ${product.name}`}>
          {product.imageUrl ? (
            <img className="catalog-product-image" src={product.imageUrl} alt={product.name} loading="lazy" />
          ) : (
            <span className="catalog-product-image-fallback">{product.categoryName ?? "ShopSphere"}</span>
          )}
        </Link>
      </div>

      <div className="catalog-product-body">
        {product.categoryName ? <span className="catalog-product-category">{product.categoryName}</span> : null}
        <Link className="catalog-product-name" to={`/products/${product.id}`}>{product.name}</Link>
        {product.description ? <p className="catalog-product-description">{product.description}</p> : null}

        <Rating averageRating={product.averageRating} reviewCount={product.reviewCount} />

        <div className="catalog-product-commerce">
          <div className="catalog-product-price">
            <strong>{formatMoney(displayPrice)}</strong>
            {hasPromotion ? <del>{formatMoney(originalPrice)}</del> : null}
          </div>
          <StockLabel stockQuantity={product.stockQuantity} />
        </div>

        <div className="catalog-product-actions">
          <Button
            className="catalog-buy-button"
            disabled={!canBuy}
            iconRight={<ArrowIcon />}
            onClick={() => onBuyNow?.(product)}
          >
            {outOfStock ? "Produit indisponible" : "Acheter maintenant"}
          </Button>
          <Button
            className="catalog-add-button"
            disabled={!canBuy}
            iconLeft={<CartIcon />}
            loading={addPending}
            variant="outline"
            onClick={() => onAddToCart?.(product)}
          >
            {outOfStock ? "Rupture de stock" : "Ajouter au panier"}
          </Button>
        </div>
      </div>
    </article>
  );
}
