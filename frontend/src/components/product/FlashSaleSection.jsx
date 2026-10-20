import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { promotionApi } from "../../api/promotionApi";
import { useAuth } from "../../contexts/AuthContext";
import { useCart } from "../../hooks/useCart";
import { getAutomaticVariant, requiresSizeSelection } from "../../utils/productVariants";

function normalizePromotions(data) {
  const items = Array.isArray(data) ? data : data?.items ?? data?.content ?? [];
  return items
    .map((item) => ({
      ...(item.product ?? {}),
      ...item,
      productId: item.productId ?? item.product?.id,
      productName: item.productName ?? item.product?.name,
      imageUrl: item.imageUrl ?? item.product?.imageUrl,
      categoryName: item.categoryName ?? item.product?.categoryName,
      stockQuantity: item.stockQuantity ?? item.product?.stockQuantity,
      variants: item.variants ?? item.product?.variants ?? [],
      promotionActive: item.promotionActive ?? item.product?.promotionActive ?? true,
      promotionBadgeLabel: item.promotionBadgeLabel ?? item.badgeLabel ?? item.product?.promotionBadgeLabel,
      promotionEndsAt: item.promotionEndsAt ?? item.endsAt ?? item.product?.promotionEndsAt,
      effectivePrice: item.effectivePrice ?? item.product?.effectivePrice,
    }))
    .filter((item) => item?.promotionActive !== false);
}

function getProductId(item) {
  return item.productId ?? item.id;
}

function getProductName(item) {
  return item.productName ?? item.name ?? "Produit ShopSphere";
}

function formatMoney(value) {
  const amount = Number(value ?? 0);
  return `${amount.toFixed(2)} DH`;
}

function getDisplayPrice(item) {
  return item.promotionalPrice ?? item.effectivePrice ?? item.price;
}

function getOriginalPrice(item) {
  return item.originalPrice ?? item.price;
}

function getDiscount(item) {
  if (item.discountPercentage !== undefined && item.discountPercentage !== null) {
    return Math.round(Number(item.discountPercentage));
  }

  const originalPrice = Number(getOriginalPrice(item));
  const displayPrice = Number(getDisplayPrice(item));
  if (!originalPrice || !displayPrice || displayPrice >= originalPrice) {
    return null;
  }

  return Math.round(100 - (displayPrice / originalPrice) * 100);
}

function getNearestEndDate(promotions) {
  return promotions
    .map((promotion) => promotion.promotionEndsAt ?? promotion.endsAt)
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()) && date.getTime() > Date.now())
    .sort((a, b) => a.getTime() - b.getTime())[0];
}

function getTimeLeft(targetDate) {
  if (!targetDate) {
    return { hours: "00", minutes: "00", seconds: "00", expired: false };
  }

  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) {
    return { hours: "00", minutes: "00", seconds: "00", expired: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
    expired: false,
  };
}

