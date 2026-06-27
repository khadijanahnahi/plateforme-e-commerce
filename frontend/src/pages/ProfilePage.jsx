import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProfilePage() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const roles = user?.roles?.length ? user.roles.join(", ") : "USER";

  return (
    <section className="page profile-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">Client account</span>
          <h1>Mon profil</h1>
          <p>Consulte tes informations de compte et accede rapidement a tes commandes.</p>
        </div>
      </div>

      <div className="profile-grid">
        <article className="profile-card">
          <div className="profile-avatar">
            {(user?.fullName ?? "C").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <span className="section-kicker">Identity</span>
            <h2>{user?.fullName ?? "Client ShopSphere"}</h2>
            <p>{user?.email}</p>
          </div>
        </article>

        <article className="profile-card profile-info-card">
          <h2>Informations</h2>
          <dl className="profile-list">
            <div>
              <dt>Nom complet</dt>
              <dd>{user?.fullName ?? "-"}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user?.email ?? "-"}</dd>
            </div>
            <div>
              <dt>Telephone</dt>
              <dd>{user?.phone ?? "-"}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{roles}</dd>
            </div>
          </dl>
        </article>

        <article className="profile-card profile-actions-card">
          <h2>Actions rapides</h2>
          <div className="profile-actions">
            <Link className="button button-primary" to="/orders">Mes commandes</Link>
            <Link className="button button-secondary" to="/cart">Voir panier</Link>
            <Link className="button button-secondary" to="/checkout">Checkout</Link>
            <Link className="button button-secondary" to="/products">Continuer shopping</Link>
          </div>
        </article>
      </div>
    </section>
  );
}
