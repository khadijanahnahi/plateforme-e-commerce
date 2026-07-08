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
}) {
  return (
    <header className="client-header">
      <div className="client-announcement" aria-label="Annonces ShopSphere">
        <div className="client-announcement-track">
          <span>Éditions monochromes premium</span>
          <span>Nouveaux drops chaque semaine</span>
          <span>Livraison express 48h</span>
          <span>Accès prioritaire membres</span>
          <span>Éditions monochromes premium</span>
          <span>Nouveaux drops chaque semaine</span>
          <span>Livraison express 48h</span>
          <span>Accès prioritaire membres</span>
        </div>
      </div>

      <div className="client-header-main">
        <NavLink className="client-logo" to="/" aria-label="Accueil ShopSphere">
          Shop<span aria-hidden="true">•</span>Sphere
        </NavLink>

        <nav className="client-desktop-nav" aria-label="Navigation principale">
          <NavLink className={() => getProductNavClass(null)} to="/products">Boutique</NavLink>
          <NavLink className={({ isActive }) => (isActive ? "active" : undefined)} to="/categories">Catégories</NavLink>
          <NavLink className={() => getProductNavClass("new")} to="/products?sort=new">Nouveautés</NavLink>
          <NavLink className={() => getProductNavClass("best")} to="/products?sort=best">Meilleures ventes</NavLink>
        </nav>

        <div className="client-actions">
          <SearchBar
            className="client-desktop-search"
            onSubmit={handleSearchSubmit}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />

          <NavLink className="client-icon-button" to="/" aria-label="Liste de souhaits">
            <span aria-hidden="true">♡</span>
          </NavLink>

          <NavLink className="client-icon-button client-cart-button" to="/cart" aria-label={`Panier avec ${cartCount} article${cartCount > 1 ? "s" : ""}`}>
            <span className="client-cart-glyph" aria-hidden="true" />
            {isAuthenticated && cartCount > 0 ? <strong>{cartCount}</strong> : null}
          </NavLink>

          {isAuthenticated ? (
            <UserMenu isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            <div className="client-auth-actions">
              <NavLink className="client-auth-button client-login-button" to="/login">Connexion</NavLink>
            </div>
          )}

          <button
            className="client-menu-toggle"
            type="button"
            aria-label="Ouvrir le menu"
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
        />
      ) : null}
    </header>
  );
}
