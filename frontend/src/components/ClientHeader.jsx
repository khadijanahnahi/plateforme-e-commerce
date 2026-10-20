import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import CategoriesMegaMenu from "./header/CategoriesMegaMenu";
import DesktopNavigation from "./header/DesktopNavigation";
import MegaMenu from "./header/MegaMenu";
import MobileNavigationDrawer from "./header/MobileNavigationDrawer";
import ServicesMegaMenu from "./header/ServicesMegaMenu";
import ShopMegaMenu from "./header/ShopMegaMenu";
import MobileProductSearchPanel from "./search/MobileProductSearchPanel";
import ProductSearchAutocomplete from "./search/ProductSearchAutocomplete";
import UserMenu from "./UserMenu";
import useHeaderCategories from "../hooks/useHeaderCategories";
import useMegaMenu from "../hooks/useMegaMenu";

function HeartIcon() {
  return (
    <svg className="client-action-icon client-heart-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg className="client-action-icon client-bag-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5.5 8.5h13l-.8 11H6.3l-.8-11Z" />
      <path d="M9 9V6.75a3 3 0 0 1 6 0V9" />
    </svg>
  );
}

export default function ClientHeader({
  cartCount,
  getProductNavClass,
  handleLogout,
  isAdmin,
  isAuthenticated,
  mobileMenuOpen,
  searchTerm,
  setMobileMenuOpen,
  setSearchTerm,
  wishlistCount,
}) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileMenuTriggerRef = useRef(null);
  const previousMobileMenuOpenRef = useRef(false);
  const mobileSearchTriggerRef = useRef(null);
  const {
    categories,
    error: categoriesError,
    isLoading: categoriesLoading,
    refetch: refetchCategories,
  } = useHeaderCategories();
  const {
    closeMenu: closeMegaMenu,
    openMenu,
    openMenuFromKeyboard,
    rootRef,
    toggleMenu,
  } = useMegaMenu();

  const closeMobileSearch = useCallback(() => {
    setMobileSearchOpen(false);
    window.requestAnimationFrame(() => mobileSearchTriggerRef.current?.focus());
  }, []);
  const handleMegaNavigate = useCallback(() => closeMegaMenu(false), [closeMegaMenu]);

  useEffect(() => {
    if (previousMobileMenuOpenRef.current && !mobileMenuOpen) {
      window.requestAnimationFrame(() => mobileMenuTriggerRef.current?.focus());
    }
    previousMobileMenuOpenRef.current = mobileMenuOpen;
  }, [mobileMenuOpen]);

  const mobileLayer = mobileMenuOpen && typeof document !== "undefined"
    ? createPortal(
        <>
          <button
            aria-label="Fermer le menu mobile"
            className="client-mobile-overlay"
            onClick={() => setMobileMenuOpen(false)}
            type="button"
          />
          <MobileNavigationDrawer
            cartCount={cartCount}
            categories={categories}
            categoriesError={categoriesError}
            categoriesLoading={categoriesLoading}
            handleLogout={handleLogout}
            isAdmin={isAdmin}
            isAuthenticated={isAuthenticated}
            onClose={() => setMobileMenuOpen(false)}
            onRetryCategories={refetchCategories}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            wishlistCount={wishlistCount}
          />
        </>,
        document.body,
      )
    : null;

  return (
    <header className="client-header" ref={rootRef}>
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
          Shop<span aria-hidden="true">•</span>Sphere
        </NavLink>

        <DesktopNavigation
          getProductNavClass={getProductNavClass}
          onOpenFromKeyboard={openMenuFromKeyboard}
          onToggle={toggleMenu}
          openMenu={openMenu}
        />

        <div className="client-actions">
          <ProductSearchAutocomplete
            className="client-desktop-search"
            onValueChange={setSearchTerm}
            placeholder="Rechercher un produit..."
            value={searchTerm}
          />

          <button
            aria-label="Ouvrir la recherche"
            className="client-icon-button client-mobile-search-toggle"
            onClick={() => {
              closeMegaMenu(false);
              setMobileMenuOpen(false);
              setMobileSearchOpen(true);
            }}
            ref={mobileSearchTriggerRef}
            type="button"
          >
            <svg className="client-action-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path d="m16 16 4 4" />
            </svg>
          </button>

          {!isAdmin ? (
            <NavLink
              aria-label={`Wishlist avec ${wishlistCount} produit${wishlistCount > 1 ? "s" : ""}`}
              className={({ isActive }) => `client-icon-button client-wishlist-button ${isActive ? "is-active" : ""} ${wishlistCount > 0 ? "has-items" : ""}`}
              to="/wishlist"
            >
              <HeartIcon />
              {isAuthenticated && wishlistCount > 0 ? <strong>{wishlistCount}</strong> : null}
            </NavLink>
          ) : null}

          {!isAdmin ? (
            <NavLink
              aria-label={`Panier avec ${cartCount} article${cartCount > 1 ? "s" : ""}`}
              className={({ isActive }) => `client-icon-button client-cart-button ${isActive ? "is-active" : ""} ${cartCount > 0 ? "has-items" : ""}`}
              to="/cart"
            >
              <BagIcon />
              {isAuthenticated && cartCount > 0 ? <strong>{cartCount}</strong> : null}
            </NavLink>
          ) : null}

          {isAuthenticated ? (
            <UserMenu isAdmin={isAdmin} onLogout={handleLogout} />
          ) : (
            <div className="client-auth-actions">
              <NavLink className="client-auth-button client-login-button" to="/login">Connexion</NavLink>
              <NavLink className="client-auth-button client-register-button" to="/register">Créer un compte</NavLink>
            </div>
          )}

          <button
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            className={`client-menu-toggle ${mobileMenuOpen ? "is-open" : ""}`}
            onClick={() => {
              closeMegaMenu(false);
              setMobileMenuOpen((current) => !current);
            }}
            ref={mobileMenuTriggerRef}
            type="button"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <MegaMenu id="shop" label="Navigation Boutique" open={openMenu === "shop"}>
        <ShopMegaMenu
          categories={categories}
          error={categoriesError}
          isLoading={categoriesLoading}
          onNavigate={handleMegaNavigate}
          onRetry={refetchCategories}
        />
      </MegaMenu>
      <MegaMenu id="categories" label="Navigation Catégories" open={openMenu === "categories"}>
        <CategoriesMegaMenu
          categories={categories}
          error={categoriesError}
          isLoading={categoriesLoading}
          onNavigate={handleMegaNavigate}
          onRetry={refetchCategories}
        />
      </MegaMenu>
      <MegaMenu id="services" label="Navigation Aide et services" open={openMenu === "services"}>
        <ServicesMegaMenu onNavigate={handleMegaNavigate} />
      </MegaMenu>
      {openMenu ? (
        <button
          aria-label="Fermer la navigation"
          className="client-mega-overlay"
          onClick={() => closeMegaMenu(false)}
          type="button"
        />
      ) : null}

      {mobileLayer}
      <MobileProductSearchPanel
        onClose={closeMobileSearch}
        onValueChange={setSearchTerm}
        open={mobileSearchOpen}
        value={searchTerm}
      />
    </header>
  );
}
