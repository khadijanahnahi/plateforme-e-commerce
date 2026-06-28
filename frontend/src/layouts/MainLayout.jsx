import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import profileImage from "../../images/profile.png";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const isAdmin = user?.roles?.some((role) => role === "ADMIN" || role === "ROLE_ADMIN");
  const isAdminRoute = location.pathname.startsWith("/admin");

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  if (isAdminRoute) {
    return (
      <div className="app-shell admin-shell">
        <header className="site-header admin-site-header">
          <div className="topbar admin-topbar">
            <NavLink className="brand admin-brand" to="/admin/dashboard">
              ShopSphere Admin
            </NavLink>

            <nav className="primary-nav admin-nav">
              <NavLink to="/admin/dashboard">Dashboard</NavLink>
              <NavLink to="/admin/products">Products</NavLink>
              <NavLink to="/admin/categories">Categories</NavLink>
              <NavLink to="/admin/orders">Orders</NavLink>
            </nav>

            <div className="header-actions admin-header-actions">
              <NavLink className="auth-button signup-button" to="/">
                View Store
              </NavLink>
              {isAuthenticated ? (
                <>
                  <NavLink className="profile-avatar-link admin-profile-link" to="/profile" aria-label="Open admin profile">
                    <img src={profileImage} alt={user?.fullName ?? "Admin profile"} />
                  </NavLink>
                  <button className="auth-button logout-button" type="button" onClick={handleLogout}>
                    Logout
                  </button>
                </>
              ) : (
                <NavLink className="auth-button login-button" to="/login">
                  Login
                </NavLink>
              )}
            </div>
          </div>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="announcement-bar">
          <div className="announcement-inner">
            <span>Premium monochrome edits, weekly drops, express delivery.</span>
            <span>ShopSphere Members get early access to flash deals.</span>
          </div>
        </div>

        <div className="topbar">
          <NavLink className="brand" to="/">
            ShopSphere
          </NavLink>

          <nav className="primary-nav">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/products">Products</NavLink>
            <NavLink to="/">Flash Sale</NavLink>
            <NavLink to="/">Recommended</NavLink>
            <NavLink to="/cart">Cart</NavLink>
            <NavLink to="/orders">Orders</NavLink>
            {isAdmin ? <NavLink to="/admin/dashboard">Admin</NavLink> : null}
          </nav>

          <div className="header-actions">
            <label className="search-shell" htmlFor="shop-search">
              <input
                id="shop-search"
                type="search"
                placeholder="Search products"
              />
            </label>
            {isAuthenticated ? (
              <>
                <NavLink className="icon-link" to="/">
                  Saved
                </NavLink>
                <NavLink className="profile-avatar-link" to="/profile" aria-label="Open profile">
                  <img src={profileImage} alt={user?.fullName ?? "Profile"} />
                </NavLink>
                <button className="auth-button logout-button" type="button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink className="auth-button signup-button" to="/register">
                  Inscription
                </NavLink>
                <NavLink className="auth-button login-button" to="/login">
                  Login
                </NavLink>
              </>
            )}
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
