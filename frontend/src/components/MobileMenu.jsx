import { NavLink } from "react-router-dom";
import SearchBar from "./SearchBar";

export default function MobileMenu({
  getProductNavClass,
  handleLogout,
  handleSearchSubmit,
  isAdmin,
  isAuthenticated,
  searchTerm,
  setSearchTerm,
  wishlistCount = 0,
}) {
  return (
    <div className="client-mobile-panel">
      <SearchBar
        className="client-mobile-search"
        onSubmit={handleSearchSubmit}
        placeholder="Rechercher..."
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <nav className="client-mobile-nav" aria-label="Navigation mobile">
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
              <button type="button" onClick={handleLogout}>Déconnexion</button>
            </>
          ) : (
            <>
              <NavLink to="/profile">Profil</NavLink>
              <NavLink to="/orders">Mes commandes</NavLink>
              <button type="button" onClick={handleLogout}>Déconnexion</button>
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
