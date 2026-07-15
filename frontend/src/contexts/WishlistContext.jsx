import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { wishlistApi } from "../api/wishlistApi";
import { useAuth } from "./AuthContext";
import { useToastContext } from "./ToastContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const toast = useToastContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingProductIds, setPendingProductIds] = useState(new Set());
  const inFlightActions = useRef(new Map());

  const wishlistProductIds = useMemo(() => {
    return new Set(items.map((item) => Number(item.productId)));
  }, [items]);

  const loadWishlist = useCallback(async () => {
    const isAdmin = user?.roles?.some((role) => role === "ADMIN" || role === "ROLE_ADMIN");

    if (!isAuthenticated || isAdmin) {
      setItems([]);
      return [];
    }

    setLoading(true);
    setError("");
    try {
      const response = await wishlistApi.getWishlist();
      setItems(response.data);
      return response.data;
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Impossible de charger la wishlist.");
      throw exception;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  function isWishlisted(productId) {
    return wishlistProductIds.has(Number(productId));
  }

  const runLockedAction = useCallback((productId, action, successMessage) => {
    const key = Number(productId);
    if (inFlightActions.current.has(key)) return inFlightActions.current.get(key);

    const promise = (async () => {
      setPendingProductIds((current) => new Set(current).add(key));
      try {
        const result = await action();
        toast.success(successMessage);
        return result;
      } catch (exception) {
        toast.error(exception.response?.data?.message ?? "La wishlist n'a pas pu être mise à jour.");
        throw exception;
      } finally {
        inFlightActions.current.delete(key);
        setPendingProductIds((current) => {
          const next = new Set(current);
          next.delete(key);
          return next;
        });
      }
    })();

    inFlightActions.current.set(key, promise);
    return promise;
  }, [toast]);

  async function addToWishlist(productId) {
    return runLockedAction(productId, async () => {
      await wishlistApi.addProduct(productId);
      return loadWishlist();
    }, "Produit ajouté à la wishlist.");
  }

  async function removeFromWishlist(productId) {
    return runLockedAction(productId, async () => {
      await wishlistApi.removeProduct(productId);
      setItems((current) => current.filter((item) => Number(item.productId) !== Number(productId)));
    }, "Produit retiré de la wishlist.");
  }

  async function toggleWishlist(productId) {
    if (isWishlisted(productId)) {
      await removeFromWishlist(productId);
      return false;
    }

    await addToWishlist(productId);
    return true;
  }

  const isWishlistActionPending = useCallback(
    (productId) => pendingProductIds.has(Number(productId)),
    [pendingProductIds],
  );

  useEffect(() => {
    loadWishlist().catch(() => setItems([]));
  }, [loadWishlist]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        error,
        loading,
        pendingProductIds,
        isWishlistActionPending,
        wishlistCount: items.length,
        addToWishlist,
        isWishlisted,
        loadWishlist,
        removeFromWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlistContext() {
  const context = useContext(WishlistContext);

  if (!context) {
    throw new Error("useWishlistContext must be used inside WishlistProvider.");
  }

  return context;
}
