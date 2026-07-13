import { useEffect, useState } from "react";
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

export default function VerifiedReviewsSection() {
  const reveal = useInView();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReviews() {
    setLoading(true);
    setError("");
    try {
      const response = await reviewApi.getLatestVerified(6);
      setReviews(normalizeList(response.data));
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Impossible de charger les avis vérifiés.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  if (!loading && !error && reviews.length === 0) {
    return null;
  }

  return (
    <section ref={reveal.ref} className={`page section-block verified-reviews-section ${reveal.isVisible ? "is-visible" : ""}`}>
      <div className="section-heading verified-reviews-heading">
        <div>
          <span className="section-kicker">Avis vérifiés</span>
          <h2>Ils ont choisi ShopSphere</h2>
        </div>
        <p>Des retours authentiques publiés après achat et livraison.</p>
      </div>

      {loading ? (
        <div className="verified-reviews-grid" aria-label="Chargement des avis">
          {Array.from({ length: 3 }, (_, index) => (
            <article className="verified-review-card" key={index}>
              <Skeleton height="18px" width="42%" />
              <Skeleton height="66px" width="100%" />
              <Skeleton height="42px" width="72%" />
            </article>
          ))}
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={loadReviews} />
      ) : (
        <div className="verified-reviews-grid">
          {reviews.map((review, index) => (
            <article
              className="verified-review-card home-reveal-card"
              key={review.reviewId}
              style={{ "--reveal-delay": `${index * 80}ms` }}
            >
              <div className="verified-review-topline">
                <ReviewStars rating={review.rating} />
                <span className="verified-purchase-badge">Achat vérifié</span>
              </div>
              <blockquote>“{review.comment}”</blockquote>
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
      )}
    </section>
  );
}
