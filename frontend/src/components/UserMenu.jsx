import { NavLink } from "react-router-dom";

export default function UserMenu({ isAdmin, onLogout }) {
  return (
    <details className="client-user-menu">
      <summary className="client-account-button">Compte</summary>
      <div className="client-account-dropdown">
        {isAdmin ? (
          <>
            <NavLink to="/admin/dashboard">Admin Dashboard</NavLink>
            <NavLink to="/">Voir la boutique</NavLink>
            <NavLink to="/profile">Profil</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/profile">Profil</NavLink>
            <NavLink to="/orders">Mes commandes</NavLink>
            <NavLink to="/wishlist">Wishlist</NavLink>
          </>
        )}
        <button type="button" onClick={onLogout}>Déconnexion</button>
      </div>
    </details>
  );
}
