import { Link, useOutletContext } from "react-router-dom";
import ProfileIcon from "../components/profile/ProfileIcon";
import ProfileSectionCard from "../components/profile/ProfileSectionCard";
import QuickActionsCard from "../components/profile/QuickActionsCard";
import RecentOrdersCard from "../components/profile/RecentOrdersCard";
import WishlistPreview from "../components/profile/WishlistPreview";

function roleLabel(roles = []) {
  return roles.some((role) => role === "ADMIN" || role === "ROLE_ADMIN")
    ? "Administrateur"
    : "Client";
}

function InformationRow({ label, value }) {
  return (
    <div className="profile-hub-information-row">
      <span>{label}</span>
      <strong>{value || "Non renseigné"}</strong>
    </div>
  );
}

export default function ProfileOverviewPage() {
  const dashboard = useOutletContext();

  async function removeWishlistItem(productId) {
    try {
      await dashboard.removeFromWishlist(productId);
    } catch {
      // WishlistContext affiche déjà un toast compréhensible.
    }
  }

  return (
    <div className="profile-hub-overview">
      <div className="profile-hub-content-heading">
        <span className="profile-hub-kicker">VUE D’ENSEMBLE</span>
        <h2>Bonjour, {dashboard.user?.fullName?.split(" ")[0] || "Client"}</h2>
        <p>Retrouvez ici l’essentiel de votre compte ShopSphere.</p>
      </div>

      <div className="profile-hub-dashboard-grid">
        <ProfileSectionCard
          action={<Link className="profile-hub-text-link" to="/profile/informations">Modifier <span aria-hidden="true">→</span></Link>}
          icon={<ProfileIcon name="user" />}
          title="Informations personnelles"
        >
          <div className="profile-hub-information-list">
            <InformationRow label="Nom complet" value={dashboard.user?.fullName} />
            <InformationRow label="Email" value={dashboard.user?.email} />
            <InformationRow label="Téléphone" value={dashboard.user?.phone} />
            <InformationRow label="Rôle" value={roleLabel(dashboard.user?.roles)} />
          </div>
        </ProfileSectionCard>

        <ProfileSectionCard
          action={<Link className="profile-hub-text-link" to="/profile/security">Modifier <span aria-hidden="true">→</span></Link>}
          icon={<ProfileIcon name="shield" />}
          title="Sécurité"
        >
          <div className="profile-hub-security-summary">
            <div>
              <span>Mot de passe</span>
              <strong>Protégé par chiffrement</strong>
              <small>Date de dernière modification indisponible</small>
            </div>
            <span className="profile-hub-security-mark"><ProfileIcon name="lock" /></span>
          </div>
        </ProfileSectionCard>

        {!dashboard.isAdmin ? (
          <RecentOrdersCard
            error={dashboard.ordersError}
            loading={dashboard.ordersLoading}
            onRetry={() => dashboard.refreshOrders()}
            orders={dashboard.orders}
          />
        ) : null}

        {!dashboard.isAdmin ? (
          <WishlistPreview
            error={dashboard.wishlistError}
            isPending={dashboard.isWishlistActionPending}
            items={dashboard.wishlistItems}
            loading={dashboard.wishlistLoading}
            onRemove={removeWishlistItem}
            onRetry={() => dashboard.refreshWishlist().catch(() => undefined)}
          />
        ) : null}

        <QuickActionsCard isAdmin={dashboard.isAdmin} />
      </div>
    </div>
  );
}
