import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../contexts/AuthContext";
import { AsyncState, Button } from "../components/ui";
import useAsyncAction from "../hooks/useAsyncAction";
import { useToast } from "../hooks/useToast";

const DIRECT_CHECKOUT_KEY = "shopsphere_direct_checkout";
const DELIVERY_FEE = 0;

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

function buildShippingAddress(form) {
  const lines = [
    form.streetAddress,
    `${form.city}${form.postalCode ? ` ${form.postalCode}` : ""}`,
    form.deliveryNotes ? `Notes: ${form.deliveryNotes}` : "",
  ];

  return lines.filter(Boolean).join(", ");
}

function getApiErrorMessage(exception, fallback) {
  const status = exception.response?.status;
  const data = exception.response?.data;
  const validationErrors = data?.validationErrors
    ? Object.values(data.validationErrors).filter(Boolean).join(" ")
    : "";
  const message = validationErrors || data?.message || exception.message || fallback;

  return status ? `${message} (HTTP ${status})` : message;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isDirectCheckout = searchParams.get("mode") === "direct";
  const [cart, setCart] = useState({ items: [], totalAmount: 0, totalItems: 0 });
  const [directCheckout, setDirectCheckout] = useState(() => isDirectCheckout ? readDirectCheckout() : null);
  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    phoneNumber: user?.phone ?? "",
    streetAddress: "",
    city: "",
    postalCode: "",
    deliveryNotes: "",
  });
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [couponValidation, setCouponValidation] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const couponAction = useAsyncAction();
  const confirmAction = useAsyncAction();
  const toast = useToast();

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
  const hasItems = checkoutSummary.items.length > 0;
  const subtotal = Number(checkoutSummary.totalAmount);
  const discount = Number(couponValidation?.discountAmount ?? 0);
  const total = Math.max(0, subtotal - discount) + DELIVERY_FEE;

  useEffect(() => {
    setForm((current) => ({
      ...current,
      fullName: current.fullName || user?.fullName || "",
      phoneNumber: current.phoneNumber || user?.phone || "",
    }));
  }, [user]);

  const loadCheckout = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    if (isDirectCheckout) {
      const direct = readDirectCheckout();
      setDirectCheckout(direct);
      if (!direct) setLoadError("Ce checkout direct a expiré. Sélectionnez de nouveau Acheter maintenant.");
      setLoading(false);
      return;
    }

    try {
      const response = await http.get("/cart");
      setCart(response.data);
    } catch (exception) {
      setLoadError(exception.response?.data?.message ?? "Impossible de charger le panier.");
    } finally {
      setLoading(false);
    }
  }, [isDirectCheckout]);

  useEffect(() => {
    loadCheckout();
  }, [loadCheckout]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function applyCoupon() {
    return couponAction.run(async () => {
      setError("");
      setCouponMessage("");
      setCouponValidation(null);

      if (!couponCode.trim()) {
        setCouponMessage("Saisissez un code promo.");
        return;
      }

      try {
        const response = directCheckout
          ? await http.post("/coupons/validate-direct", {
              code: couponCode.trim(),
              productId: directCheckout.productId,
              quantity: directCheckout.quantity,
            })
          : await http.post("/coupons/validate", { code: couponCode.trim() });
        setCouponValidation(response.data);
        setCouponCode(response.data.code);
        setCouponMessage("Code promo appliqué.");
        toast.success("Code promo appliqué.");
      } catch (exception) {
        const message = getApiErrorMessage(exception, "Code promo invalide.");
        setCouponMessage(message);
        toast.error(message);
      }
    });
  }

  async function confirmOrder(event) {
    event.preventDefault();
    return confirmAction.run(async () => {
      setError("");
      const payload = {
        ...form,
        shippingAddress: buildShippingAddress(form),
        couponCode: couponCode.trim() || null,
      };

      try {
        let createdOrder;
        if (directCheckout) {
          const response = await http.post("/orders/direct", {
            productId: directCheckout.productId,
            quantity: directCheckout.quantity,
            ...payload,
          });
          createdOrder = response.data;
          sessionStorage.removeItem(DIRECT_CHECKOUT_KEY);
        } else {
          const response = await http.post("/orders", payload);
          createdOrder = response.data;
        }
        toast.success("Commande enregistrée avec succès.");
        navigate(`/order-success/${createdOrder.id}`, { replace: true });
      } catch (exception) {
        const message = getApiErrorMessage(exception, "Impossible de créer la commande.");
        setError(message);
        toast.error(message);
      }
    });
  }

  return (
    <section className="page checkout-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">Secure checkout</span>
          <h1>Confirm your order</h1>
          <p>{directCheckout ? "Review this direct checkout item without changing your cart." : "Review your cart, confirm delivery information and submit the order."}</p>
        </div>
      </div>

      {error ? <div className="admin-alert">{error}</div> : null}

      <AsyncState
        empty={!hasItems}
        emptyAction={<Link className="button button-primary" to="/products">Découvrir les produits</Link>}
        emptyDescription="Ajoutez des produits avant de passer une commande."
        emptyTitle="Votre panier est vide"
        error={loadError}
        loading={loading}
        onRetry={loadCheckout}
      >
        <div className="checkout-grid">
          <div className="admin-panel">
            <h2>{directCheckout ? "Buy Now summary" : "Cart summary"}</h2>
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

            <div className="checkout-breakdown">
              <div>
                <span>Subtotal</span>
                <strong>{subtotal.toFixed(2)} DH</strong>
              </div>
              <div className="coupon-box">
                <input
                  value={couponCode}
                  onChange={(event) => {
                    setCouponCode(event.target.value.toUpperCase());
                    setCouponValidation(null);
                    setCouponMessage("");
                  }}
                  placeholder="Promo code"
                />
                <Button loading={couponAction.loading} variant="outline" onClick={applyCoupon}>Appliquer</Button>
              </div>
              {couponMessage ? <p className={couponValidation ? "coupon-message coupon-success" : "coupon-message"}>{couponMessage}</p> : null}
              <div>
                <span>Discount</span>
                <strong>-{discount.toFixed(2)} DH</strong>
              </div>
              <div>
                <span>Delivery fee</span>
                <strong>{DELIVERY_FEE === 0 ? "Free" : `${DELIVERY_FEE.toFixed(2)} DH`}</strong>
              </div>
              <div className="checkout-breakdown-total">
                <span>Total</span>
                <strong>{total.toFixed(2)} DH</strong>
              </div>
            </div>

            {directCheckout ? (
              <p className="admin-muted">This checkout does not modify your existing cart.</p>
            ) : null}
          </div>

          <form className="admin-panel admin-form" onSubmit={confirmOrder}>
            <h2>Delivery information</h2>
            <input aria-label="Nom complet" name="fullName" value={form.fullName} onChange={updateField} placeholder="Full name" required />
            <input aria-label="Téléphone" name="phoneNumber" value={form.phoneNumber} onChange={updateField} placeholder="Phone number" required />
            <textarea
              aria-label="Adresse"
              name="streetAddress"
              value={form.streetAddress}
              onChange={updateField}
              placeholder="Street address"
              required
            />
            <div className="admin-form-row">
              <input aria-label="Ville" name="city" value={form.city} onChange={updateField} placeholder="City" required />
              <input aria-label="Code postal" name="postalCode" value={form.postalCode} onChange={updateField} placeholder="Postal code" />
            </div>
            <textarea
              aria-label="Notes de livraison"
              name="deliveryNotes"
              value={form.deliveryNotes}
              onChange={updateField}
              placeholder="Delivery notes"
            />

            <p className="cash-message">Vous paierez en especes au moment de la livraison.</p>

            <div className="checkout-actions">
              <Link className="button button-secondary" to="/cart">Back to cart</Link>
              <Button loading={confirmAction.loading} type="submit">Confirmer la commande</Button>
            </div>
          </form>
        </div>
      </AsyncState>
    </section>
  );
}
