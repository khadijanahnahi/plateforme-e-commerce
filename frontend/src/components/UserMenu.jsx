import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";

export default function UserMenu({ isAdmin, onLogout }) {
  const menuRef = useRef(null);
  const summaryRef = useRef(null);

  function closeMenu() {
    if (menuRef.current) {
      menuRef.current.open = false;
    }
  }

  useEffect(() => {
    function handleOutsidePointer(event) {
      const menu = menuRef.current;
      if (menu?.open && !menu.contains(event.target)) {
        closeMenu();
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape" && menuRef.current?.open) {
        closeMenu();
        summaryRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handleOutsidePointer);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleLogout() {
    closeMenu();
    onLogout();
  }

  return (
    <details className="client-user-menu" ref={menuRef}>
      <summary className="client-account-button" ref={summaryRef}>Compte</summary>
      <div className="client-account-dropdown">
        {isAdmin ? (
          <>
            <NavLink to="/admin/dashboard" onClick={closeMenu}>Admin Dashboard</NavLink>
            <NavLink to="/" onClick={closeMenu}>Voir la boutique</NavLink>
            <NavLink to="/profile" onClick={closeMenu}>Profil</NavLink>
          </>
        ) : (
          <>
            <NavLink to="/profile" onClick={closeMenu}>Profil</NavLink>
            <NavLink to="/orders" onClick={closeMenu}>Mes commandes</NavLink>
            <NavLink to="/wishlist" onClick={closeMenu}>Wishlist</NavLink>
          </>
        )}
        <button type="button" onClick={handleLogout}>Déconnexion</button>
      </div>
    </details>
  );
}
