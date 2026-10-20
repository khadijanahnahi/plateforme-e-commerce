import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { cartApi } from "../api/cartApi";
import { useAuth } from "./AuthContext";
import { useToastContext } from "./ToastContext";

const emptyCart = {
  items: [],
  totalAmount: 0,
  totalItems: 0,
};

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated, user } = useAuth();
  const toast = useToastContext();
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);
  const [pendingActions, setPendingActions] = useState(new Set());
  const inFlightActions = useRef(new Map());

  const loadCart = useCallback(async () => {
    const isAdmin = user?.roles?.some((role) => role === "ADMIN" || role === "ROLE_ADMIN");

    if (!isAuthenticated || isAdmin) {
      setCart(emptyCart);
      return emptyCart;
    }

    setLoading(true);
    try {
      const response = await cartApi.getCart();
      setCart(response.data);
      return response.data;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const syncCart = useCallback((nextCart) => {
    setCart(nextCart ?? emptyCart);
    window.dispatchEvent(new Event("shopsphere-cart-updated"));
    return nextCart ?? emptyCart;
  }, []);

  const runLockedAction = useCallback((key, action, successMessage) => {
    if (inFlightActions.current.has(key)) {
      return inFlightActions.current.get(key);
    }

    const promise = (async () => {
      setPendingActions((current) => new Set(current).add(key));
      try {
        const result = await action();
        if (successMessage) toast.success(successMessage);
        return result;
      } catch (exception) {
        toast.error(exception.response?.data?.message ?? "L'action sur le panier a échoué.");
        throw exception;
      } finally {
        inFlightActions.current.delete(key);
        setPendingActions((current) => {
          const next = new Set(current);
          next.delete(key);
          return next;
        });
      }
    })();

    inFlightActions.current.set(key, promise);
    return promise;
  }, [toast]);

  async function addToCart(productId, quantity = 1, variantId = null) {
    const actionKey = variantId ? `add:${productId}:${variantId}` : `add:${productId}`;
    return runLockedAction(actionKey, async () => {
      const response = await cartApi.addItem({ productId, variantId, quantity });
      return syncCart(response.data);
    }, "Produit ajouté au panier.");
  }

  async function updateCartItem(itemId, quantity) {
    return runLockedAction(`update:${itemId}`, async () => {
      const response = await cartApi.updateItem(itemId, { quantity });
      return syncCart(response.data);
    }, "Quantité mise à jour.");
  }

  async function removeCartItem(itemId) {
    return runLockedAction(`remove:${itemId}`, async () => {
      const response = await cartApi.removeItem(itemId);
      return syncCart(response.data);
    }, "Produit retiré du panier.");
  }

  async function clearCart() {
    return runLockedAction("clear", async () => {
      const response = await cartApi.clearCart();
      return syncCart(response.data);
    }, "Panier vidé.");
  }

  const isCartActionPending = useCallback((key) => pendingActions.has(key), [pendingActions]);

  useEffect(() => {
    loadCart().catch(() => setCart(emptyCart));
  }, [loadCart]);

  useEffect(() => {
    window.addEventListener("shopsphere-cart-updated", loadCart);
    return () => window.removeEventListener("shopsphere-cart-updated", loadCart);
  }, [loadCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount: cart.totalItems ?? 0,
        loading,
        pendingActions,
        isCartActionPending,
        loadCart,
        addToCart,
        updateCartItem,
        removeCartItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCartContext must be used inside CartProvider.");
  }

  return context;
}
