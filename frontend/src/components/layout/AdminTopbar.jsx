import { NavLink } from "react-router-dom";
import profileImage from "../../../images/profile.webp";
import AdminNotificationCenter from "./AdminNotificationCenter";

export default function AdminTopbar({ mobileOpen, onLogout, onToggleMobile, user }) {
  return (
    <header className="admin-dashboard-topbar">
      <button
        className="admin-sidebar-toggle"
        type="button"
        aria-label={mobileOpen ? "Fermer la navigation d’administration" : "Ouvrir la navigation d’administration"}
        aria-expanded={mobileOpen}
        onClick={onToggleMobile}
      >
        <span />
        <span />
        <span />
      </button>

      <div className="admin-topbar-title">
        <span>Espace d’administration</span>
        <strong>{user?.fullName ?? "Administrateur"}</strong>
      </div>

      <div className="admin-topbar-actions">
        <NavLink className="auth-button signup-button" to="/">Voir la boutique</NavLink>
        <AdminNotificationCenter />
        <NavLink className="profile-avatar-link admin-profile-link" to="/profile" aria-label="Ouvrir le profil administrateur">
          <img src={profileImage} alt={user?.fullName ?? "Profil administrateur"} />
        </NavLink>
        <button className="auth-button logout-button" type="button" onClick={onLogout}>Déconnexion</button>
      </div>
    </header>
  );
}
