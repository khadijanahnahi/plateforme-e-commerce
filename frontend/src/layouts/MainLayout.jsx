import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../contexts/AuthContext";
import profileImage from "../../images/profile.png";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const isAdmin = user?.roles?.some((role) => role === "ADMIN" || role === "ROLE_ADMIN");
  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    let mounted = true;

    async function loadCartCount() {
      if (!isAuthenticated) {
        setCartCount(0);
        return;
      }

      try {
        const response = await http.get("/cart");
        if (mounted) {
          setCartCount(response.data.totalItems ?? 0);
        }
      } catch {
        if (mounted) {
          setCartCount(0);
        }
      }
    }

    loadCartCount();
    window.addEventListener("shopsphere-cart-updated", loadCartCount);

    return () => {
      mounted = false;
      window.removeEventListener("shopsphere-cart-updated", loadCartCount);
    };
  }, [isAuthenticated, location.pathname]);

  function handleLogout() {
    logout();
    setCartCount(0);
    navigate("/login", { replace: true });
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const query = searchTerm.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
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
            <NavLink to="/products">Shop</NavLink>
            <NavLink to="/categories">Categories</NavLink>
            <NavLink to="/products">New Arrivals</NavLink>
            <NavLink to="/products">Best Sellers</NavLink>
          </nav>

          <div className="header-actions">
            <form className="search-shell" onSubmit={handleSearchSubmit}>
              <input
                id="shop-search"
                type="search"
                placeholder="Search products"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </form>
            <NavLink className="icon-link wishlist-link" to="/" aria-label="Saved products">
              <span aria-hidden="true">&#9825;</span>
            </NavLink>
            <NavLink className="icon-link cart-link" to="/cart" aria-label={`Cart with ${cartCount} items`}>
              <span aria-hidden="true" className="cart-glyph">Cart</span>
              {isAuthenticated && cartCount > 0 ? <strong className="cart-count">{cartCount}</strong> : null}
            </NavLink>
            {isAuthenticated ? (
              <details className="account-menu">
                <summary className="account-summary">Account</summary>
                <div className="account-dropdown">
                  <NavLink to="/profile">My Profile</NavLink>
                  <NavLink to="/orders">My Orders</NavLink>
                  {isAdmin ? <NavLink to="/admin/dashboard">Admin Dashboard</NavLink> : null}
                  <button type="button" onClick={handleLogout}>Logout</button>
                </div>
              </details>
            ) : (
              <>
                <NavLink className="auth-button login-button" to="/login">
                  Login
                </NavLink>
                <NavLink className="auth-button signup-button" to="/register">
                  Sign Up
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
