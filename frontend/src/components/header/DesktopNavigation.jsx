import { NavLink, useLocation } from "react-router-dom";

const menuLabels = {
  shop: "Boutique",
  categories: "Catégories",
  services: "Aide & services",
};

function NavigationChevron() {
  return (
    <svg
      aria-hidden="true"
      className="client-nav-chevron"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}

function isMenuCurrent(menuId, pathname) {
  if (menuId === "shop") return pathname.startsWith("/products");
  if (menuId === "categories") return pathname.startsWith("/categories");
  if (menuId === "services") {
    return ["/support", "/return-policy", "/privacy-policy"].some((path) => pathname.startsWith(path));
  }
  return false;
}

export default function DesktopNavigation({
  getProductNavClass,
  onOpenFromKeyboard,
  onToggle,
  openMenu,
}) {
  const location = useLocation();

  function renderMenuTrigger(menuId) {
    const isOpen = openMenu === menuId;
    const isCurrent = isMenuCurrent(menuId, location.pathname);
    return (
      <button
        aria-controls={`client-mega-${menuId}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`client-nav-trigger ${isOpen || isCurrent ? "active" : ""}`}
        onClick={(event) => onToggle(menuId, event.currentTarget)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            onOpenFromKeyboard(menuId, event.currentTarget);
          }
        }}
        type="button"
      >
        <span>{menuLabels[menuId]}</span>
        <NavigationChevron />
      </button>
    );
  }

  return (
    <nav className="client-desktop-nav" aria-label="Navigation principale">
      <NavLink end to="/">Accueil</NavLink>
      {renderMenuTrigger("shop")}
      {renderMenuTrigger("categories")}
      <NavLink className={() => getProductNavClass("new")} to="/products?sort=new">Nouveautés</NavLink>
      <NavLink to="/blog">Journal</NavLink>
      {renderMenuTrigger("services")}
    </nav>
  );
}
