import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import http from "../api/http";
import { useAuth } from "../contexts/AuthContext";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = user?.roles?.some((role) => role === "ADMIN" || role === "ROLE_ADMIN");

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

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="announcement-bar">
          <div className="announcement-inner">
            <div className="announcement-track" aria-label="Annonces ShopSphere">
              <span>ÉDITIONS MONOCHROMES PREMIUM</span>
              <span>NOUVEAUX DROPS CHAQUE SEMAINE</span>
              <span>LIVRAISON EXPRESS 48H</span>
              <span>ACCÈS PRIORITAIRE MEMBRES</span>
              <span>ÉDITIONS MONOCHROMES PREMIUM</span>
              <span>NOUVEAUX DROPS CHAQUE SEMAINE</span>
              <span>LIVRAISON EXPRESS 48H</span>
              <span>ACCÈS PRIORITAIRE MEMBRES</span>
            </div>
          </div>
        </div>

        <div className="topbar client-topbar">
          <NavLink className="brand client-brand" to="/">
            Shop<span className="brand-dot" aria-hidden="true" />Sphere
          </NavLink>

          <nav className="primary-nav client-nav" aria-label="Navigation principale">
            <NavLink className={() => getProductNavClass(null)} to="/products">Boutique</NavLink>
            <NavLink className={({ isActive }) => (isActive ? "active" : undefined)} to="/categories">Catégories</NavLink>
            <NavLink className={() => getProductNavClass("new")} to="/products?sort=new">Nouveautés</NavLink>
          </nav>

          <div className="header-actions client-header-actions">
            <form className="search-shell client-search-shell" onSubmit={handleSearchSubmit}>
              <input
                id="shop-search"
                type="search"
                placeholder="Rechercher"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </form>
            <NavLink className="icon-link wishlist-link" to="/" aria-label="Produits favoris">
              <span aria-hidden="true">&#9825;</span>
            </NavLink>
            <NavLink className="icon-link cart-link" to="/cart" aria-label={`Panier avec ${cartCount} article${cartCount > 1 ? "s" : ""}`}>
              <span aria-hidden="true" className="cart-glyph">Panier</span>
              {isAuthenticated && cartCount > 0 ? <strong className="cart-count">{cartCount}</strong> : null}
            </NavLink>
            {isAuthenticated ? (
              <details className="account-menu">
                <summary className="account-summary">Compte</summary>
                <div className="account-dropdown">
                  <NavLink to="/profile">Mon profil</NavLink>
                  <NavLink to="/orders">Mes commandes</NavLink>
                  {isAdmin ? <NavLink to="/admin/dashboard">Dashboard admin</NavLink> : null}
                  <button type="button" onClick={handleLogout}>Déconnexion</button>
                </div>
              </details>
            ) : (
              <>
                <NavLink className="auth-button login-button" to="/login">
                  Connexion
                </NavLink>
                <NavLink className="auth-button signup-button" to="/register">
                  Créer un compte
                </NavLink>
              </>
            )}
            <button
              className="mobile-menu-button"
              type="button"
              aria-label="Ouvrir le menu de navigation"
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
                placeholder="Rechercher"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </form>
            <nav aria-label="Navigation mobile">
              <NavLink className={() => getProductNavClass(null)} to="/products">Boutique</NavLink>
              <NavLink className={({ isActive }) => (isActive ? "active" : undefined)} to="/categories">Catégories</NavLink>
              <NavLink className={() => getProductNavClass("new")} to="/products?sort=new">Nouveautés</NavLink>
              <NavLink to="/support">Support</NavLink>
              {isAuthenticated ? (
                <>
                  <NavLink to="/profile">Mon profil</NavLink>
                  <NavLink to="/orders">Mes commandes</NavLink>
                  {isAdmin ? <NavLink to="/admin/dashboard">Dashboard admin</NavLink> : null}
                  <button type="button" onClick={handleLogout}>Déconnexion</button>
                </>
              ) : (
                <>
                  <NavLink to="/login">Connexion</NavLink>
                  <NavLink to="/register">Créer un compte</NavLink>
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
