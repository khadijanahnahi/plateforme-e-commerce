import { Link } from "react-router-dom";
import { ErrorState, Skeleton } from "../ui";
import ProfileIcon from "./ProfileIcon";
import ProfileSectionCard from "./ProfileSectionCard";

function formatPrice(value) {
  return new Intl.NumberFormat("fr-MA", {
    currency: "MAD",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(Number(value ?? 0));
}

function WishlistSkeleton() {
  return (
    <div className="profile-hub-wishlist-grid" aria-hidden="true">
      {[0, 1, 2, 3].map((item) => (
        <div className="profile-hub-wishlist-item" key={item}>
          <Skeleton height="116px" radius="16px" />
          <Skeleton height="18px" width="82%" />
          <Skeleton height="18px" width="42%" />
        </div>
      ))}
    </div>
  );
}

export default function WishlistPreview({
  error,
  isPending,
  items,
  loading,
  onRemove,
  onRetry,
}) {
  const previewItems = items.slice(0, 4);

  return (
    <ProfileSectionCard
      action={<Link className="profile-hub-text-link" to="/wishlist">Voir ma wishlist <span aria-hidden="true">→</span></Link>}
      className="profile-hub-card-wide"
      icon={<ProfileIcon name="heart" />}
      title="Vos favoris"
    >
      {loading ? <WishlistSkeleton /> : null}
      {!loading && error ? (
        <ErrorState
          className="profile-hub-compact-state"
          description={error}
          onRetry={onRetry}
          title="Wishlist indisponible"
        />
      ) : null}
      {!loading && !error && previewItems.length === 0 ? (
        <div className="profile-hub-inline-empty">
          <div>
            <strong>Votre wishlist est vide.</strong>
            <p>Enregistrez les produits qui vous intéressent pour les retrouver rapidement.</p>
          </div>
          <Link className="profile-hub-button profile-hub-button-dark" to="/products">Découvrir les produits</Link>
        </div>
      ) : null}
      {!loading && !error && previewItems.length > 0 ? (
        <div className="profile-hub-wishlist-grid">
          {previewItems.map((item) => (
            <article className="profile-hub-wishlist-item" key={item.id}>
              <Link className="profile-hub-wishlist-image" to={`/products/${item.productId}`}>
                {item.imageUrl ? <img alt={item.productName} src={item.imageUrl} /> : <ProfileIcon name="shop" size={28} />}
              </Link>
              <div className="profile-hub-wishlist-copy">
                <span>{item.categoryName}</span>
                <Link to={`/products/${item.productId}`}>{item.productName}</Link>
                <strong>{formatPrice(item.effectivePrice ?? item.price)}</strong>
              </div>
              <button
                aria-label={`Retirer ${item.productName} de la wishlist`}
                className="profile-hub-heart-button"
                disabled={isPending(item.productId)}
                onClick={() => onRemove(item.productId)}
                type="button"
              >
                <ProfileIcon name="heart" size={17} />
              </button>
            </article>
          ))}
        </div>
      ) : null}
    </ProfileSectionCard>
  );
}