export default function FlashSaleSection() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [message, setMessage] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [nowTick, setNowTick] = useState(Date.now());
  const {
    data: promotions = [],
    isLoading: loading,
    refetch: loadFlashSale,
  } = useQuery({
    queryKey: ["public", "promotions", "flash-sale"],
    queryFn: async () => {
      const response = await promotionApi.getFlashSale();
      return normalizePromotions(response.data);
    },
    staleTime: 15_000,
  });

  const nearestEndDate = useMemo(() => getNearestEndDate(promotions), [promotions]);
  const timeLeft = useMemo(() => getTimeLeft(nearestEndDate), [nearestEndDate, nowTick]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (timeLeft.expired) {
      loadFlashSale();
    }
  }, [timeLeft.expired]);

  const visiblePromotions = useMemo(() => {
    if (promotions.length <= 4) {
      return promotions;
    }

    return Array.from({ length: 4 }, (_, offset) => promotions[(activeIndex + offset) % promotions.length]);
  }, [activeIndex, promotions]);

  function goPrevious() {
    setActiveIndex((current) => (current - 1 + promotions.length) % promotions.length);
  }

  function goNext() {
    setActiveIndex((current) => (current + 1) % promotions.length);
  }

  async function handleAddToCart(promotion) {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const productId = getProductId(promotion);
    if (!productId || Number(promotion.stockQuantity ?? 0) <= 0) {
      return;
    }

    if (requiresSizeSelection(promotion)) {
      navigate(`/products/${productId}`);
      return;
    }

    try {
      await addToCart(productId, 1, getAutomaticVariant(promotion)?.id ?? null);
      setMessage("Produit ajouté au panier.");
      window.setTimeout(() => setMessage(""), 2400);
    } catch (error) {
      setMessage(error.response?.data?.message || "Impossible d'ajouter ce produit au panier.");
    }
  }

  if (!loading && promotions.length === 0) {
    return null;
  }

  return (
    <section className="page section-block flash-sale-section" id="promotions">
      <div className="section-heading flash-header">
        <div>
          <span className="section-kicker">Promotions</span>
          <h2>Drops limités, stocks en mouvement</h2>
          <p>Promotions actives, prix recalculés côté serveur et stocks affichés en temps réel.</p>
        </div>
        <div className="flash-toolbar">
          <span className="flash-toolbar-label">Fin dans</span>
          <div className="countdown" aria-label="Temps restant">
            <span>{timeLeft.hours}</span>
            <span>{timeLeft.minutes}</span>
            <span>{timeLeft.seconds}</span>
          </div>
          <div className="carousel-controls">
            <button type="button" aria-label="Produits précédents" onClick={goPrevious} disabled={promotions.length <= 4}>
              &lt;
            </button>
            <button type="button" aria-label="Produits suivants" onClick={goNext} disabled={promotions.length <= 4}>
              &gt;
            </button>
          </div>
        </div>
      </div>

      {message ? <div className="flash-message">{message}</div> : null}

      {loading ? (
        <div className="flash-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <article className="product-card flash-product-card flash-skeleton" key={index} />
          ))}
        </div>
      ) : (
        <div className="flash-grid">
          {visiblePromotions.map((promotion, index) => {
            const productId = getProductId(promotion);
            const productName = getProductName(promotion);
            const displayPrice = getDisplayPrice(promotion);
            const originalPrice = getOriginalPrice(promotion);
            const discount = getDiscount(promotion);
            const stockQuantity = Number(promotion.stockQuantity ?? 0);
            const isOutOfStock = stockQuantity <= 0;

            return (
              <article
                className={`product-card flash-product-card reveal-card flash-card-${index + 1}`}
                key={`${productId}-${promotion.id ?? index}`}
                style={{ animationDelay: `${0.12 + index * 0.08}s` }}
              >
                <div className="product-image">
                  <span className="favorite-chip">{promotion.promotionBadgeLabel || "PROMOTION"}</span>
                  {discount ? <span className="flash-discount">-{discount}%</span> : null}
                  <div className="product-placeholder flash-image-shell">
                    {promotion.imageUrl ? (
                      <img className="flash-product-image" src={promotion.imageUrl} alt={productName} />
                    ) : (
                      <span>{promotion.categoryName ?? "Offre"}</span>
                    )}
                  </div>
                </div>
                <div className="product-copy">
                  <span className="flash-category">{promotion.categoryName ?? "Collection"}</span>
                  <h3>{productName}</h3>
                  <div className="price-row">
                    <strong>{formatMoney(displayPrice)}</strong>
                    {promotion.promotionActive !== false && Number(originalPrice) > Number(displayPrice) ? (
                      <span>{formatMoney(originalPrice)}</span>
                    ) : null}
                  </div>
                  <div className="progress-track" aria-hidden="true">
                    <div className="progress-fill" style={{ width: isOutOfStock ? "100%" : "68%" }} />
                  </div>
                  <div className="product-meta">
                    <small>{isOutOfStock ? "Rupture de stock" : `Stock restant : ${stockQuantity}`}</small>
                  </div>
                  <div className="flash-card-actions">
                    <Link className="button button-secondary" to={`/products/${productId}`}>Voir produit</Link>
                    <button
                      className="button button-primary"
                      type="button"
                      onClick={() => handleAddToCart(promotion)}
                      disabled={isOutOfStock}
                    >
                      {isOutOfStock ? "Indisponible" : requiresSizeSelection(promotion) ? "Choisir une taille" : "Ajouter au panier"}
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
