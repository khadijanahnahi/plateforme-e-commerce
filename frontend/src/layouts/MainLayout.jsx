import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import http from "../api/http";
import ClientHeader from "../components/ClientHeader";
import { useAuth } from "../contexts/AuthContext";

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = user?.roles?.some((role) => role === "ADMIN" || role === "ROLE_ADMIN");

  useEffect(() => {
    let mounted = true;

    async function loadCartCount() {
      if (!isAuthenticated) {
        setCartCount(0);
        return;
      }

      try {
        const response = await http.get("/cart");
        if (mounted) {
          setCartCount(response.data.totalItems ?? 0);
        }
      } catch {
        if (mounted) {
          setCartCount(0);
        }
      }
    }

    loadCartCount();
    window.addEventListener("shopsphere-cart-updated", loadCartCount);

    return () => {
      mounted = false;
      window.removeEventListener("shopsphere-cart-updated", loadCartCount);
    };
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    setCartCount(0);
    navigate("/login", { replace: true });
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const query = searchTerm.trim();
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : "/products");
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
      <ClientHeader
        cartCount={cartCount}
        getProductNavClass={getProductNavClass}
        handleLogout={handleLogout}
        handleSearchSubmit={handleSearchSubmit}
        isAdmin={isAdmin}
        isAuthenticated={isAuthenticated}
        mobileMenuOpen={mobileMenuOpen}
        searchTerm={searchTerm}
        setMobileMenuOpen={setMobileMenuOpen}
        setSearchTerm={setSearchTerm}
      />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
