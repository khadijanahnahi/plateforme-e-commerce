import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AsyncState, Button, EmptyState, Skeleton } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
import { getAutomaticVariant, requiresSizeSelection } from "../utils/productVariants";

function formatPrice(value) {
  return `${Number(value ?? 0).toFixed(2)} DH`;
}

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return `${"\u2605".repeat(safeRating)}${"\u2606".repeat(5 - safeRating)}`;
}

function HeartIcon({ filled = false }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} aria-hidden="true">
      <path d="M12 20.4 4.2 13A5.2 5.2 0 0 1 11.5 5.6l.5.55.5-.55A5.2 5.2 0 0 1 19.8 13L12 20.4Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 4h2.2l1.45 9.1a2 2 0 0 0 1.98 1.68h8.84a2 2 0 0 0 1.94-1.52L21 7H5.68" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="19" r="1.25" fill="currentColor" />
      <circle cx="18" cy="19" r="1.25" fill="currentColor" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 7h14M9 7V4.8h6V7m-8 0 .7 12h8.6L17 7M10 10.5v5M14 10.5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5.5" y="10" width="13" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function WishlistSkeleton() {
  return (
    <div className="wishlist-layout wishlist-loading" aria-label="Chargement de la wishlist" role="status">
      <div className="wishlist-list">
        {Array.from({ length: 3 }, (_, index) => (
          <div className="wishlist-item" key={index}>
            <Skeleton className="wishlist-skeleton-image" />
            <div className="wishlist-skeleton-copy">
              <Skeleton height="12px" width="24%" />
              <Skeleton height="28px" width="58%" />
              <Skeleton height="16px" width="82%" />
              <Skeleton height="22px" width="34%" />
              <Skeleton height="42px" width="52%" radius={999} />
            </div>
          </div>
        ))}
      </div>
      <Skeleton className="wishlist-summary-skeleton" />
    </div>
  );
}

