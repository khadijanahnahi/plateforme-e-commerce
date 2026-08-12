import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { productApi } from "../api/productApi";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
import { Button, ErrorState, Skeleton } from "../components/ui";
import useAsyncAction from "../hooks/useAsyncAction";
import { useToast } from "../hooks/useToast";

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
        const [productResponse, reviewsResponse] = await Promise.all([
          productApi.getProduct(id),
          productApi.getProductReviews(id),
        ]);

        if (mounted) {
          const loadedProduct = productResponse.data;
          const variants = (loadedProduct.variants ?? []).filter((variant) => variant.active !== false);
          const automaticVariant = variants.length === 1 ? variants[0] : null;
          setProduct(loadedProduct);
          setReviews(reviewsResponse.data);
          setSelectedVariantId(automaticVariant?.id ?? null);
          setQuantity(automaticVariant
            ? (Number(automaticVariant.stockQuantity) > 0 ? 1 : 0)
            : (variants.length === 0 && Number(loadedProduct.stockQuantity) > 0 ? 1 : 0));
        }
      } catch (exception) {
        if (mounted) {
          setError(exception.response?.data?.message ?? "Unable to load product.");
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
          setEligibility({ eligible: false, reason: "Login required or review not available." });
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
      <Link className="details-back-link" to="/products">Back to products</Link>

      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="details-shell">
        <div className="details-gallery reveal-card">
          {product.imageUrl ? (
            <img className="details-image" src={product.imageUrl} alt={product.name} />
          ) : (
            <div className="details-image details-placeholder">
              <span>{product.categoryName}</span>
            </div>
          )}
        </div>

        <article className="details-info reveal-card" style={{ "--delay": "0.12s" }}>
          <span className="section-kicker">{product.categoryName}</span>
          <span className="details-audience">{product.audience === "HOMME" ? "Homme" : product.audience === "FEMME" ? "Femme" : "Unisexe"}</span>
          <h1>{product.name}</h1>

          <div className="details-rating">
            <strong>{renderStars(product.averageRating)}</strong>
            <span>({Number(product.averageRating ?? 0).toFixed(1)})</span>
            <span>{product.reviewCount ?? 0} Reviews</span>
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

          <p className="details-description">
            {product.description ?? "Premium ShopSphere product with a clean monochrome aesthetic."}
          </p>

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
            <span>Quantite</span>
            <div className="quantity-stepper">
              <button type="button" onClick={decreaseQuantity} disabled={!canBuy || quantity <= 1}>-</button>
              <strong>{quantity}</strong>
              <button type="button" onClick={increaseQuantity} disabled={!canBuy || quantity >= availableStock}>+</button>
            </div>
          </div>

          <div className="delivery-card">
            <strong>Livraison</strong>
            <p>Livraison sous 2 a 5 jours ouvrables.</p>
            <span>Paiement : Cash on Delivery</span>
          </div>

          <div className="details-actions">
            <Button
              className={`wishlist-detail-button ${isWishlisted(product.id) ? "is-active" : ""}`}
              loading={isWishlistActionPending(product.id)}
              variant="outline"
              onClick={handleToggleWishlist}
            >
              {isWishlisted(product.id) ? "\u2665 Saved" : "\u2661 Save"}
            </Button>
            <Button loading={isCartActionPending(`add:${product.id}:${selectedVariant?.id ?? "default"}`)} onClick={() => addToCart()} disabled={!canBuy}>
              Ajouter au panier
            </Button>
            <Button onClick={buyNow} disabled={!canBuy}>
              Acheter maintenant
            </Button>
          </div>
        </article>
      </div>

      <section className="reviews-section reveal-card" ref={reviewsSectionRef}>
        <div className="reviews-heading">
          <div>
            <span className="section-kicker">Verified feedback</span>
            <h2>Customer Reviews</h2>
          </div>
          <div className="reviews-score">
            <strong>{Number(product.averageRating ?? 0).toFixed(1)}</strong>
            <span>{product.reviewCount ?? 0} approved reviews</span>
          </div>
        </div>

        {reviewMessage ? <div className="admin-alert admin-success">{reviewMessage}</div> : null}
        {reviewError ? <div className="admin-alert">{reviewError}</div> : null}

        <div className="reviews-grid">
          <div className="reviews-list">
            {reviews.length === 0 ? (
              <p className="review-empty">No approved reviews yet.</p>
            ) : reviews.map((review) => (
              <article className="review-card" key={review.id}>
                <div>
                  <strong>{review.customerName}</strong>
                  <span>{renderStars(review.rating)}</span>
                </div>
                <p>{review.comment}</p>
                {review.verifiedPurchase ? <small>Verified Purchase</small> : null}
              </article>
            ))}
          </div>

          <aside className="review-form-card">
            <h3>Write a Review</h3>
            {!isAuthenticated ? (
              <p>
                <Link className="table-link" to="/login">Login</Link> to review products you purchased.
              </p>
            ) : eligibility?.eligible ? (
              <form onSubmit={submitReview}>
                <label>
                  Rating
                  <select name="rating" value={reviewForm.rating} onChange={handleReviewChange}>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>{rating} stars</option>
                    ))}
                  </select>
                </label>
                <label>
                  Comment
                  <textarea
                    name="comment"
                    minLength="5"
                    value={reviewForm.comment}
                    onChange={handleReviewChange}
                    placeholder="Share your experience with this product..."
                    required
                  />
                </label>
                <Button loading={reviewAction.loading} type="submit">Envoyer l'avis</Button>
              </form>
            ) : (
              <p>{eligibility?.reason ?? "Review available after delivered purchase."}</p>
            )}
          </aside>
        </div>
      </section>
    </section>
  );
}
