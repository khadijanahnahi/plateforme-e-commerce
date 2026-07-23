import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";

export default function AccountDropdown({ isAdmin, onLogout }) {
  const menuRef = useRef(null);
  const summaryRef = useRef(null);

  function closeMenu() {
    if (menuRef.current) menuRef.current.open = false;
  }

  useEffect(() => {
    function handleOutsidePointer(event) {
      if (menuRef.current?.open && !menuRef.current.contains(event.target)) closeMenu();
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

  async function logout() {
    closeMenu();
    await onLogout();
  }

  return (
    <details className="client-user-menu" ref={menuRef}>
      <summary className="client-account-button" ref={summaryRef}>Compte</summary>
      <div className="client-account-dropdown">
        {isAdmin ? (
          <>
            <NavLink onClick={closeMenu} to="/admin/dashboard">Tableau de bord admin</NavLink>
            <NavLink onClick={closeMenu} to="/">Voir la boutique</NavLink>
            <NavLink onClick={closeMenu} to="/profile">Profil</NavLink>
          </>
        ) : (
          <>
            <NavLink onClick={closeMenu} to="/profile">Profil</NavLink>
            <NavLink onClick={closeMenu} to="/orders">Mes commandes</NavLink>
            <NavLink onClick={closeMenu} to="/return-policy">Mes retours</NavLink>
            <NavLink onClick={closeMenu} to="/wishlist">Ma wishlist</NavLink>
            <NavLink onClick={closeMenu} to="/support">Support</NavLink>
          </>
        )}
        <button type="button" onClick={logout}>Déconnexion</button>
      </div>
    </details>
  );
}

