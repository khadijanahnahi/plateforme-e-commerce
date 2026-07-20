import { Link } from "react-router-dom";
import { ErrorState, Skeleton, StatusBadge } from "../ui";
import ProfileIcon from "./ProfileIcon";
import ProfileSectionCard from "./ProfileSectionCard";

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value))
    : "Date indisponible";
}

function formatPrice(value) {
  return new Intl.NumberFormat("fr-MA", {
    currency: "MAD",
    maximumFractionDigits: 2,
    style: "currency",
  }).format(Number(value ?? 0));
}

function OrdersSkeleton() {
  return (
    <div className="profile-hub-orders-list" aria-hidden="true">
      {[0, 1, 2].map((item) => (
        <div className="profile-hub-order-row" key={item}>
          <Skeleton height="18px" width="130px" />
          <Skeleton height="18px" width="95px" />
          <Skeleton height="28px" width="92px" />
        </div>
      ))}
    </div>
  );
}

export default function RecentOrdersCard({ error, loading, onRetry, orders }) {
  const recentOrders = [...orders]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 4);

  return (
    <ProfileSectionCard
      action={<Link className="profile-hub-text-link" to="/orders">Voir toutes <span aria-hidden="true">→</span></Link>}
      className="profile-hub-card-wide"
      icon={<ProfileIcon name="orders" />}
      title="Dernières commandes"
    >
      {loading ? <OrdersSkeleton /> : null}
      {!loading && error ? (
        <ErrorState
          className="profile-hub-compact-state"
          description={error}
          onRetry={onRetry}
          title="Commandes indisponibles"
        />
      ) : null}
      {!loading && !error && recentOrders.length === 0 ? (
        <div className="profile-hub-inline-empty">
          <div>
            <strong>Vous n’avez encore passé aucune commande.</strong>
            <p>Votre historique apparaîtra ici après votre premier achat.</p>
          </div>
          <Link className="profile-hub-button profile-hub-button-dark" to="/products">Découvrir la boutique</Link>
        </div>
      ) : null}
      {!loading && !error && recentOrders.length > 0 ? (
        <div className="profile-hub-orders-list">
          {recentOrders.map((order) => (
            <Link className="profile-hub-order-row" key={order.id} to={`/orders/${order.id}`}>
              <div className="profile-hub-order-main">
                <strong>{order.orderNumber}</strong>
                <span>{formatDate(order.createdAt)}</span>
              </div>
              <strong className="profile-hub-order-total">{formatPrice(order.totalAmount)}</strong>
              <div className="profile-hub-order-statuses">
                <StatusBadge type="order" value={order.status} />
                <StatusBadge type="payment" value={order.paymentStatus} />
              </div>
              <ProfileIcon name="chevron" size={18} />
            </Link>
          ))}
        </div>
      ) : null}
    </ProfileSectionCard>
  );
}
