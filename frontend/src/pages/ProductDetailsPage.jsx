import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { productApi } from "../api/productApi";
import { publicSettingsApi } from "../api/publicSettingsApi";
import ProductCard from "../components/product/ProductCard";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
import { Button, ErrorState, Select, Skeleton } from "../components/ui";
import useAsyncAction from "../hooks/useAsyncAction";
import { useToast } from "../hooks/useToast";
import { getAddToCartKey, getAutomaticVariant, requiresSizeSelection as productRequiresSizeSelection } from "../utils/productVariants";

const DIRECT_CHECKOUT_KEY = "shopsphere_direct_checkout";

function getProductDisplayPrice(product) {
  return Number(product?.effectivePrice ?? product?.promotionalPrice ?? product?.price ?? 0);
}

function getProductOriginalPrice(product) {
  return Number(product?.originalPrice ?? product?.price ?? 0);
}

function hasActivePromotion(product) {
  const displayPrice = getProductDisplayPrice(product);
  const originalPrice = getProductOriginalPrice(product);

  return Boolean(product?.promotionActive) && originalPrice > displayPrice;
}

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return `${"★".repeat(safeRating)}${"☆".repeat(5 - safeRating)}`;
}

function translateEligibilityReason(reason) {
  if (!reason) return "L’avis sera disponible après une commande livrée et payée.";
  if (reason.includes("already reviewed")) return "Vous avez déjà publié un avis sur ce produit.";
  if (reason.includes("delivered and paid")) return "L’avis sera disponible après une commande livrée et payée.";
  if (reason.includes("Verified purchase")) return "Achat vérifié.";
  return reason;
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart: addProductToCart, isCartActionPending } = useCart();
  const { isWishlisted, isWishlistActionPending, toggleWishlist } = useWishlist();
  const toast = useToast();
  const reviewAction = useAsyncAction();
  const reviewsSectionRef = useRef(null);
  const purchaseActionsRef = useRef(null);
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [eligibility, setEligibility] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [showMobilePurchaseBar, setShowMobilePurchaseBar] = useState(false);

  const activeVariants = (product?.variants ?? []).filter((variant) => variant.active !== false);
  const selectedVariant = activeVariants.find((variant) => variant.id === selectedVariantId) ?? null;
  const requiresSizeSelection = activeVariants.some((variant) => variant.size !== "TAILLE_UNIQUE");
  const availableStock = Number(selectedVariant?.stockQuantity ?? (activeVariants.length === 0 ? product?.stockQuantity : 0) ?? 0);
  const displayedStock = Number(selectedVariant?.stockQuantity ?? product?.stockQuantity ?? 0);
  const canBuy = product?.status === "ACTIVE"
    && availableStock > 0
    && (!requiresSizeSelection || selectedVariant !== null);
  const displayPrice = getProductDisplayPrice(product);
  const originalPrice = getProductOriginalPrice(product);
  const promotionActive = hasActivePromotion(product);

  useEffect(() => {
    let mounted = true;

    async function loadProduct() {
      try {
        const [productResponse, reviewsResponse, settingsResponse] = await Promise.all([
          productApi.getProduct(id),
          productApi.getProductReviews(id),
          publicSettingsApi.getSettings().catch(() => ({ data: null })),
        ]);

        if (mounted) {
          const loadedProduct = productResponse.data;
          const variants = (loadedProduct.variants ?? []).filter((variant) => variant.active !== false);
          const automaticVariant = variants.length === 1 ? variants[0] : null;
          setProduct(loadedProduct);
          setReviews(reviewsResponse.data);
          setStoreSettings(settingsResponse.data);
          setSelectedVariantId(automaticVariant?.id ?? null);
          setQuantity(automaticVariant
            ? (Number(automaticVariant.stockQuantity) > 0 ? 1 : 0)
            : (variants.length === 0 && Number(loadedProduct.stockQuantity) > 0 ? 1 : 0));

          if (loadedProduct.categoryId) {
            const relatedResponse = await productApi.getProducts({
              categoryId: loadedProduct.categoryId,
              page: 0,
              size: 6,
            }).catch(() => ({ data: { content: [] } }));
            if (mounted) {
              const candidates = Array.isArray(relatedResponse.data)
                ? relatedResponse.data
                : relatedResponse.data?.content ?? [];
              setRelatedProducts(candidates.filter((item) => String(item.id) !== String(loadedProduct.id)).slice(0, 4));
            }
          } else {
            setRelatedProducts([]);
          }
        }
      } catch (exception) {
        if (mounted) {
          setError(exception.response?.data?.message ?? "Impossible de charger ce produit.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadProduct();
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;

    async function loadEligibility() {
      if (!isAuthenticated || !product?.id) {
        setEligibility(null);
        return;
      }

      try {
        const response = await productApi.getReviewEligibility(product.id);
        if (mounted) {
          setEligibility(response.data);
        }
      } catch {
        if (mounted) {
          setEligibility({ eligible: false, reason: "L’avis n’est pas disponible pour le moment." });
        }
      }
    }

    loadEligibility();
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, product?.id]);

  useEffect(() => {
    const shouldFocusReviews = new URLSearchParams(location.search).get("review") === "1";
    if (shouldFocusReviews && reviewsSectionRef.current && !loading) {
      reviewsSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, location.search]);

  useEffect(() => {
    if (!isImageZoomOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setIsImageZoomOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isImageZoomOpen]);

  useEffect(() => {
    let animationFrame = 0;

    function updateMobilePurchaseBar() {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        const actions = purchaseActionsRef.current;
        if (!actions || window.innerWidth > 680) {
          setShowMobilePurchaseBar(false);
          return;
        }

        const actionsRect = actions.getBoundingClientRect();
        setShowMobilePurchaseBar(actionsRect.bottom <= 96);
      });
    }

    updateMobilePurchaseBar();
    window.addEventListener("scroll", updateMobilePurchaseBar, { passive: true });
    window.addEventListener("resize", updateMobilePurchaseBar);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("scroll", updateMobilePurchaseBar);
      window.removeEventListener("resize", updateMobilePurchaseBar);
    };
  }, [product?.id]);

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1));
  }

  function increaseQuantity() {
    setQuantity((current) => Math.min(availableStock, current + 1));
  }

  function selectVariant(variant) {
    setSelectedVariantId(variant.id);
    setQuantity(Number(variant.stockQuantity) > 0 ? 1 : 0);
    setError("");
  }

  async function addToCart() {
    setError("");

    if (!canBuy) {
      setError(requiresSizeSelection && !selectedVariant ? "Sélectionnez une taille disponible." : "Ce produit n'est pas disponible.");
      return;
    }

    try {
      await addProductToCart(product.id, quantity, selectedVariant?.id ?? null);
    } catch { /* Le contexte affiche l'erreur. */ }
  }

  function handleMobilePurchase() {
    if (requiresSizeSelection && !selectedVariant) {
      document.querySelector(".product-size-selector")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    addToCart();
  }

  async function handleToggleWishlist() {
    setError("");

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      await toggleWishlist(product.id);
    } catch { /* Le contexte affiche l'erreur. */ }
  }

  function buyNow() {
    setError("");

    if (!canBuy) {
      setError(requiresSizeSelection && !selectedVariant ? "Sélectionnez une taille disponible." : "Ce produit n'est pas disponible.");
      return;
    }

    sessionStorage.setItem(DIRECT_CHECKOUT_KEY, JSON.stringify({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      size: selectedVariant?.size ?? null,
      variantSku: selectedVariant?.sku ?? null,
      productName: product.name,
      imageUrl: product.imageUrl,
      unitPrice: displayPrice,
      quantity,
      subtotal: displayPrice * quantity,
      availableStock,
    }));
    navigate("/checkout?mode=direct");
  }

  async function addRelatedToCart(relatedProduct) {
    if (productRequiresSizeSelection(relatedProduct)) {
      navigate(`/products/${relatedProduct.id}`);
      return;
    }
    try {
      await addProductToCart(relatedProduct.id, 1, getAutomaticVariant(relatedProduct)?.id ?? null);
    } catch { /* Le contexte affiche l’erreur. */ }
  }

  function buyRelatedNow(relatedProduct) {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (productRequiresSizeSelection(relatedProduct)) {
      navigate(`/products/${relatedProduct.id}`);
      return;
    }
    const stock = Number(relatedProduct.stockQuantity ?? 0);
    if (relatedProduct.status !== "ACTIVE" || stock <= 0) return;
    const relatedVariant = getAutomaticVariant(relatedProduct);
    const relatedPrice = getProductDisplayPrice(relatedProduct);
    sessionStorage.setItem(DIRECT_CHECKOUT_KEY, JSON.stringify({
      productId: relatedProduct.id,
      variantId: relatedVariant?.id ?? null,
      size: relatedVariant?.size ?? null,
      variantSku: relatedVariant?.sku ?? null,
      productName: relatedProduct.name,
      imageUrl: relatedProduct.imageUrl,
      unitPrice: relatedPrice,
      quantity: 1,
      subtotal: relatedPrice,
      availableStock: stock,
    }));
    navigate("/checkout?mode=direct");
  }

  async function toggleRelatedWishlist(relatedProduct) {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    try {
      await toggleWishlist(relatedProduct.id);
    } catch { /* Le contexte affiche l’erreur. */ }
  }

  function handleReviewChange(event) {
    const { name, value } = event.target;
    setReviewForm((current) => ({ ...current, [name]: value }));
  }

  async function submitReview(event) {
    event.preventDefault();
    return reviewAction.run(async () => {
      setReviewError("");
      setReviewMessage("");
      try {
        await productApi.createReview(product.id, {
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment,
        });
        setReviewForm({ rating: 5, comment: "" });
        setReviewMessage("Avis envoyé pour modération.");
        toast.success("Avis envoyé pour modération.");
        const eligibilityResponse = await productApi.getReviewEligibility(product.id);
        setEligibility(eligibilityResponse.data);
      } catch (exception) {
        const nextError = exception.response?.data?.message ?? "Impossible d'envoyer votre avis.";
        setReviewError(nextError);
        toast.error(nextError);
      }
    });
  }

  if (loading) {
    return (
      <section className="page product-details-page">
        <div className="details-shell" aria-label="Chargement du produit" role="status">
          <Skeleton height={520} radius={24} />
          <div className="admin-panel"><Skeleton height={34} width="70%" /><Skeleton height={20} width="45%" /><Skeleton height={120} /></div>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="page product-details-page">
        <ErrorState description={error || "Ce produit est introuvable."} onRetry={() => window.location.reload()} title="Produit indisponible" />
        <Link className="button button-secondary" to="/products">Retour aux produits</Link>
      </section>
    );
  }

  return (
    <section className="page product-details-page">
      <Link className="details-back-link" to="/products">← Retour aux produits</Link>

      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="details-shell">
        <div className="details-primary-column">
          <div className="details-gallery reveal-card">
            {product.imageUrl ? (
              <button className="details-image-button" type="button" onClick={() => setIsImageZoomOpen(true)} aria-label={`Agrandir l’image de ${product.name}`}>
                <img className="details-image" src={product.imageUrl} alt={product.name} />
                <span className="details-zoom-hint" aria-hidden="true">Agrandir</span>
              </button>
            ) : (
              <div className="details-image details-placeholder">
                <span>{product.categoryName}</span>
              </div>
            )}
          </div>

          <article className="product-information-card reveal-card">
            <span className="section-kicker">Le produit</span>
            <h2>Détails du produit</h2>
            {product.description ? <p>{product.description}</p> : <p>Les informations détaillées de ce produit seront bientôt disponibles.</p>}
            <dl>
              {product.categoryName ? <div><dt>Catégorie</dt><dd>{product.categoryName}</dd></div> : null}
              <div><dt>Collection</dt><dd>{product.audience === "HOMME" ? "Homme" : product.audience === "FEMME" ? "Femme" : "Unisexe"}</dd></div>
              {product.sku ? <div><dt>Référence</dt><dd>{product.sku}</dd></div> : null}
            </dl>
          </article>

          <article className="product-information-card reveal-card">
            <span className="section-kicker">Service ShopSphere</span>
            <h2>Livraison & retours</h2>
            <ul>
              <li><strong>Expédition</strong><span>{storeSettings?.estimatedDeliveryText || "Délai confirmé lors de la commande"}</span></li>
              {storeSettings?.cashOnDeliveryEnabled !== false ? <li><strong>Paiement</strong><span>Paiement à la livraison</span></li> : null}
              {storeSettings?.supportEmail ? <li><strong>Assistance</strong><a href={`mailto:${storeSettings.supportEmail}`}>{storeSettings.supportEmail}</a></li> : null}
            </ul>
            <Link className="product-policy-link" to="/return-policy">Consulter la politique de retour →</Link>
          </article>
        </div>

        <div className="details-purchase-column">
          <article className="details-info reveal-card" style={{ "--delay": "0.12s" }}>
            <span className="section-kicker">{product.categoryName}</span>
            <span className="details-audience">{product.audience === "HOMME" ? "Homme" : product.audience === "FEMME" ? "Femme" : "Unisexe"}</span>
            <h1>{product.name}</h1>

            <div className="details-rating">
              <strong aria-hidden="true">{renderStars(product.averageRating)}</strong>
              <span>{Number(product.averageRating ?? 0).toFixed(1).replace(".", ",")}</span>
              <button type="button" onClick={() => reviewsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}>
                {product.reviewCount ?? 0} avis · Voir les avis
              </button>
            </div>

          <div className="details-price-stack">
            <div className="details-price-line">
              <strong className="details-price">{displayPrice.toFixed(2)} DH</strong>
              {promotionActive ? (
                <span className="details-old-price">{originalPrice.toFixed(2)} DH</span>
              ) : null}
            </div>
            {promotionActive ? (
              <div className="details-promo-row">
                <span className="details-promo-badge">
                  {product.promotionBadgeLabel || "Promotion"}
                </span>
                {product.discountPercentage !== undefined && product.discountPercentage !== null ? (
                  <span className="details-discount-badge">
                    -{Math.round(Number(product.discountPercentage))}%
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="details-stock">
            {product.status === "OUT_OF_STOCK"
              ? "Rupture de stock"
              : requiresSizeSelection && !selectedVariant
                ? `Disponible en plusieurs tailles (${displayedStock})`
                : canBuy ? `En stock (${availableStock})` : "Indisponible"}
          </div>

          {product.description ? <p className="details-description">{product.description}</p> : null}

          {requiresSizeSelection ? (
            <fieldset className="product-size-selector">
              <legend>Choisir une taille</legend>
              <div className="product-size-options">
                {activeVariants.map((variant) => {
                  const unavailable = Number(variant.stockQuantity) <= 0;
                  return (
                    <button
                      aria-pressed={selectedVariantId === variant.id}
                      className={selectedVariantId === variant.id ? "is-selected" : ""}
                      disabled={unavailable}
                      key={variant.id}
                      onClick={() => selectVariant(variant)}
                      type="button"
                    >
                      <strong>{variant.size}</strong>
                      <small>{unavailable ? "Épuisé" : `${variant.stockQuantity} en stock`}</small>
                    </button>
                  );
                })}
              </div>
              {!selectedVariant ? <p>Sélectionnez votre taille avant d'ajouter le produit au panier.</p> : null}
            </fieldset>
          ) : null}

          <div className="quantity-card">
            <strong>Quantité</strong>
            <div className="quantity-stepper">
              <button type="button" onClick={decreaseQuantity} disabled={!canBuy || quantity <= 1}>-</button>
              <strong>{quantity}</strong>
              <button type="button" onClick={increaseQuantity} disabled={!canBuy || quantity >= availableStock}>+</button>
            </div>
          </div>

          <div className="delivery-card">
            <div><span aria-hidden="true">◇</span><p><strong>Livraison estimée</strong><small>{storeSettings?.estimatedDeliveryText || "Délai confirmé lors de la commande"}</small></p></div>
            {storeSettings?.cashOnDeliveryEnabled !== false ? <div><span aria-hidden="true">□</span><p><strong>Paiement à la livraison</strong><small>Réglez votre commande au moment de la réception.</small></p></div> : null}
            <div><span aria-hidden="true">↩</span><p><strong>Retours encadrés</strong><Link to="/return-policy">Voir les conditions de retour</Link></p></div>
          </div>

            <div className="details-actions" ref={purchaseActionsRef}>
            <Button className="details-buy-button" fullWidth onClick={buyNow} disabled={!canBuy}>
              Acheter maintenant
            </Button>
            <Button
              className="details-cart-button"
              fullWidth
              loading={isCartActionPending(selectedVariant ? `add:${product.id}:${selectedVariant.id}` : `add:${product.id}`)}
              onClick={() => addToCart()}
              disabled={!canBuy}
              variant="outline"
            >
              Ajouter au panier
            </Button>
            <Button
              className={`wishlist-detail-button ${isWishlisted(product.id) ? "is-active" : ""}`}
              loading={isWishlistActionPending(product.id)}
              variant="ghost"
              onClick={handleToggleWishlist}
            >
              {isWishlisted(product.id) ? "♥ Retirer des favoris" : "♡ Ajouter aux favoris"}
            </Button>
            </div>
          </article>

        </div>
      </div>

      <section className="reviews-section reveal-card" ref={reviewsSectionRef}>
        <div className="reviews-heading">
          <div>
            <span className="section-kicker">Avis vérifiés</span>
            <h2>Ce qu’en pensent nos clients</h2>
          </div>
          <div className="reviews-score">
            <strong>{Number(product.averageRating ?? 0).toFixed(1)}</strong>
            <span>{product.reviewCount ?? 0} avis publié{Number(product.reviewCount ?? 0) > 1 ? "s" : ""}</span>
          </div>
        </div>

        {reviewMessage ? <div className="admin-alert admin-success">{reviewMessage}</div> : null}
        {reviewError ? <div className="admin-alert">{reviewError}</div> : null}

        <div className="reviews-grid">
          <div className="reviews-list">
            {reviews.length === 0 ? (
              <p className="review-empty">Aucun avis publié pour le moment.</p>
            ) : reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div>
                  <strong>{review.customerName}</strong>
                  <span>{renderStars(review.rating)}</span>
                </div>
                <p>{review.comment}</p>
                {review.verifiedPurchase ? <small>Achat vérifié</small> : null}
              </article>
            ))}
          </div>

          <aside className="review-form-card">
            <h3>Laisser un avis</h3>
            {!isAuthenticated ? (
              <p>
                <Link className="table-link" to="/login">Connectez-vous</Link> pour évaluer un produit acheté.
              </p>
            ) : eligibility?.eligible ? (
              <form onSubmit={submitReview}>
                <div className="review-form-field">
                <Select label="Note" name="rating" value={reviewForm.rating} onChange={handleReviewChange}>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>{rating} étoile{rating > 1 ? "s" : ""}</option>
                  ))}
                </Select>
                </div>
                <label>
                  Commentaire
                  <textarea
                    name="comment"
                    minLength="5"
                    value={reviewForm.comment}
                    onChange={handleReviewChange}
                    placeholder="Partagez votre expérience avec ce produit..."
                    required
                  />
                </label>
                <Button loading={reviewAction.loading} type="submit">Envoyer l'avis</Button>
              </form>
            ) : (
              <p>{translateEligibilityReason(eligibility?.reason)}</p>
            )}
          </aside>
        </div>
      </section>

      {relatedProducts.length ? <section className="product-related-section reveal-card">
        <header>
          <div><span className="section-kicker">Sélection associée</span><h2>Vous aimerez aussi</h2></div>
          <Link to={`/products?categoryId=${product.categoryId}`}>Voir la catégorie →</Link>
        </header>
        <div className="product-related-grid">
          {relatedProducts.map((relatedProduct) => <ProductCard
            addPending={isCartActionPending(getAddToCartKey(relatedProduct))}
            isWishlisted={isWishlisted(relatedProduct.id)}
            key={relatedProduct.id}
            onAddToCart={addRelatedToCart}
            onBuyNow={buyRelatedNow}
            onToggleWishlist={toggleRelatedWishlist}
            product={relatedProduct}
            wishlistPending={isWishlistActionPending(relatedProduct.id)}
          />)}
        </div>
      </section> : null}

      {showMobilePurchaseBar && !isImageZoomOpen ? <aside className="mobile-purchase-bar" aria-label="Achat rapide">
        <div className="mobile-purchase-price">
          <small>{product.name}</small>
          <span><strong>{displayPrice.toFixed(2)} DH</strong>{promotionActive ? <del>{originalPrice.toFixed(2)} DH</del> : null}</span>
        </div>
        <Button
          className="mobile-purchase-button"
          disabled={product.status !== "ACTIVE" || displayedStock <= 0}
          loading={isCartActionPending(selectedVariant ? `add:${product.id}:${selectedVariant.id}` : `add:${product.id}`)}
          onClick={handleMobilePurchase}
        >
          {requiresSizeSelection && !selectedVariant ? "Choisir une taille" : "Ajouter au panier"}
        </Button>
      </aside> : null}

      {isImageZoomOpen && product.imageUrl ? <div className="product-image-modal" role="dialog" aria-modal="true" aria-label={`Image agrandie de ${product.name}`} onClick={() => setIsImageZoomOpen(false)}>
        <button type="button" onClick={() => setIsImageZoomOpen(false)} aria-label="Fermer l’image agrandie">×</button>
        <img src={product.imageUrl} alt={product.name} onClick={(event) => event.stopPropagation()} />
      </div> : null}
    </section>
  );
}
