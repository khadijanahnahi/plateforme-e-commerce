import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import http from "../api/http";

const DIRECT_CHECKOUT_KEY = "shopsphere_direct_checkout";

function readDirectCheckout() {
  const value = sessionStorage.getItem(DIRECT_CHECKOUT_KEY);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    sessionStorage.removeItem(DIRECT_CHECKOUT_KEY);
    return null;
  }
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDirectCheckout = searchParams.get("mode") === "direct";
  const [cart, setCart] = useState({ items: [], totalAmount: 0, totalItems: 0 });
  const [directCheckout, setDirectCheckout] = useState(() => isDirectCheckout ? readDirectCheckout() : null);
  const [shippingAddress, setShippingAddress] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const checkoutSummary = directCheckout
    ? {
        items: [{
          id: `direct-${directCheckout.productId}`,
          productName: directCheckout.productName,
          quantity: directCheckout.quantity,
          unitPrice: directCheckout.unitPrice,
          subtotal: directCheckout.subtotal,
        }],
        totalAmount: directCheckout.subtotal,
        totalItems: directCheckout.quantity,
      }
    : cart;

  useEffect(() => {
    let mounted = true;

    async function loadCheckout() {
      if (isDirectCheckout) {
        const direct = readDirectCheckout();
        if (mounted) {
          setDirectCheckout(direct);
          if (!direct) {
            setError("Direct checkout expired. Please select Buy Now again.");
          }
          setLoading(false);
        }
        return;
      }

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

    loadCheckout();
    return () => {
      mounted = false;
    };
  }, [isDirectCheckout]);

  async function confirmOrder(event) {
    event.preventDefault();
    setError("");

    try {
      if (directCheckout) {
        await http.post("/orders/direct", {
          productId: directCheckout.productId,
          quantity: directCheckout.quantity,
          shippingAddress,
        });
        sessionStorage.removeItem(DIRECT_CHECKOUT_KEY);
      } else {
        await http.post("/orders", { shippingAddress });
      }
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
          <p>{directCheckout ? "Review this direct checkout item without changing your cart." : "Review your cart, add a shipping address and submit the order."}</p>
        </div>
      </div>

      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="checkout-grid">
        <div className="admin-panel">
          <h2>{directCheckout ? "Buy Now summary" : "Cart summary"}</h2>
          {loading ? (
            <p>Loading checkout...</p>
          ) : checkoutSummary.items.length === 0 ? (
            <p>Your cart is empty. <Link className="table-link" to="/products">Go shopping</Link></p>
          ) : (
            <div className="checkout-items">
              {checkoutSummary.items.map((item) => (
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
            <span>Total items: {checkoutSummary.totalItems}</span>
            <strong>{Number(checkoutSummary.totalAmount).toFixed(2)} DH</strong>
          </div>
          {directCheckout ? (
            <p className="admin-muted">This checkout does not modify your existing cart.</p>
          ) : null}
        </div>

        <form className="admin-panel admin-form" onSubmit={confirmOrder}>
          <h2>Shipping address</h2>
          <textarea
            value={shippingAddress}
            onChange={(event) => setShippingAddress(event.target.value)}
            placeholder="Street, city, postal code, phone notes..."
            required
          />
          <button className="button button-primary" type="submit" disabled={checkoutSummary.items.length === 0}>
            Confirm order
          </button>
        </form>
      </div>
    </section>
  );
}
