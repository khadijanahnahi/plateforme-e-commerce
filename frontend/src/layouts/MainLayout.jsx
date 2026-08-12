import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import ClientHeader from "../components/ClientHeader";
import AuthHeader from "../components/layout/AuthHeader";
import ClientFooter from "../components/layout/ClientFooter";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../hooks/useCart";
import { useWishlist } from "../hooks/useWishlist";
import { useClientOrderRealtime } from "../hooks/useClientOrderRealtime";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = user?.roles?.some((role) => role === "ADMIN" || role === "ROLE_ADMIN");
  useClientOrderRealtime(isAuthenticated && !isAdmin);
  const isAuthEntryPage = location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = "";
      return undefined;
    }

    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileMenuOpen]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  function getProductNavClass(sortValue) {
    if (location.pathname !== "/products") {
      return undefined;
    }

    const currentSort = new URLSearchParams(location.search).get("sort");
    if (!sortValue && !currentSort) {
      return "active";
    }

    return currentSort === sortValue ? "active" : undefined;
  }

  return (
    <div className="app-shell">
      {isAuthEntryPage ? (
        <AuthHeader />
      ) : (
        <ClientHeader
          cartCount={cartCount}
          getProductNavClass={getProductNavClass}
          handleLogout={handleLogout}
          isAdmin={isAdmin}
          isAuthenticated={isAuthenticated}
          mobileMenuOpen={mobileMenuOpen}
          searchTerm={searchTerm}
          setMobileMenuOpen={setMobileMenuOpen}
          setSearchTerm={setSearchTerm}
          wishlistCount={wishlistCount}
        />
      )}
      <main>
        <Outlet />
      </main>
      <ClientFooter />
    </div>
  );
}
