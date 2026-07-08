import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { cartApi } from "../api/cartApi";
import { useAuth } from "./AuthContext";

const emptyCart = {
  items: [],
  totalAmount: 0,
  totalItems: 0,
};

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated) {
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
  }, [isAuthenticated]);

  const syncCart = useCallback((nextCart) => {
    setCart(nextCart ?? emptyCart);
    window.dispatchEvent(new Event("shopsphere-cart-updated"));
    return nextCart ?? emptyCart;
  }, []);

  async function addToCart(productId, quantity = 1) {
    const response = await cartApi.addItem({ productId, quantity });
    return syncCart(response.data);
  }

  async function updateCartItem(itemId, quantity) {
    const response = await cartApi.updateItem(itemId, { quantity });
    return syncCart(response.data);
  }

  async function removeCartItem(itemId) {
    const response = await cartApi.removeItem(itemId);
    return syncCart(response.data);
  }

  async function clearCart() {
    const response = await cartApi.clearCart();
    return syncCart(response.data);
  }

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
