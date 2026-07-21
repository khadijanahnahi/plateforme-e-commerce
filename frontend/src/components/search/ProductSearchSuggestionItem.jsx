import { useState } from "react";

const moneyFormatter = new Intl.NumberFormat("fr-MA", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatMoney(value) {
  return `${moneyFormatter.format(Number(value ?? 0))} DH`;
}

export default function ProductSearchSuggestionItem({ active, id, onFocus, onSelect, product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasPromotion = product.promotionActive && Number(product.originalPrice) > Number(product.effectivePrice);
  const outOfStock = Number(product.stockQuantity ?? 0) === 0;

  return (
    <button
      aria-selected={active}
      className={`product-search-suggestion ${active ? "is-active" : ""}`}
      id={id}
      onClick={() => onSelect(product)}
      onFocus={onFocus}
      onMouseEnter={onFocus}
      role="option"
      type="button"
    >
      <span className="product-search-suggestion-image">
        {product.imageUrl && !imageFailed ? (
          <img
            alt={product.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            src={product.imageUrl}
          />
        ) : (
          <span aria-hidden="true">{product.name?.charAt(0)?.toUpperCase() || "S"}</span>
        )}
      </span>

      <span className="product-search-suggestion-copy">
        <strong>{product.name}</strong>
        <small>{product.categoryName || "ShopSphere"}</small>
        {outOfStock ? <em>Rupture de stock</em> : null}
      </span>

      <span className="product-search-suggestion-price">
        <strong>{formatMoney(product.effectivePrice)}</strong>
        {hasPromotion ? <del>{formatMoney(product.originalPrice)}</del> : null}
        {hasPromotion && product.discountPercentage ? <small>-{Math.round(Number(product.discountPercentage))}%</small> : null}
      </span>
    </button>
  );
}
