import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import profileImage from "../../images/profile.png";

const adminLinks = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Banners", to: "/admin/banners" },
  { label: "Products", to: "/admin/products" },
  { label: "Categories", to: "/admin/categories" },
  { label: "Coupons", to: "/admin/coupons" },
  { label: "Reviews", to: "/admin/reviews" },
  { label: "Orders", to: "/admin/orders" },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="admin-dashboard-shell">
      <aside className={`admin-sidebar ${sidebarOpen ? "admin-sidebar-open" : ""}`}>
        <div className="admin-sidebar-brand">
          <NavLink to="/admin/dashboard">ShopSphere Admin</NavLink>
          <span>Commerce Console</span>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin navigation">
          {adminLinks.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
          <span className="admin-sidebar-disabled">Settings</span>
        </nav>
      </aside>

      {sidebarOpen ? (
        <button
          className="admin-sidebar-backdrop"
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="admin-dashboard-main">
        <header className="admin-dashboard-topbar">
          <button
            className="admin-sidebar-toggle"
            type="button"
            aria-label="Open admin navigation"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((current) => !current)}
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
            <NavLink className="auth-button signup-button" to="/">
              View Store
            </NavLink>
            <NavLink className="profile-avatar-link admin-profile-link" to="/profile" aria-label="Open admin profile">
              <img src={profileImage} alt={user?.fullName ?? "Admin profile"} />
            </NavLink>
            <button className="auth-button logout-button" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="admin-dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
