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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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

  function getProductNavClass(sortValue) {
    if (location.pathname !== "/products") {
      return undefined;
    }

    const currentSort = new URLSearchParams(location.search).get("sort");
    if (!sortValue && !currentSort) {
      return "active";
    }

    return currentSort === sortValue ? "active" : undefined;
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
              <NavLink to="/admin/banners">Banners</NavLink>
              <NavLink to="/admin/products">Products</NavLink>
              <NavLink to="/admin/categories">Categories</NavLink>
              <NavLink to="/admin/coupons">Coupons</NavLink>
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

        <div className="topbar client-topbar">
          <NavLink className="brand client-brand" to="/">
            ShopSphere
          </NavLink>

          <nav className="primary-nav client-nav" aria-label="Main navigation">
            <NavLink className={() => getProductNavClass(null)} to="/products">Shop</NavLink>
            <NavLink className={({ isActive }) => (isActive ? "active" : undefined)} to="/categories">Categories</NavLink>
            <NavLink className={() => getProductNavClass("new")} to="/products?sort=new">New Arrivals</NavLink>
            <NavLink className={() => getProductNavClass("best")} to="/products?sort=best">Best Sellers</NavLink>
          </nav>

          <div className="header-actions client-header-actions">
            <form className="search-shell client-search-shell" onSubmit={handleSearchSubmit}>
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
            <button
              className="mobile-menu-button"
              type="button"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((current) => !current)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>

        {mobileMenuOpen ? (
          <div className="client-mobile-menu">
            <form className="search-shell mobile-search-shell" onSubmit={handleSearchSubmit}>
              <input
                type="search"
                placeholder="Search products"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </form>
            <nav aria-label="Mobile navigation">
              <NavLink className={() => getProductNavClass(null)} to="/products">Shop</NavLink>
              <NavLink className={({ isActive }) => (isActive ? "active" : undefined)} to="/categories">Categories</NavLink>
              <NavLink className={() => getProductNavClass("new")} to="/products?sort=new">New Arrivals</NavLink>
              <NavLink className={() => getProductNavClass("best")} to="/products?sort=best">Best Sellers</NavLink>
              <NavLink to="/support">Support</NavLink>
              {isAuthenticated ? (
                <>
                  <NavLink to="/profile">My Profile</NavLink>
                  <NavLink to="/orders">My Orders</NavLink>
                  {isAdmin ? <NavLink to="/admin/dashboard">Admin Dashboard</NavLink> : null}
                  <button type="button" onClick={handleLogout}>Logout</button>
                </>
              ) : (
                <>
                  <NavLink to="/login">Login</NavLink>
                  <NavLink to="/register">Sign Up</NavLink>
                </>
              )}
            </nav>
          </div>
        ) : null}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
