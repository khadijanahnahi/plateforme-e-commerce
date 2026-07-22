import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { productApi } from "../../api/productApi";
import { Button, Skeleton } from "../../components/ui";
import { useCart } from "../../hooks/useCart";

function normalizeProducts(data) {
  if (Array.isArray(data)) return data;
  return data?.content ?? [];
}

function formatMoney(value) {
  return `${Number(value ?? 0).toFixed(2)} DH`;
}

async function loadRecommendations(cartProductIds) {
  const productDetails = await Promise.all(
    cartProductIds.map((productId) => productApi.getProduct(productId).then((response) => response.data).catch(() => null)),
  );
  const categoryIds = [...new Set(productDetails.map((product) => product?.categoryId).filter(Boolean))].slice(0, 3);

  const [fallbackResponse, ...categoryResponses] = await Promise.all([
    productApi.getProducts({ page: 0, size: 16 }),
    ...categoryIds.map((categoryId) => productApi.getProducts({ categoryId, page: 0, size: 8 })),
  ]);

  const existingIds = new Set(cartProductIds.map(Number));
  const products = categoryResponses.flatMap((response) => normalizeProducts(response.data));
  products.push(...normalizeProducts(fallbackResponse.data));

  return [...new Map(products.map((product) => [Number(product.id), product])).values()]
    .filter((product) => !existingIds.has(Number(product.id)))
    .filter((product) => product.status === "ACTIVE" && Number(product.stockQuantity ?? 0) > 0)
    .sort((first, second) => {
      const firstRelevant = categoryIds.includes(first.categoryId) ? 1 : 0;
      const secondRelevant = categoryIds.includes(second.categoryId) ? 1 : 0;
      if (firstRelevant !== secondRelevant) return secondRelevant - firstRelevant;
      if (Boolean(first.promotionActive) !== Boolean(second.promotionActive)) return Number(second.promotionActive) - Number(first.promotionActive);
      return Number(second.averageRating ?? 0) - Number(first.averageRating ?? 0);
    })
    .slice(0, 4);
}

function CartRecommendationCard({ product }) {
  const { addToCart, isCartActionPending } = useCart();
  const displayPrice = product.effectivePrice ?? product.promotionalPrice ?? product.price;
  const originalPrice = product.originalPrice ?? product.price;
  const hasPromotion = Boolean(product.promotionActive) && Number(originalPrice) > Number(displayPrice);
  const pending = isCartActionPending(`add:${product.id}`);

  return (
    <article className="cart-recommendation-card">
      <Link className="cart-recommendation-media" to={`/products/${product.id}`} aria-label={`Voir ${product.name}`}>
        {product.imageUrl ? <img src={product.imageUrl} alt={product.name} loading="lazy" /> : <span>{product.categoryName ?? "ShopSphere"}</span>}
        {hasPromotion ? <small>{product.promotionBadgeLabel ?? `-${Math.round(Number(product.discountPercentage ?? 0))}%`}</small> : null}
      </Link>

      <div className="cart-recommendation-copy">
        <span>{product.categoryName ?? "Sélection ShopSphere"}</span>
        <Link to={`/products/${product.id}`}>{product.name}</Link>
        {Number(product.reviewCount ?? 0) > 0 ? (
          <div className="cart-recommendation-rating" aria-label={`${Number(product.averageRating ?? 0).toFixed(1)} sur 5, ${product.reviewCount} avis`}>
            <span aria-hidden="true">★</span> {Number(product.averageRating ?? 0).toFixed(1)} <small>({product.reviewCount})</small>
          </div>
        ) : null}
        <div className="cart-recommendation-price">
          <strong>{formatMoney(displayPrice)}</strong>
          {hasPromotion ? <del>{formatMoney(originalPrice)}</del> : null}
        </div>
      </div>

      <div className="cart-recommendation-actions">
        <Link to={`/products/${product.id}`}>Voir</Link>
        <Button loading={pending} size="sm" onClick={() => addToCart(product.id, 1)}>Ajouter</Button>
      </div>
    </article>
  );
}

export default function CartRecommendations({ cartProductIds }) {
  const normalizedIds = [...new Set(cartProductIds.map(Number).filter(Boolean))];
  const {
    data: products = [],
    isLoading,
  } = useQuery({
    queryKey: ["cart", "recommendations", normalizedIds],
    queryFn: () => loadRecommendations(normalizedIds),
    enabled: normalizedIds.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  if (!normalizedIds.length) return null;
  if (!isLoading && products.length === 0) return null;

  return (
    <section className="cart-recommendations" aria-labelledby="cart-recommendations-title">
      <div className="cart-recommendations-heading">
        <div>
          <span className="section-kicker">Sélection personnalisée</span>
          <h2 id="cart-recommendations-title">Vous aimerez aussi</h2>
          <p>Des produits disponibles choisis à partir des catégories de votre panier.</p>
        </div>
        <Link to="/products">Voir toute la boutique <span aria-hidden="true">→</span></Link>
      </div>

      <div className="cart-recommendations-grid">
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => (
              <article className="cart-recommendation-card is-loading" key={index}>
                <Skeleton className="cart-recommendation-skeleton-media" />
                <Skeleton height="18px" width="72%" />
                <Skeleton height="40px" width="100%" />
              </article>
            ))
          : products.map((product) => <CartRecommendationCard product={product} key={product.id} />)}
      </div>
    </section>
  );
}
