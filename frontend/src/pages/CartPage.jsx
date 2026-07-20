import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AsyncState, Button } from "../components/ui";
import { useCart } from "../hooks/useCart";

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
        <div className="cart-grid">
          <div className="cart-items-panel">
            {cart.items.map((item) => {
              const updating = isCartActionPending(`update:${item.id}`);
              const removing = isCartActionPending(`remove:${item.id}`);
              return (
                <article className="cart-item-card reveal-card" key={item.id} aria-busy={updating || removing}>
                  {item.imageUrl ? (
                    <img className="cart-item-image" src={item.imageUrl} alt={item.productName} />
                  ) : (
                    <div className="cart-item-image cart-item-placeholder">Sans image</div>
                  )}

                  <div className="cart-item-info">
                    <h2>{item.productName}</h2>
                    <span>{Number(item.unitPrice).toFixed(2)} DH</span>
                    <small>Stock disponible : {item.availableStock}</small>
                  </div>

                  <div className="quantity-stepper cart-stepper">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item, item.quantity - 1)}
                      disabled={updating || removing || item.quantity <= 1}
                    >
                      -
                    </button>
                    <strong>{item.quantity}</strong>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item, item.quantity + 1)}
                      disabled={updating || removing || item.quantity >= item.availableStock}
                    >
                      +
                    </button>
                  </div>

                  <strong className="cart-item-subtotal">{Number(item.subtotal).toFixed(2)} DH</strong>
                  <Button
                    className="cart-remove-button"
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

          <aside className="cart-summary admin-panel">
            <span className="section-kicker">Résumé</span>
            <h2>Total du panier</h2>
            <div className="checkout-total"><span>Articles</span><strong>{cart.totalItems}</strong></div>
            <div className="checkout-total"><span>Montant total</span><strong>{Number(cart.totalAmount).toFixed(2)} DH</strong></div>
            <Link className="button button-primary" to="/checkout">Passer la commande</Link>
            <Button
              loading={isCartActionPending("clear")}
              variant="outline"
              onClick={handleClearCart}
            >
              Vider le panier
            </Button>
          </aside>
        </div>
      </AsyncState>
    </section>
  );
}
