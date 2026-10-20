import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { reviewApi } from "../../api/reviewApi";
import { ErrorState, Skeleton } from "../../components/ui";
import useInView from "../../hooks/useInView";

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  return data?.content ?? data?.items ?? [];
}

function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function ReviewStars({ rating }) {
  return (
    <div className="verified-review-stars" aria-label={`${rating} étoiles sur 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span className={index < rating ? "is-filled" : ""} key={index} aria-hidden="true">★</span>
      ))}
    </div>
  );
}

function ReviewMetric({ icon, label, value, detail }) {
  const icons = {
    rating: <><path d="m12 3 2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8L12 3Z" /></>,
    verified: <><path d="M12 3 5.5 6v5.5c0 4.2 2.6 7.4 6.5 9.5 3.9-2.1 6.5-5.3 6.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>,
    community: <><circle cx="12" cy="8" r="3" /><path d="M6 20a6 6 0 0 1 12 0" /></>,
  };

  return (
    <div className="verified-review-metric">
      <span className="verified-review-metric-icon">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          {icons[icon]}
        </svg>
      </span>
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{detail}</small>
    </div>
  );
}

export default function VerifiedReviewsSection() {
  const reveal = useInView();
  const viewportRef = useRef(null);
  const scrollFrameRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);
  const {
    data: reviews = [],
    error,
    isLoading: loading,
    refetch: loadReviews,
  } = useQuery({
    queryKey: ["public", "reviews", "latest", 6],
    queryFn: async () => {
      const response = await reviewApi.getLatestVerified(6);
      return normalizeList(response.data);
    },
  });

  const metrics = useMemo(() => {
    if (reviews.length === 0) return null;
    const ratingTotal = reviews.reduce((total, review) => total + Number(review.rating || 0), 0);
    const verifiedCount = reviews.filter((review) => review.verifiedPurchase).length;
    return {
      averageRating: (ratingTotal / reviews.length).toFixed(1),
      verifiedPercentage: Math.round((verifiedCount / reviews.length) * 100),
    };
  }, [reviews]);

  const maxIndex = Math.max(0, reviews.length - visibleCount);

  useEffect(() => {
    function updateVisibleCount() {
      if (window.innerWidth <= 680) setVisibleCount(1);
      else if (window.innerWidth <= 1050) setVisibleCount(2);
      else setVisibleCount(3);
    }

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  useEffect(() => {
    if (currentIndex <= maxIndex) return;
    setCurrentIndex(maxIndex);
    const cards = viewportRef.current?.querySelectorAll(".verified-review-card");
    const target = cards?.[maxIndex];
    if (target && viewportRef.current) {
      viewportRef.current.scrollTo({ left: target.offsetLeft - cards[0].offsetLeft });
    }
  }, [currentIndex, maxIndex]);

  useEffect(() => () => cancelAnimationFrame(scrollFrameRef.current), []);

  function goToReview(index) {
    const nextIndex = Math.max(0, Math.min(index, maxIndex));
    const viewport = viewportRef.current;
    const cards = viewport?.querySelectorAll(".verified-review-card");
    const target = cards?.[nextIndex];
    if (!viewport || !target) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    viewport.scrollTo({
      left: target.offsetLeft - cards[0].offsetLeft,
      behavior: reduceMotion ? "auto" : "smooth",
    });
    setCurrentIndex(nextIndex);
  }

  function syncCurrentReview() {
    cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = requestAnimationFrame(() => {
      const viewport = viewportRef.current;
      const cards = viewport?.querySelectorAll(".verified-review-card");
      if (!viewport || !cards || cards.length < 2) return;
      const step = cards[1].offsetLeft - cards[0].offsetLeft;
      if (step > 0) setCurrentIndex(Math.min(maxIndex, Math.max(0, Math.round(viewport.scrollLeft / step))));
    });
  }

  if (!loading && !error && reviews.length === 0) {
    return null;
  }

  return (
    <section ref={reveal.ref} className={`page section-block verified-reviews-section ${reveal.isVisible ? "is-visible" : ""}`}>
      <div className="verified-reviews-intro">
        <div className="verified-reviews-heading">
          <span className="section-kicker">Avis vérifiés</span>
          <h2>Ils ont choisi ShopSphere</h2>
          <p>Des retours authentiques publiés après achat et livraison.</p>
        </div>

        {metrics ? (
          <div className="verified-reviews-metrics" aria-label="Résumé des avis affichés">
            <ReviewMetric icon="rating" value={`${metrics.averageRating}/5`} label="Note moyenne" detail="sur les avis affichés" />
            <ReviewMetric icon="verified" value={reviews.length} label="Avis récents" detail="chargés depuis ShopSphere" />
            <ReviewMetric icon="community" value={`${metrics.verifiedPercentage}%`} label="Achats vérifiés" detail="dans cette sélection" />
          </div>
        ) : null}
      </div>

      {loading ? (
        <div className="verified-reviews-grid verified-reviews-loading" aria-label="Chargement des avis">
          {Array.from({ length: 3 }, (_, index) => (
            <article className="verified-review-card" key={index}>
              <Skeleton height="18px" width="42%" />
              <Skeleton height="66px" width="100%" />
              <Skeleton height="42px" width="72%" />
            </article>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          description={error.response?.data?.message ?? "Impossible de charger les avis vérifiés."}
          onRetry={loadReviews}
        />
      ) : (
        <>
          <div className="verified-reviews-carousel">
            {reviews.length > visibleCount ? (
              <button className="verified-reviews-arrow is-previous" type="button" aria-label="Afficher les avis précédents" disabled={currentIndex === 0} onClick={() => goToReview(currentIndex - 1)}>
                <span aria-hidden="true">←</span>
              </button>
            ) : null}

            <div className="verified-reviews-viewport" ref={viewportRef} onScroll={syncCurrentReview}>
              <div className="verified-reviews-grid">
                {reviews.map((review, index) => (
                  <article
                    className="verified-review-card home-reveal-card"
                    key={review.reviewId}
                    style={{ "--reveal-delay": `${index * 70}ms` }}
                  >
                    <div className="verified-review-topline">
                      <ReviewStars rating={review.rating} />
                      <span className="verified-purchase-badge">
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3 5.5 6v5.5c0 4.2 2.6 7.4 6.5 9.5 3.9-2.1 6.5-5.3 6.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></svg>
                        Achat vérifié
                      </span>
                    </div>
                    <span className="verified-review-quote" aria-hidden="true">“</span>
                    <blockquote>{review.comment}</blockquote>
                    <div className="verified-review-author">
                      <div className="verified-review-avatar" aria-hidden="true">
                        {review.customerDisplayName?.charAt(0)?.toUpperCase() ?? "S"}
                      </div>
                      <div>
                        <strong>{review.customerDisplayName}</strong>
                        <time dateTime={review.createdAt}>{formatDate(review.createdAt)}</time>
                      </div>
                    </div>
                    <Link className="verified-review-product" to={`/products/${review.productId}`}>
                      <span className="verified-review-product-image">
                        {review.productImageUrl ? <img src={review.productImageUrl} alt="" loading="lazy" /> : <span aria-hidden="true">S</span>}
                      </span>
                      <span>
                        <small>Produit évalué</small>
                        <strong>{review.productName}</strong>
                      </span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </article>
                ))}
              </div>
            </div>

            {reviews.length > visibleCount ? (
              <button className="verified-reviews-arrow is-next" type="button" aria-label="Afficher les avis suivants" disabled={currentIndex === maxIndex} onClick={() => goToReview(currentIndex + 1)}>
                <span aria-hidden="true">→</span>
              </button>
            ) : null}
          </div>

          <div className="verified-reviews-footer">
            {maxIndex > 0 ? (
              <div className="verified-reviews-dots" aria-label="Navigation des avis">
                {Array.from({ length: maxIndex + 1 }, (_, index) => (
                  <button className={currentIndex === index ? "is-active" : ""} type="button" aria-label={`Afficher le groupe d’avis ${index + 1}`} aria-current={currentIndex === index ? "true" : undefined} key={index} onClick={() => goToReview(index)} />
                ))}
              </div>
            ) : <span />}
            <Link className="verified-reviews-all-link" to="/products">Découvrir les produits évalués <span aria-hidden="true">→</span></Link>
          </div>
        </>
      )}
    </section>
  );
}
