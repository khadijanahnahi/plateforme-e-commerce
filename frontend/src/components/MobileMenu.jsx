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
}) {
  return (
    <div className="client-mobile-panel">
      <SearchBar
        className="client-mobile-search"
        onSubmit={handleSearchSubmit}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <nav className="client-mobile-nav" aria-label="Navigation mobile">
        <NavLink className={() => getProductNavClass(null)} to="/products">Boutique</NavLink>
        <NavLink className={({ isActive }) => (isActive ? "active" : undefined)} to="/categories">Catégories</NavLink>
        <NavLink className={() => getProductNavClass("new")} to="/products?sort=new">Nouveautés</NavLink>
        <NavLink className={() => getProductNavClass("best")} to="/products?sort=best">Meilleures ventes</NavLink>
        <NavLink to="/cart">Panier</NavLink>
        <NavLink to="/support">Support</NavLink>

        {isAuthenticated ? (
          <>
            <NavLink to="/profile">Profil</NavLink>
            <NavLink to="/orders">Mes commandes</NavLink>
            {isAdmin ? <NavLink to="/admin/dashboard">Admin Dashboard</NavLink> : null}
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
  );
}
