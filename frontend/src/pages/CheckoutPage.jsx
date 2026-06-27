import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import http from "../api/http";

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [cart, setCart] = useState({ items: [], totalAmount: 0, totalItems: 0 });
  const [shippingAddress, setShippingAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadCart() {
      try {
        const response = await http.get("/cart");
        if (mounted) {
          setCart(response.data);
        }
      } catch (exception) {
        if (mounted) {
          setError(exception.response?.data?.message ?? "Unable to load cart.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadCart();
    return () => {
      mounted = false;
    };
  }, []);

  async function confirmOrder(event) {
    event.preventDefault();
    setError("");

    try {
      await http.post("/orders", { shippingAddress });
      navigate("/orders", { replace: true });
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Unable to create order.");
    }
  }

  return (
    <section className="page checkout-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">Secure checkout</span>
          <h1>Confirm your order</h1>
          <p>Review your cart, add a shipping address and submit the order.</p>
        </div>
      </div>

      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="checkout-grid">
        <div className="admin-panel">
          <h2>Cart summary</h2>
          {loading ? (
            <p>Loading cart...</p>
          ) : cart.items.length === 0 ? (
            <p>Your cart is empty. <Link className="table-link" to="/products">Go shopping</Link></p>
          ) : (
            <div className="checkout-items">
              {cart.items.map((item) => (
                <div className="checkout-item" key={item.id}>
                  <div>
                    <strong>{item.productName}</strong>
                    <span>{item.quantity} x {Number(item.unitPrice).toFixed(2)} DH</span>
                  </div>
                  <strong>{Number(item.subtotal).toFixed(2)} DH</strong>
                </div>
              ))}
            </div>
          )}
          <div className="checkout-total">
            <span>Total items: {cart.totalItems}</span>
            <strong>{Number(cart.totalAmount).toFixed(2)} DH</strong>
          </div>
        </div>

        <form className="admin-panel admin-form" onSubmit={confirmOrder}>
          <h2>Shipping address</h2>
          <textarea
            value={shippingAddress}
            onChange={(event) => setShippingAddress(event.target.value)}
            placeholder="Street, city, postal code, phone notes..."
            required
          />
          <button className="button button-primary" type="submit" disabled={cart.items.length === 0}>
            Confirm order
          </button>
        </form>
      </div>
    </section>
  );
}
