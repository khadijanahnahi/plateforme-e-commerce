import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AdminSidebar from "../components/layout/AdminSidebar";
import AdminTopbar from "../components/layout/AdminTopbar";
import { useAuth } from "../contexts/AuthContext";

const ADMIN_SIDEBAR_STORAGE_KEY = "shopsphere_admin_sidebar_collapsed";

function readCollapsedPreference() {
  return localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY) === "true";
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className={`admin-dashboard-shell ${collapsed ? "admin-shell-collapsed" : ""}`}>
      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onNavigate={() => setMobileOpen(false)}
        onToggleCollapsed={toggleCollapsed}
      />

      {mobileOpen ? (
        <button
          className="admin-sidebar-backdrop"
          type="button"
          aria-label="Fermer la navigation d’administration"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <div className="admin-dashboard-main">
        <AdminTopbar
          mobileOpen={mobileOpen}
          user={user}
          onLogout={handleLogout}
          onToggleMobile={() => setMobileOpen((current) => !current)}
        />
        <main className="admin-dashboard-content"><Outlet /></main>
      </div>
    </div>
  );
}
