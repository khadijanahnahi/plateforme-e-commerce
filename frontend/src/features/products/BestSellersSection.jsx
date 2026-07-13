import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { productApi } from "../../api/productApi";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../hooks/useCart";
import useInView from "../../hooks/useInView";
import { Button, EmptyState, ErrorState, Skeleton } from "../../components/ui";

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  return data?.content ?? data?.items ?? [];
}

function formatMoney(value) {
  return `${Number(value ?? 0).toFixed(2)} DH`;
}

function Stars({ rating = 0 }) {
  const rounded = Math.round(Number(rating));
  return (
    <span className="best-seller-stars" aria-label={`${Number(rating).toFixed(1)} sur 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span className={index < rounded ? "is-filled" : ""} key={index} aria-hidden="true">★</span>
      ))}
    </span>
  );
}

export default function BestSellersSection() {
  const reveal = useInView();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart, isCartActionPending } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const response = await productApi.getBestSellers(8);
      setProducts(normalizeList(response.data));
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Impossible de charger les meilleures ventes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleAdd(product) {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    await addToCart(product.productId, 1).catch(() => undefined);
  }

  return (
    <section ref={reveal.ref} className={`page section-block best-sellers-section ${reveal.isVisible ? "is-visible" : ""}`}>
      <div className="section-heading best-sellers-heading">
        <div>
          <span className="section-kicker">Best-sellers</span>
          <h2>Les favoris de nos clients</h2>
        </div>
        <p>Découvrez les produits les plus commandés sur ShopSphere.</p>
      </div>

      {loading ? (
        <div className="best-sellers-grid" aria-label="Chargement des meilleures ventes">
          {Array.from({ length: 4 }, (_, index) => (
            <article className="best-seller-card" key={index}>
              <Skeleton className="best-seller-skeleton-image" />
              <Skeleton height="14px" width="38%" />
              <Skeleton height="25px" width="78%" />
              <Skeleton height="18px" width="54%" />
            </article>
          ))}
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={loadProducts} />
      ) : products.length === 0 ? (
        <EmptyState
          title="Aucun produit disponible"
          description="La sélection apparaîtra dès que des produits seront disponibles."
          action={<Link className="button button-primary" to="/products">Voir les produits</Link>}
        />
      ) : (
        <div className="best-sellers-grid">
          {products.map((product, index) => {
            const outOfStock = Number(product.stockQuantity ?? 0) <= 0;
            const hasPromotion = product.promotionActive && Number(product.originalPrice) > Number(product.effectivePrice);
            const pending = isCartActionPending(`add:${product.productId}`);

            return (
              <article
                className="best-seller-card home-reveal-card"
                key={product.productId}
                style={{ "--reveal-delay": `${index * 70}ms` }}
              >
                <Link className="best-seller-image" to={`/products/${product.productId}`}>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} loading="lazy" />
                  ) : (
                    <span className="best-seller-image-fallback">ShopSphere</span>
                  )}
                  {hasPromotion && product.discountPercentage != null ? (
                    <span className="best-seller-discount">-{Math.round(Number(product.discountPercentage))}%</span>
                  ) : null}
                </Link>

                <div className="best-seller-content">
                  <div className="best-seller-meta">
                    <span>{product.categoryName ?? "Collection"}</span>
                    <span>{product.quantitySold != null ? `${product.quantitySold} vendu${product.quantitySold > 1 ? "s" : ""}` : "Nouveauté"}</span>
                  </div>
                  <Link className="best-seller-title" to={`/products/${product.productId}`}>{product.name}</Link>
                  {product.description ? <p>{product.description}</p> : null}

                  <div className="best-seller-rating">
                    <Stars rating={product.averageRating} />
                    <span>{product.reviewCount > 0 ? `${Number(product.averageRating).toFixed(1)} (${product.reviewCount})` : "Aucun avis"}</span>
                  </div>

                  <div className="best-seller-price-row">
                    <strong>{formatMoney(product.effectivePrice)}</strong>
                    {hasPromotion ? <del>{formatMoney(product.originalPrice)}</del> : null}
                  </div>
                  <span className={`best-seller-stock ${outOfStock ? "is-out" : ""}`}>
                    {outOfStock ? "Rupture de stock" : `En stock : ${product.stockQuantity}`}
                  </span>

                  <div className="best-seller-actions">
                    <Link className="button button-secondary" to={`/products/${product.productId}`}>Voir le produit</Link>
                    <Button
                      className="best-seller-cart-button"
                      disabled={outOfStock}
                      loading={pending}
                      onClick={() => handleAdd(product)}
                    >
                      {outOfStock ? "Indisponible" : "Ajouter au panier"}
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
