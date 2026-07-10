import { Link } from "react-router-dom";
import { AsyncState, Button, EmptyState } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";

function formatPrice(value) {
  return `${Number(value ?? 0).toFixed(2)} DH`;
}

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return `${"\u2605".repeat(safeRating)}${"\u2606".repeat(5 - safeRating)}`;
}

export default function WishlistPage() {
  const { isAuthenticated } = useAuth();
  const { addToCart, isCartActionPending } = useCart();
  const {
    error,
    items,
    isWishlistActionPending,
    loadWishlist,
    loading,
    removeFromWishlist,
  } = useWishlist();

  async function handleAddToCart(item) {
    try {
      await addToCart(item.productId, 1);
    } catch { /* Le contexte affiche l'erreur. */ }
  }

  async function handleRemove(productId) {
    try {
      await removeFromWishlist(productId);
    } catch { /* Le contexte affiche l'erreur. */ }
  }

  if (!isAuthenticated) {
    return (
      <section className="page wishlist-page">
        <EmptyState
          title="Connectez-vous pour voir votre wishlist"
          description="Votre liste de souhaits est liée à votre compte ShopSphere."
          action={<Link className="button button-primary" to="/login">Connexion</Link>}
          icon={<span aria-hidden="true">♡</span>}
        />
      </section>
    );
  }

  return (
    <section className="page wishlist-page">
      <div className="catalog-hero">
        <div>
          <span className="section-kicker">Wishlist</span>
          <h1>Vos produits sauvegardés</h1>
          <p>Retrouvez vos pièces préférées et ajoutez-les au panier lorsque vous êtes prêt.</p>
        </div>
      </div>

      <AsyncState
        empty={items.length === 0}
        emptyAction={<Link className="button button-primary" to="/products">Découvrir les produits</Link>}
        emptyDescription="Sauvegardez vos favoris depuis le catalogue pour les retrouver ici."
        emptyTitle="Votre wishlist est vide"
        error={error}
        loading={loading}
        onRetry={loadWishlist}
      >
        <div className="wishlist-grid">
          {items.map((item) => {
            const displayPrice = item.effectivePrice ?? item.price;
            const canAddToCart = item.status === "ACTIVE" && Number(item.stockQuantity) > 0;
            return (
              <article className="wishlist-card reveal-card" key={item.id}>
                <div className="wishlist-card-image">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} /> : <span>{item.categoryName}</span>}
                </div>
                <div className="wishlist-card-copy">
                  <span className="section-kicker">{item.categoryName}</span>
                  <h2>{item.productName}</h2>
                  <p>{item.description ?? "Article premium ShopSphere."}</p>
                  <div className="wishlist-meta">
                    <strong>{formatPrice(displayPrice)}</strong>
                    {item.promotionActive ? <small>{formatPrice(item.originalPrice)}</small> : null}
                    <span>{item.status === "ACTIVE" ? `Stock : ${item.stockQuantity}` : item.status}</span>
                  </div>
                  <div className="wishlist-rating"><span>{renderStars(item.averageRating)}</span><small>{item.reviewCount ?? 0} avis</small></div>
                  <div className="wishlist-actions">
                    <Link className="button button-secondary" to={`/products/${item.productId}`}>Voir le produit</Link>
                    <Button
                      disabled={!canAddToCart}
                      loading={isCartActionPending(`add:${item.productId}`)}
                      onClick={() => handleAddToCart(item)}
                    >
                      Ajouter au panier
                    </Button>
                    <Button
                      loading={isWishlistActionPending(item.productId)}
                      variant="outline"
                      onClick={() => handleRemove(item.productId)}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </AsyncState>
    </section>
  );
}
