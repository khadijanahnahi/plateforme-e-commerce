import { NavLink } from "react-router-dom";
import profileImage from "../../../images/profile.webp";

export default function AdminTopbar({ mobileOpen, onLogout, onToggleMobile, user }) {
  return (
    <header className="admin-dashboard-topbar">
      <button
        className="admin-sidebar-toggle"
        type="button"
        aria-label={mobileOpen ? "Close admin navigation" : "Open admin navigation"}
        aria-expanded={mobileOpen}
        onClick={onToggleMobile}
      >
        <span />
        <span />
        <span />
      </button>

      <div className="admin-topbar-title">
        <span>Admin Workspace</span>
        <strong>{user?.fullName ?? "Administrator"}</strong>
      </div>

      <div className="admin-topbar-actions">
        <NavLink className="auth-button signup-button" to="/">View Store</NavLink>
        <NavLink className="profile-avatar-link admin-profile-link" to="/profile" aria-label="Open admin profile">
          <img src={profileImage} alt={user?.fullName ?? "Admin profile"} />
        </NavLink>
        <button className="auth-button logout-button" type="button" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
