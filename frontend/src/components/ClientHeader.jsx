import { useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import MobileMenu from "./MobileMenu";
import MobileProductSearchPanel from "./search/MobileProductSearchPanel";
import ProductSearchAutocomplete from "./search/ProductSearchAutocomplete";
import UserMenu from "./UserMenu";

export default function ClientHeader({
  cartCount,
  getProductNavClass,
  handleLogout,
  isAdmin,
  isAuthenticated,
  mobileMenuOpen,
  searchTerm,
  setMobileMenuOpen,
  setSearchTerm,
  wishlistCount,
}) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchTriggerRef = useRef(null);
  const closeMobileSearch = useCallback(() => {
    setMobileSearchOpen(false);
    window.requestAnimationFrame(() => mobileSearchTriggerRef.current?.focus());
  }, []);
  const mobileLayer =
    mobileMenuOpen && typeof document !== "undefined"
      ? createPortal(
          <>
            <button
              className="client-mobile-overlay"
              type="button"
              aria-label="Fermer le menu mobile"
              onClick={() => setMobileMenuOpen(false)}
            />
            <MobileMenu
              getProductNavClass={getProductNavClass}
              handleLogout={handleLogout}
              isAdmin={isAdmin}
              isAuthenticated={isAuthenticated}
              onClose={() => setMobileMenuOpen(false)}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              wishlistCount={wishlistCount}
            />
          </>,
          document.body
        )
      : null;

  return (
    <header className="client-header">
      <div className="client-announcement" aria-label="Annonces ShopSphere">
        <div className="client-announcement-track">
          <span>Éditions monochromes premium</span>
          <span>Livraison express 48h</span>
          <span>Accès prioritaire membres</span>
          <span>Éditions monochromes premium</span>
          <span>Livraison express 48h</span>
          <span>Accès prioritaire membres</span>
        </div>
      </div>

      <div className="client-header-main">
        <NavLink className="client-logo" to="/" aria-label="Accueil ShopSphere">
          Shop<span aria-hidden="true">{"\u2022"}</span>Sphere
        </NavLink>

        <nav className="client-desktop-nav" aria-label="Navigation principale">
          <NavLink className={() => getProductNavClass("best")} to="/">Accueil</NavLink>
          <NavLink className={() => getProductNavClass(null)} to="/products">Boutique</NavLink>
          <NavLink className={({ isActive }) => (isActive ? "active" : undefined)} to="/categories">Catégories</NavLink>
          <NavLink className={() => getProductNavClass("new")} to="/products?sort=new">Nouveautés</NavLink>
          <NavLink className={({ isActive }) => (isActive ? "active" : undefined)} to="/about">À propos</NavLink>
        </nav>

        <div className="client-actions">
          <ProductSearchAutocomplete
            className="client-desktop-search"
            onValueChange={setSearchTerm}
            placeholder="Rechercher un produit..."
            value={searchTerm}
          />

          <button
            aria-label="Ouvrir la recherche"
            className="client-icon-button client-mobile-search-toggle"
            onClick={() => {
              setMobileMenuOpen(false);
              setMobileSearchOpen(true);
            }}
            ref={mobileSearchTriggerRef}
            type="button"
          >
            <svg className="client-action-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
          </button>

          {!isAdmin ? (
            <NavLink
              className={({ isActive }) => `client-icon-button client-wishlist-button ${isActive ? "is-active" : ""} ${wishlistCount > 0 ? "has-items" : ""}`}
              data-tooltip="Wishlist"
              to="/wishlist"
              aria-label={`Wishlist avec ${wishlistCount} produit${wishlistCount > 1 ? "s" : ""}`}
            >
              <svg className="client-action-icon client-heart-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
              </svg>
              {isAuthenticated && wishlistCount > 0 ? <strong>{wishlistCount}</strong> : null}
            </NavLink>
          ) : null}

          {!isAdmin ? (
            <NavLink
              className={({ isActive }) => `client-icon-button client-cart-button ${isActive ? "is-active" : ""} ${cartCount > 0 ? "has-items" : ""}`}
              data-tooltip="Panier"
              to="/cart"
              aria-label={`Panier avec ${cartCount} article${cartCount > 1 ? "s" : ""}`}
            >
              <svg className="client-action-icon client-bag-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M5.5 8.5h13l-.8 11H6.3l-.8-11Z" />
                <path d="M9 9V6.75a3 3 0 0 1 6 0V9" />
              </svg>
              {isAuthenticated && cartCount > 0 ? <strong>{cartCount}</strong> : null}
            </NavLink>
          ) : null}

          {isAuthenticated ? (
            <UserMenu isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            <div className="client-auth-actions">
              <NavLink className="client-auth-button client-login-button" to="/login">
                Connexion
              </NavLink>
              <NavLink className="client-auth-button client-register-button" to="/register">
                Créer un compte
              </NavLink>
            </div>
          )}

          <button
            className={`client-menu-toggle ${mobileMenuOpen ? "is-open" : ""}`}
            type="button"
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((current) => !current)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {mobileLayer}
      <MobileProductSearchPanel
        onClose={closeMobileSearch}
        onValueChange={setSearchTerm}
        open={mobileSearchOpen}
        value={searchTerm}
      />
    </header>
  );
}