export default function WishlistPage() {
  const navigate = useNavigate();
  const { authLoading, isAuthenticated } = useAuth();
  const { addToCart, isCartActionPending } = useCart();
  const [bulkPending, setBulkPending] = useState(false);
  const bulkActionRef = useRef(false);
  const {
    error,
    items,
    isWishlistActionPending,
    loadWishlist,
    loading,
    removeFromWishlist,
  } = useWishlist();

  const availableItems = items.filter((item) => item.status === "ACTIVE" && Number(item.stockQuantity) > 0);
  const directlyAddableItems = availableItems.filter((item) => !requiresSizeSelection(item));
  const wishlistValue = items.reduce(
    (total, item) => total + Number(item.effectivePrice ?? item.promotionalPrice ?? item.price ?? 0),
    0,
  );

  async function handleAddToCart(item) {
    if (requiresSizeSelection(item)) {
      navigate(`/products/${item.productId}`);
      return;
    }

    try {
      await addToCart(item.productId, 1, getAutomaticVariant(item)?.id ?? null);
    } catch { /* Le contexte affiche l'erreur. */ }
  }

  async function handleRemove(productId) {
    try {
      await removeFromWishlist(productId);
    } catch { /* Le contexte affiche l'erreur. */ }
  }

  async function handleAddAllToCart() {
    if (bulkActionRef.current || directlyAddableItems.length === 0) return;

    bulkActionRef.current = true;
    setBulkPending(true);
    try {
      await Promise.allSettled(directlyAddableItems.map((item) => (
        addToCart(item.productId, 1, getAutomaticVariant(item)?.id ?? null)
      )));
    } finally {
      bulkActionRef.current = false;
      setBulkPending(false);
    }
  }

  if (authLoading) {
    return (
      <section className="page wishlist-page">
        <WishlistSkeleton />
      </section>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="page wishlist-page">
        <EmptyState
          title="Connectez-vous pour voir votre wishlist"
          description="Votre liste de souhaits est liée à votre compte ShopSphere."
          action={<Link className="button button-primary" to="/login">Connexion</Link>}
          icon={<HeartIcon />}
        />
      </section>
    );
  }

  return (
    <section className="page wishlist-page">
      <header className="wishlist-header">
        <div>
          <span className="section-kicker">Sélection personnelle</span>
          <h1>Ma wishlist<span aria-hidden="true">✦</span></h1>
          <p>Retrouvez vos articles favoris et composez votre prochaine sélection.</p>
        </div>
        <div className="wishlist-count-pill">
          <HeartIcon />
          <strong>{items.length}</strong>
          <span>article{items.length > 1 ? "s" : ""} enregistré{items.length > 1 ? "s" : ""}</span>
        </div>
      </header>

      <AsyncState
        empty={items.length === 0}
        emptyAction={<Link className="button button-primary" to="/products">Découvrir les produits</Link>}
        emptyDescription="Sauvegardez vos favoris depuis le catalogue pour les retrouver ici."
        emptyTitle="Votre wishlist est vide"
        error={error}
        loading={loading}
        onRetry={loadWishlist}
        skeleton={<WishlistSkeleton />}
      >
        <div className="wishlist-layout">
          <div className="wishlist-list">
            {items.map((item, index) => {
              const displayPrice = item.effectivePrice ?? item.promotionalPrice ?? item.price;
              const hasPromotion = item.promotionActive && Number(item.originalPrice) > Number(displayPrice);
              const stock = Number(item.stockQuantity ?? 0);
              const canAddToCart = item.status === "ACTIVE" && stock > 0;
              const stockLabel = !canAddToCart
                ? "Rupture de stock"
                : stock <= 5 ? `Stock limité : ${stock}` : "En stock";

              return (
                <article
                  className="wishlist-item"
                  key={item.id}
                  style={{ "--wishlist-delay": `${index * 70}ms` }}
                >
                  <Link className="wishlist-item-image" to={`/products/${item.productId}`} aria-label={`Voir ${item.productName}`}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} loading="lazy" decoding="async" />
                    ) : (
                      <span>{item.categoryName ?? "ShopSphere"}</span>
                    )}
                  </Link>

                  <div className="wishlist-item-content">
                    <div className="wishlist-item-heading">
                      <div>
                        <span className="wishlist-item-category">{item.categoryName ?? "Collection"}</span>
                        <Link to={`/products/${item.productId}`}>{item.productName}</Link>
                      </div>
                      <span className="wishlist-saved-heart" title="Article sauvegardé">
                        <HeartIcon filled />
                      </span>
                    </div>

                    {item.description ? <p className="wishlist-item-description">{item.description}</p> : null}

                    <div className="wishlist-item-commerce">
                      <div className="wishlist-item-price">
                        <strong>{formatPrice(displayPrice)}</strong>
                        {hasPromotion ? <del>{formatPrice(item.originalPrice)}</del> : null}
                      </div>
                      <span className={`wishlist-stock ${!canAddToCart ? "is-out" : stock <= 5 ? "is-low" : ""}`}>
                        <i aria-hidden="true" />
                        {stockLabel}
                      </span>
                    </div>

                    <div className="wishlist-rating">
                      <span aria-label={`${Number(item.averageRating ?? 0).toFixed(1)} sur 5`}>
                        {renderStars(item.averageRating)}
                      </span>
                      <small>{item.reviewCount ? `${item.reviewCount} avis` : "Aucun avis"}</small>
                    </div>

                    <div className="wishlist-actions">
                      <Link className="button button-secondary" to={`/products/${item.productId}`}>Voir le produit</Link>
                      <Button
                        disabled={!canAddToCart}
                        iconLeft={<CartIcon />}
                        loading={isCartActionPending(
                          getAutomaticVariant(item)
                            ? `add:${item.productId}:${getAutomaticVariant(item).id}`
                            : `add:${item.productId}`
                        )}
                        onClick={() => handleAddToCart(item)}
                      >
                        {canAddToCart
                          ? requiresSizeSelection(item) ? "Choisir une taille" : "Ajouter au panier"
                          : "Indisponible"}
                      </Button>
                      <Button
                        aria-label={`Retirer ${item.productName} de la wishlist`}
                        className="wishlist-remove-button"
                        iconLeft={<TrashIcon />}
                        loading={isWishlistActionPending(item.productId)}
                        variant="outline"
                        onClick={() => handleRemove(item.productId)}
                      >
                        Retirer
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="wishlist-summary">
            <div className="wishlist-summary-title">
              <span aria-hidden="true">✦</span>
              <div>
                <small>Votre sélection</small>
                <h2>Ma wishlist</h2>
              </div>
            </div>

            <dl className="wishlist-summary-stats">
              <div>
                <dt>Articles enregistrés</dt>
                <dd>{items.length}</dd>
              </div>
              <div>
                <dt>Disponibles</dt>
                <dd>{availableItems.length}</dd>
              </div>
              <div className="is-total">
                <dt>Valeur totale</dt>
                <dd>{formatPrice(wishlistValue)}</dd>
              </div>
            </dl>

            <Button
              disabled={directlyAddableItems.length === 0 || directlyAddableItems.length !== availableItems.length}
              fullWidth
              iconLeft={<CartIcon />}
              loading={bulkPending}
              onClick={handleAddAllToCart}
            >
              {directlyAddableItems.length !== availableItems.length
                ? "Choisissez les tailles"
                : "Tout ajouter au panier"}
            </Button>

            <Link className="wishlist-continue-link" to="/products">
              Continuer mes achats <span aria-hidden="true">→</span>
            </Link>

            <div className="wishlist-private-note">
              <span><LockIcon /></span>
              <div>
                <strong>Vos envies restent privées</strong>
                <p>Cette sélection est uniquement accessible depuis votre compte.</p>
              </div>
            </div>
          </aside>
        </div>
      </AsyncState>
    </section>
  );
}
