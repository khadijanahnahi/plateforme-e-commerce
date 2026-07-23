import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import ProductSearchAutocomplete from "../search/ProductSearchAutocomplete";
import { serviceGroups, shopDiscoveryLinks } from "./navigationConfig";

function MobileAccordion({ children, id, label, onToggle, open }) {
  return (
    <section className={`client-mobile-accordion ${open ? "is-open" : ""}`}>
      <button
        aria-controls={`mobile-nav-${id}`}
        aria-expanded={open}
        className="client-mobile-accordion-trigger"
        onClick={() => onToggle(id)}
        type="button"
      >
        <span>{label}</span>
        <span aria-hidden="true">+</span>
      </button>
      {open ? <div className="client-mobile-accordion-panel" id={`mobile-nav-${id}`}>{children}</div> : null}
    </section>
  );
}

function MobileNavLink({ children, end = false, onClose, to }) {
  return <NavLink end={end} onClick={onClose} to={to}>{children}</NavLink>;
}

export default function MobileNavigationDrawer({
  cartCount = 0,
  categories,
  categoriesError,
  categoriesLoading,
  handleLogout,
  isAdmin,
  isAuthenticated,
  onClose,
  onRetryCategories,
  searchTerm,
  setSearchTerm,
  wishlistCount = 0,
}) {
  const closeButtonRef = useRef(null);
  const [openSection, setOpenSection] = useState(null);

  useEffect(() => {
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());
  }, []);

  function toggleSection(section) {
    setOpenSection((current) => (current === section ? null : section));
  }

  async function logoutAndClose() {
    onClose?.();
    await handleLogout();
  }

  return (
    <aside
      aria-label="Menu mobile ShopSphere"
      aria-modal="true"
      className="client-mobile-panel"
      role="dialog"
    >
      <div className="client-mobile-panel-heading">
        <div>
          <span>ShopSphere</span>
          <strong>Navigation</strong>
        </div>
        <button
          aria-label="Fermer le menu"
          className="client-mobile-close"
          onClick={onClose}
          ref={closeButtonRef}
          type="button"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      <ProductSearchAutocomplete
        className="client-mobile-search"
        onNavigate={onClose}
        onValueChange={setSearchTerm}
        placeholder="Rechercher..."
        value={searchTerm}
        variant="mobile"
      />

      <nav className="client-mobile-nav" aria-label="Navigation mobile">
        <MobileNavLink end onClose={onClose} to="/">Accueil</MobileNavLink>

        <MobileAccordion id="shop" label="Boutique" onToggle={toggleSection} open={openSection === "shop"}>
          {shopDiscoveryLinks.map((link) => (
            <MobileNavLink key={`${link.to}-${link.label}`} onClose={onClose} to={link.to}>
              <span>{link.label}</span>
              <small>{link.description}</small>
            </MobileNavLink>
          ))}
        </MobileAccordion>

        <MobileAccordion id="categories" label="Catégories" onToggle={toggleSection} open={openSection === "categories"}>
          {categoriesLoading ? (
            <span className="client-mobile-nav-state">Chargement des catégories...</span>
          ) : categoriesError ? (
            <button className="client-mobile-retry" onClick={onRetryCategories} type="button">
              Réessayer de charger les catégories
            </button>
          ) : categories.length ? (
            <>
              {categories.slice(0, 8).map((category) => (
                <MobileNavLink key={category.id} onClose={onClose} to={`/products?categoryId=${category.id}`}>
                  <span>{category.name}</span>
                  <small>{category.productCount} produit{Number(category.productCount) > 1 ? "s" : ""}</small>
                </MobileNavLink>
              ))}
              <MobileNavLink onClose={onClose} to="/categories">Toutes les catégories</MobileNavLink>
            </>
          ) : (
            <span className="client-mobile-nav-state">Aucune catégorie disponible.</span>
          )}
        </MobileAccordion>

        <MobileNavLink onClose={onClose} to="/products?sort=new">Nouveautés</MobileNavLink>
        <MobileNavLink onClose={onClose} to="/blog">Journal</MobileNavLink>

        <MobileAccordion id="services" label="Aide & services" onToggle={toggleSection} open={openSection === "services"}>
          {serviceGroups.map((group) => (
            <div className={`client-mobile-service-group ${group.emphasized ? "is-emphasized" : ""}`} key={group.title}>
              <strong>{group.title}</strong>
              {group.links.map((link) => (
                <MobileNavLink key={`${link.to}-${link.label}`} onClose={onClose} to={link.to}>
                  {link.label}
                </MobileNavLink>
              ))}
            </div>
          ))}
        </MobileAccordion>

        {!isAdmin ? (
          <div className="client-mobile-nav-group">
            <span>Mes achats</span>
            <MobileNavLink onClose={onClose} to="/wishlist">
              Ma wishlist {wishlistCount > 0 ? `(${wishlistCount})` : ""}
            </MobileNavLink>
            <MobileNavLink onClose={onClose} to="/cart">
              Mon panier {cartCount > 0 ? `(${cartCount})` : ""}
            </MobileNavLink>
          </div>
        ) : null}

        <div className="client-mobile-nav-group">
          <span>{isAuthenticated ? "Mon compte" : "Espace membre"}</span>
          {isAuthenticated ? (
            isAdmin ? (
              <>
                <MobileNavLink onClose={onClose} to="/admin/dashboard">Tableau de bord admin</MobileNavLink>
                <MobileNavLink onClose={onClose} to="/">Voir la boutique</MobileNavLink>
                <MobileNavLink onClose={onClose} to="/profile">Profil</MobileNavLink>
                <button type="button" onClick={logoutAndClose}>Déconnexion</button>
              </>
            ) : (
              <>
                <MobileNavLink onClose={onClose} to="/profile">Profil</MobileNavLink>
                <MobileNavLink onClose={onClose} to="/orders">Mes commandes</MobileNavLink>
                <MobileNavLink onClose={onClose} to="/return-policy">Mes retours</MobileNavLink>
                <MobileNavLink onClose={onClose} to="/support">Support</MobileNavLink>
                <button type="button" onClick={logoutAndClose}>Déconnexion</button>
              </>
            )
          ) : (
            <>
              <MobileNavLink onClose={onClose} to="/login">Connexion</MobileNavLink>
              <MobileNavLink onClose={onClose} to="/register">Créer un compte</MobileNavLink>
            </>
          )}
        </div>
      </nav>
    </aside>
  );
}
