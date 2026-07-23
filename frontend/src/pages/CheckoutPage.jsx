import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../contexts/AuthContext";
import { AsyncState, Button, Input, Textarea } from "../components/ui";
import useAsyncAction from "../hooks/useAsyncAction";
import { useToast } from "../hooks/useToast";

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

function CheckoutIcon({ name }) {
  const paths = {
    lock: <><rect x="6" y="10" width="12" height="10" rx="2" /><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    shield: <><path d="M12 3 5.5 6v5.5c0 4.2 2.6 7.4 6.5 9.5 3.9-2.1 6.5-5.3 6.5-9.5V6L12 3Z" /><path d="m9.2 12 1.8 1.8 3.9-4" /></>,
    cash: <><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M6 9H5v1M18 15h1v-1" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8">
      {paths[name]}
    </svg>
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isDirectCheckout = searchParams.get("mode") === "direct";
  const [cart, setCart] = useState({ items: [], totalAmount: 0, totalItems: 0 });
  const [storeSettings, setStoreSettings] = useState({ deliveryFee: 0, freeDeliveryThreshold: 0 });
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
  const [recipientMode, setRecipientMode] = useState("account");
  const couponAction = useAsyncAction();
  const confirmAction = useAsyncAction();
  const toast = useToast();

  const checkoutSummary = directCheckout
    ? {
        items: [{
          id: `direct-${directCheckout.productId}`,
          productName: directCheckout.productName,
          imageUrl: directCheckout.imageUrl,
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
  const chargeableAmount = Math.max(0, subtotal - discount);
  const configuredDeliveryFee = Math.max(0, Number(storeSettings.deliveryFee ?? 0));
  const freeDeliveryThreshold = Math.max(0, Number(storeSettings.freeDeliveryThreshold ?? 0));
  const deliveryFee = freeDeliveryThreshold > 0 && chargeableAmount >= freeDeliveryThreshold
    ? 0
    : configuredDeliveryFee;
  const total = chargeableAmount + deliveryFee;

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
    try {
      if (isDirectCheckout) {
        const direct = readDirectCheckout();
        setDirectCheckout(direct);
        if (!direct) {
          setLoadError("Ce checkout direct a expiré. Sélectionnez de nouveau Acheter maintenant.");
          return;
        }

        const settingsResponse = await http.get("/settings/public");
        setStoreSettings(settingsResponse.data);
      } else {
        const [cartResponse, settingsResponse] = await Promise.all([
          http.get("/cart"),
          http.get("/settings/public"),
        ]);
        setCart(cartResponse.data);
        setStoreSettings(settingsResponse.data);
      }
    } catch (exception) {
      setLoadError(exception.response?.data?.message ?? "Impossible de charger les informations du checkout.");
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

  function selectRecipientMode(mode) {
    setRecipientMode(mode);
    setForm((current) => ({
      ...current,
      fullName: mode === "account" ? user?.fullName || current.fullName : "",
      phoneNumber: mode === "account" ? user?.phone || current.phoneNumber : "",
    }));
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
    <section className="page checkout-page checkout-shell">
      <header className="checkout-hero">
        <div className="checkout-hero-copy">
          <span className="checkout-secure-label"><CheckoutIcon name="lock" /> Finalisation sécurisée</span>
          <h1>Finalisez votre commande</h1>
          <p>
            {directCheckout
              ? "Complétez vos informations de livraison et confirmez cet achat immédiat."
              : "Vérifiez vos articles, complétez la livraison et confirmez votre commande."}
          </p>
        </div>

        <ol className="checkout-progress" aria-label="Progression de la commande">
          <li className="is-complete"><span>1</span><strong>Panier</strong></li>
          <li className="is-current" aria-current="step"><span>2</span><strong>Livraison</strong></li>
          <li><span>3</span><strong>Confirmation</strong></li>
        </ol>
      </header>

      {error ? <div className="admin-alert checkout-alert">{error}</div> : null}

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
          <form className="checkout-panel checkout-delivery-panel" onSubmit={confirmOrder}>
            <div className="checkout-panel-heading">
              <div>
                <span className="section-kicker">Étape 02</span>
                <h2>Informations de livraison</h2>
              </div>
              <span className="checkout-required-note">* Champs obligatoires</span>
            </div>

            <div className="checkout-recipient-options" aria-label="Choix du destinataire">
              <button
                className={recipientMode === "account" ? "is-selected" : ""}
                type="button"
                aria-pressed={recipientMode === "account"}
                onClick={() => selectRecipientMode("account")}
              >
                <span className="checkout-option-marker" />
                <span className="checkout-option-icon"><CheckoutIcon name="user" /></span>
                <span><strong>Mes coordonnées</strong><small>Utiliser les informations de mon compte</small></span>
              </button>
              <button
                className={recipientMode === "other" ? "is-selected" : ""}
                type="button"
                aria-pressed={recipientMode === "other"}
                onClick={() => selectRecipientMode("other")}
              >
                <span className="checkout-option-marker" />
                <span className="checkout-option-icon"><CheckoutIcon name="plus" /></span>
                <span><strong>Autre destinataire</strong><small>Saisir de nouvelles coordonnées</small></span>
              </button>
            </div>

            <div className="checkout-form-grid">
              <Input fullWidth required label="Nom complet *" aria-label="Nom complet" name="fullName" value={form.fullName} onChange={updateField} placeholder="Nom du destinataire" />
              <Input fullWidth required label="Téléphone *" aria-label="Téléphone" name="phoneNumber" value={form.phoneNumber} onChange={updateField} placeholder="Ex. 06 12 34 56 78" inputMode="tel" />
              <Textarea className="checkout-field-wide checkout-address-field" fullWidth required label="Adresse complète *" aria-label="Adresse" name="streetAddress" value={form.streetAddress} onChange={updateField} placeholder="Rue, immeuble, numéro, quartier..." rows="2" />
              <Input fullWidth required label="Ville *" aria-label="Ville" name="city" value={form.city} onChange={updateField} placeholder="Votre ville" />
              <Input fullWidth label="Code postal" aria-label="Code postal" name="postalCode" value={form.postalCode} onChange={updateField} placeholder="Ex. 30000" inputMode="numeric" />
              <Textarea className="checkout-field-wide checkout-notes-field" fullWidth label="Instructions de livraison (facultatif)" aria-label="Notes de livraison" name="deliveryNotes" value={form.deliveryNotes} onChange={updateField} placeholder="Étage, sonnette, repère ou indication utile au livreur..." rows="2" />
            </div>

            <div className="checkout-cod-card">
              <span><CheckoutIcon name="shield" /></span>
              <div><strong>Paiement à la livraison</strong><p>Réglez votre commande en espèces au moment de sa réception. Aucun paiement en ligne n’est requis.</p></div>
            </div>

            <div className="checkout-actions">
              <Link className="button button-secondary" to="/cart"><span aria-hidden="true">←</span> Retour au panier</Link>
              <Button loading={confirmAction.loading} iconRight={<span aria-hidden="true">→</span>} type="submit">Confirmer la commande</Button>
            </div>
          </form>

          <aside className="checkout-panel checkout-order-summary">
            <div className="checkout-panel-heading checkout-summary-heading">
              <div>
                <span className="section-kicker">Résumé</span>
                <h2>Votre commande</h2>
              </div>
              <span className="checkout-item-count">{checkoutSummary.totalItems} article{checkoutSummary.totalItems > 1 ? "s" : ""}</span>
            </div>

            <div className="checkout-items">
              {checkoutSummary.items.map((item) => (
                <article className="checkout-order-item" key={item.id}>
                  <div className="checkout-order-item-media">
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.productName} /> : <span>SS</span>}
                  </div>
                  <div className="checkout-order-item-copy">
                    <strong>{item.productName}</strong>
                    <span>Quantité : {item.quantity}</span>
                    <small>{Number(item.unitPrice).toFixed(2)} DH / unité</small>
                  </div>
                  <strong className="checkout-order-item-total">{Number(item.subtotal).toFixed(2)} DH</strong>
                </article>
              ))}
            </div>

            <div className="coupon-box checkout-coupon-box">
              <input
                aria-label="Code promo"
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.target.value.toUpperCase());
                  setCouponValidation(null);
                  setCouponMessage("");
                }}
                placeholder="Code promo"
              />
              <Button loading={couponAction.loading} variant="outline" onClick={applyCoupon}>Appliquer</Button>
            </div>
            {couponMessage ? <p className={couponValidation ? "coupon-message coupon-success" : "coupon-message"}>{couponMessage}</p> : null}

            <div className="checkout-breakdown">
              <div><span>Sous-total</span><strong>{subtotal.toFixed(2)} DH</strong></div>
              <div><span>Réduction</span><strong>-{discount.toFixed(2)} DH</strong></div>
              <div><span>Livraison</span><strong className={deliveryFee === 0 ? "checkout-free-delivery" : ""}>{deliveryFee === 0 ? "Gratuite" : `${deliveryFee.toFixed(2)} DH`}</strong></div>
              <div className="checkout-breakdown-total"><span>Total</span><strong>{total.toFixed(2)} DH</strong></div>
            </div>

            <div className="checkout-trust-list">
              <div><span><CheckoutIcon name="shield" /></span><p><strong>Données protégées</strong><small>Vos informations servent uniquement au traitement de la commande.</small></p></div>
              <div><span><CheckoutIcon name="cash" /></span><p><strong>Paiement à la livraison</strong><small>Vous payez en espèces après réception.</small></p></div>
              <div><span><CheckoutIcon name="check" /></span><p><strong>Total contrôlé</strong><small>Le montant est recalculé lors de la confirmation.</small></p></div>
            </div>

            {directCheckout ? <p className="checkout-direct-note">Cet achat immédiat ne modifie pas votre panier existant.</p> : null}
            <p className="checkout-summary-footnote"><CheckoutIcon name="lock" /> Vos informations de livraison ne sont jamais affichées publiquement.</p>
          </aside>
        </div>
      </AsyncState>
    </section>
  );
}
