import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { wishlistApi } from "../api/wishlistApi";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const wishlistProductIds = useMemo(() => {
    return new Set(items.map((item) => Number(item.productId)));
  }, [items]);

  const loadWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return [];
    }

    setLoading(true);
    try {
      const response = await wishlistApi.getWishlist();
      setItems(response.data);
      return response.data;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  function isWishlisted(productId) {
    return wishlistProductIds.has(Number(productId));
  }

  async function addToWishlist(productId) {
    await wishlistApi.addProduct(productId);
    return loadWishlist();
  }

  async function removeFromWishlist(productId) {
    await wishlistApi.removeProduct(productId);
    setItems((current) => current.filter((item) => Number(item.productId) !== Number(productId)));
  }

  async function toggleWishlist(productId) {
    if (isWishlisted(productId)) {
      await removeFromWishlist(productId);
      return false;
    }

    await addToWishlist(productId);
    return true;
  }

  useEffect(() => {
    loadWishlist().catch(() => setItems([]));
  }, [loadWishlist]);

  return (
    <WishlistContext.Provider
      value={{
        items,
        loading,
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
