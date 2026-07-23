import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AsyncState, Button } from "../components/ui";
import CartRecommendations from "../features/cart/CartRecommendations";
import PublicCouponOffers from "../components/coupon/PublicCouponOffers";
import { useCart } from "../hooks/useCart";

function CartIcon({ name }) {
  const paths = {
    bag: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    cash: <><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="3" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></>,
  };

  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function CartPage() {
  const {
    cart,
    loadCart,
    updateCartItem,
    removeCartItem,
    clearCart,
    isCartActionPending,
  } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const originalSubtotal = useMemo(() => cart.items.reduce(
    (total, item) => total + Number(item.originalPrice ?? item.unitPrice ?? 0) * Number(item.quantity ?? 0),
    0,
  ), [cart.items]);
  const currentSubtotal = Number(cart.totalAmount ?? 0);
  const promotionSavings = Math.max(0, originalSubtotal - currentSubtotal);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await loadCart();
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Connectez-vous pour consulter votre panier.");
    } finally {
      setLoading(false);
    }
  }, [loadCart]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function updateQuantity(item, nextQuantity) {
    if (nextQuantity < 1 || nextQuantity > item.availableStock) return;
    try {
      await updateCartItem(item.id, nextQuantity);
    } catch { /* Le contexte affiche l'erreur. */ }
  }

  async function removeItem(itemId) {
    try {
      await removeCartItem(itemId);
    } catch { /* Le contexte affiche l'erreur. */ }
  }

  async function handleClearCart() {
    try {
      await clearCart();
    } catch { /* Le contexte affiche l'erreur. */ }
  }

  return (
    <section className="page cart-page">
      <AsyncState
        empty={cart.items.length === 0}
        emptyAction={<Link className="button button-primary" to="/products">Découvrir les produits</Link>}
        emptyDescription="Ajoutez des produits depuis le catalogue pour commencer une commande."
        emptyTitle="Votre panier est vide"
        error={error}
        loading={loading}
        onRetry={loadData}
      >
        <div className="cart-content">
          <div className="cart-page-heading">
            <div>
              <span className="section-kicker">Votre sélection</span>
              <h1>Mon panier</h1>
            </div>
            <p><strong>{cart.totalItems}</strong> article{cart.totalItems > 1 ? "s" : ""} prêt{cart.totalItems > 1 ? "s" : ""} à être commandé{cart.totalItems > 1 ? "s" : ""}.</p>
          </div>

          <PublicCouponOffers limit={2} variant="cart" />

          <div className="cart-grid">
            <div className="cart-items-panel">
              {cart.items.map((item, index) => {
              const updating = isCartActionPending(`update:${item.id}`);
              const removing = isCartActionPending(`remove:${item.id}`);
              const originalPrice = Number(item.originalPrice ?? item.unitPrice ?? 0);
              const unitPrice = Number(item.unitPrice ?? 0);
              const hasPromotion = Boolean(item.promotionActive) && originalPrice > unitPrice;
              return (
                <article className="cart-item-card" key={item.id} aria-busy={updating || removing} style={{ "--cart-item-delay": `${index * 70}ms` }}>
                  <Link className="cart-item-media" to={`/products/${item.productId}`}>
                    {item.imageUrl ? (
                      <img className="cart-item-image" src={item.imageUrl} alt={item.productName} />
                    ) : (
                      <span className="cart-item-image cart-item-placeholder">Sans image</span>
                    )}
                    {hasPromotion ? <small>{item.promotionBadgeLabel ?? "Promotion"}</small> : null}
                  </Link>

                  <div className="cart-item-info">
                    <span>Article {String(index + 1).padStart(2, "0")}</span>
                    <Link to={`/products/${item.productId}`}><h2>{item.productName}</h2></Link>
                    <div className="cart-item-unit-price">
                      <strong>{unitPrice.toFixed(2)} DH</strong>
                      {hasPromotion ? <del>{originalPrice.toFixed(2)} DH</del> : null}
                    </div>
                    <small className={item.availableStock <= 5 ? "is-low" : ""}>Stock disponible : {item.availableStock}</small>
                  </div>

                  <div className="cart-item-controls">
                    <span>Quantité</span>
                    <div className="quantity-stepper cart-stepper">
                      <button type="button" aria-label={`Réduire la quantité de ${item.productName}`} onClick={() => updateQuantity(item, item.quantity - 1)} disabled={updating || removing || item.quantity <= 1}>−</button>
                      <strong>{updating ? "…" : item.quantity}</strong>
                      <button type="button" aria-label={`Augmenter la quantité de ${item.productName}`} onClick={() => updateQuantity(item, item.quantity + 1)} disabled={updating || removing || item.quantity >= item.availableStock}>+</button>
                    </div>
                  </div>

                  <div className="cart-item-total">
                    <span>Sous-total</span>
                    <strong className="cart-item-subtotal">{Number(item.subtotal).toFixed(2)} DH</strong>
                  </div>
                  <Button
                    className="cart-remove-button"
                    aria-label={`Supprimer ${item.productName} du panier`}
                    iconLeft={<CartIcon name="trash" />}
                    loading={removing}
                    size="sm"
                    variant="ghost"
                    onClick={() => removeItem(item.id)}
                  >
                    Supprimer
                  </Button>
                </article>
              );
              })}
            </div>

            <aside className="cart-summary">
              <span className="section-kicker">Résumé</span>
              <h2>Résumé de commande</h2>

              <div className="cart-summary-lines">
                <div><span>Articles ({cart.totalItems})</span><strong>{originalSubtotal.toFixed(2)} DH</strong></div>
                <div><span>Remise produits</span><strong className={promotionSavings > 0 ? "is-discount" : ""}>{promotionSavings > 0 ? `-${promotionSavings.toFixed(2)} DH` : "0.00 DH"}</strong></div>
                <div><span>Livraison</span><strong className="is-delivery">Confirmée au checkout</strong></div>
              </div>

              <div className="cart-summary-total">
                <span>Total provisoire <small>Hors éventuels frais de livraison</small></span>
                <strong>{currentSubtotal.toFixed(2)} DH</strong>
              </div>

              <Link className="button button-primary cart-checkout-button" to="/checkout"><CartIcon name="lock" /> Passer la commande <span aria-hidden="true">→</span></Link>
              <Link className="button button-secondary cart-continue-button" to="/products">Continuer mes achats</Link>

              <div className="cart-trust-list">
                <div><CartIcon name="cash" /><p><strong>Paiement à la livraison</strong><small>Aucun paiement en ligne requis</small></p></div>
                <div><CartIcon name="check" /><p><strong>Prix contrôlés</strong><small>Le backend recalcule chaque montant</small></p></div>
                <div><CartIcon name="bag" /><p><strong>Panier modifiable</strong><small>Ajustez les quantités avant validation</small></p></div>
              </div>

              <Button className="cart-clear-button" iconLeft={<CartIcon name="trash" />} loading={isCartActionPending("clear")} variant="ghost" onClick={handleClearCart}>Vider le panier</Button>
            </aside>
          </div>

          <CartRecommendations cartProductIds={cart.items.map((item) => item.productId)} />
        </div>
      </AsyncState>
    </section>
  );
}
