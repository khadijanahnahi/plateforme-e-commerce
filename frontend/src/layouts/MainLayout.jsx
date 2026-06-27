import { NavLink, Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function MainLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
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
            <NavLink to="/">Categories</NavLink>
            <NavLink to="/">Flash Sale</NavLink>
            <NavLink to="/">Recommended</NavLink>
            <NavLink to="/orders">Orders</NavLink>
          </nav>

          <div className="header-actions">
            <label className="search-shell" htmlFor="shop-search">
              <input
                id="shop-search"
                type="search"
                placeholder="Search products"
              />
            </label>
            <NavLink className="icon-link" to="/">
              Saved
            </NavLink>
            {isAuthenticated ? (
              <>
                <span className="auth-user">{user?.fullName ?? "Client"}</span>
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
