import { NavLink } from "react-router-dom";
import SearchBar from "./SearchBar";

export default function MobileMenu({
  getProductNavClass,
  handleLogout,
  handleSearchSubmit,
  isAdmin,
  isAuthenticated,
  onClose,
  searchTerm,
  setSearchTerm,
  wishlistCount = 0,
}) {
  function submitSearch(event) {
    handleSearchSubmit(event);
    onClose?.();
  }

  function logoutAndClose() {
    handleLogout();
    onClose?.();
  }

  function closeOnNavigation(event) {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest("a")) {
      onClose?.();
    }
  }

  return (
    <div className="client-mobile-panel" role="dialog" aria-modal="true" aria-label="Menu mobile ShopSphere">
      <SearchBar
        className="client-mobile-search"
        onSubmit={submitSearch}
        placeholder="Rechercher..."
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <nav className="client-mobile-nav" aria-label="Navigation mobile" onClick={closeOnNavigation}>
        <NavLink className={() => getProductNavClass(null)} to="/products">Boutique</NavLink>
        <NavLink className={({ isActive }) => (isActive ? "active" : undefined)} to="/categories">Catégories</NavLink>
        <NavLink className={() => getProductNavClass("new")} to="/products?sort=new">Nouveautés</NavLink>
        <NavLink className={() => getProductNavClass("best")} to="/products?sort=best">Meilleures ventes</NavLink>
        {!isAdmin ? (
          <>
            <NavLink to="/wishlist">Wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ""}</NavLink>
            <NavLink to="/cart">Panier</NavLink>
          </>
        ) : null}
        <NavLink to="/support">Support</NavLink>
        <NavLink to="/about">À propos</NavLink>

        {isAuthenticated ? (
          isAdmin ? (
            <>
              <NavLink to="/admin/dashboard">Admin Dashboard</NavLink>
              <NavLink to="/">Voir la boutique</NavLink>
              <NavLink to="/profile">Profil</NavLink>
              <button type="button" onClick={logoutAndClose}>Déconnexion</button>
            </>
          ) : (
            <>
              <NavLink to="/profile">Profil</NavLink>
              <NavLink to="/orders">Mes commandes</NavLink>
              <button type="button" onClick={logoutAndClose}>Déconnexion</button>
            </>
          )
        ) : (
          <>
            <NavLink to="/login">Connexion</NavLink>
            <NavLink to="/register">Créer un compte</NavLink>
          </>
        )}
      </nav>
    </div>
  );
}
