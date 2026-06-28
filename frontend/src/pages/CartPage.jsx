import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import http from "../api/http";

const emptyCart = {
  items: [],
  totalAmount: 0,
  totalItems: 0,
};

export default function CartPage() {
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadCart() {
    const response = await http.get("/cart");
    setCart(response.data);
  }

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const response = await http.get("/cart");
        if (mounted) {
          setCart(response.data);
        }
      } catch (exception) {
        if (mounted) {
          setError(exception.response?.data?.message ?? "Login required to view your cart.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  async function updateQuantity(item, nextQuantity) {
    if (nextQuantity < 1 || nextQuantity > item.availableStock) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const response = await http.put(`/cart/items/${item.id}`, { quantity: nextQuantity });
      setCart(response.data);
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Unable to update cart item.");
    }
  }

  async function removeItem(itemId) {
    setMessage("");
    setError("");

    try {
      const response = await http.delete(`/cart/items/${itemId}`);
      setCart(response.data);
      setMessage("Item removed.");
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Unable to remove cart item.");
    }
  }

  async function clearCart() {
    setMessage("");
    setError("");

    try {
      const response = await http.delete("/cart");
      setCart(response.data);
      setMessage("Cart cleared.");
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Unable to clear cart.");
    }
  }

  return (
    <section className="page cart-page">
      <div className="catalog-hero">
        <div>
          <span className="section-kicker">Shopping bag</span>
          <h1>Your Cart</h1>
          <p>Review your selected products, adjust quantities and continue to checkout.</p>
        </div>
      </div>

      {message ? <div className="admin-alert admin-success">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      {loading ? (
        <div className="admin-panel">Loading cart...</div>
      ) : cart.items.length === 0 ? (
        <div className="cart-empty admin-panel">
          <h2>Your cart is empty.</h2>
          <p>Add products from the catalog to start a checkout.</p>
          <Link className="button button-primary" to="/products">Go shopping</Link>
        </div>
      ) : (
        <div className="cart-grid">
          <div className="cart-items-panel">
            {cart.items.map((item) => (
              <article className="cart-item-card reveal-card" key={item.id}>
                {item.imageUrl ? (
                  <img className="cart-item-image" src={item.imageUrl} alt={item.productName} />
                ) : (
                  <div className="cart-item-image cart-item-placeholder">No image</div>
                )}

                <div className="cart-item-info">
                  <h2>{item.productName}</h2>
                  <span>{Number(item.unitPrice).toFixed(2)} DH</span>
                  <small>Available stock: {item.availableStock}</small>
                </div>

                <div className="quantity-stepper cart-stepper">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <strong>{item.quantity}</strong>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item, item.quantity + 1)}
                    disabled={item.quantity >= item.availableStock}
                  >
                    +
                  </button>
                </div>

                <strong className="cart-item-subtotal">{Number(item.subtotal).toFixed(2)} DH</strong>
                <button className="cart-remove-button" type="button" onClick={() => removeItem(item.id)}>
                  Remove
                </button>
              </article>
            ))}
          </div>

          <aside className="cart-summary admin-panel">
            <span className="section-kicker">Order summary</span>
            <h2>Cart total</h2>
            <div className="checkout-total">
              <span>Total items</span>
              <strong>{cart.totalItems}</strong>
            </div>
            <div className="checkout-total">
              <span>Total amount</span>
              <strong>{Number(cart.totalAmount).toFixed(2)} DH</strong>
            </div>
            <Link className="button button-primary" to="/checkout">Proceed to checkout</Link>
            <button className="button button-secondary" type="button" onClick={clearCart}>
              Clear cart
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}
