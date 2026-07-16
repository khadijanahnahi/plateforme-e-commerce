import { NavLink } from "react-router-dom";
import MobileMenu from "./MobileMenu";
import SearchBar from "./SearchBar";
import UserMenu from "./UserMenu";

export default function ClientHeader({
  cartCount,
  getProductNavClass,
  handleLogout,
  handleSearchSubmit,
  isAdmin,
  isAuthenticated,
  mobileMenuOpen,
  searchTerm,
  setMobileMenuOpen,
  setSearchTerm,
  wishlistCount,
}) {
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
          <NavLink className={() => getProductNavClass("best")} to="/">Acceuil</NavLink>
          <NavLink className={() => getProductNavClass(null)} to="/products">Boutique</NavLink>
          <NavLink className={({ isActive }) => (isActive ? "active" : undefined)} to="/categories">Catégories</NavLink>
          <NavLink className={() => getProductNavClass("new")} to="/products?sort=new">Nouveautés</NavLink>
          <NavLink className={({ isActive }) => (isActive ? "active" : undefined)} to="/about">À propos</NavLink>
        </nav>

        <div className="client-actions">
          <SearchBar
            className="client-desktop-search"
            onSubmit={handleSearchSubmit}
            placeholder="Rechercher un produit..."
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

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

      {mobileMenuOpen ? (
        <MobileMenu
          getProductNavClass={getProductNavClass}
          handleLogout={handleLogout}
          handleSearchSubmit={handleSearchSubmit}
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          wishlistCount={wishlistCount}
        />
      ) : null}
    </header>
  );
}
