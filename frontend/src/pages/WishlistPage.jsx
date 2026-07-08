import { Link } from "react-router-dom";
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
  const { addToCart } = useCart();
  const { items, loading, removeFromWishlist } = useWishlist();

  async function handleAddToCart(item) {
    await addToCart(item.productId, 1);
  }

  if (!isAuthenticated) {
    return (
      <section className="page wishlist-page">
        <div className="wishlist-empty admin-panel">
          <span className="section-kicker">Wishlist</span>
          <h1>Connectez-vous pour voir votre wishlist</h1>
          <p>Votre liste de souhaits est liee a votre compte ShopSphere.</p>
          <Link className="button button-primary" to="/login">Connexion</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="page wishlist-page">
      <div className="catalog-hero">
        <div>
          <span className="section-kicker">Wishlist</span>
          <h1>Vos produits sauvegardes</h1>
          <p>Retrouvez vos pieces preferees, comparez les prix et ajoutez-les au panier quand vous etes pret.</p>
        </div>
      </div>

      {loading ? (
        <div className="admin-panel">Chargement de la wishlist...</div>
      ) : items.length === 0 ? (
        <div className="wishlist-empty admin-panel">
          <h2>Votre wishlist est vide.</h2>
          <p>Decouvrez les produits ShopSphere et sauvegardez vos favoris.</p>
          <Link className="button button-primary" to="/products">Decouvrir les produits</Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {items.map((item) => {
            const displayPrice = item.effectivePrice ?? item.price;
            const canAddToCart = item.status === "ACTIVE" && Number(item.stockQuantity) > 0;

            return (
              <article className="wishlist-card reveal-card" key={item.id}>
                <div className="wishlist-card-image">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} />
                  ) : (
                    <span>{item.categoryName}</span>
                  )}
                </div>
                <div className="wishlist-card-copy">
                  <span className="section-kicker">{item.categoryName}</span>
                  <h2>{item.productName}</h2>
                  <p>{item.description ?? "Article premium ShopSphere."}</p>
                  <div className="wishlist-meta">
                    <strong>{formatPrice(displayPrice)}</strong>
                    {item.promotionActive ? <small>{formatPrice(item.originalPrice)}</small> : null}
                    <span>{item.status === "ACTIVE" ? `Stock: ${item.stockQuantity}` : item.status}</span>
                  </div>
                  <div className="wishlist-rating">
                    <span>{renderStars(item.averageRating)}</span>
                    <small>{item.reviewCount ?? 0} avis</small>
                  </div>
                  <div className="wishlist-actions">
                    <Link className="button button-secondary" to={`/products/${item.productId}`}>Voir produit</Link>
                    <button
                      className="button button-primary"
                      type="button"
                      disabled={!canAddToCart}
                      onClick={() => handleAddToCart(item)}
                    >
                      Ajouter au panier
                    </button>
                    <button className="button button-secondary" type="button" onClick={() => removeFromWishlist(item.productId)}>
                      Supprimer
                    </button>
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
