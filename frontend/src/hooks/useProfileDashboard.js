import { useQuery } from "@tanstack/react-query";
import { orderApi } from "../api/orderApi";
import { useAuth } from "../contexts/AuthContext";
import { useWishlist } from "./useWishlist";

function shouldRetry(failureCount, error) {
  const status = error?.response?.status;
  if (status === 401 || status === 403) return false;
  return failureCount < 1;
}

export function useProfileDashboard() {
  const auth = useAuth();
  const wishlist = useWishlist();
  const roles = auth.user?.roles ?? [];
  const isAdmin = roles.some((role) => role === "ADMIN" || role === "ROLE_ADMIN");

  const ordersQuery = useQuery({
    enabled: auth.isAuthenticated && !isAdmin,
    queryKey: ["orders", "mine"],
    queryFn: async () => {
      const response = await orderApi.getMyOrders();
      return Array.isArray(response.data) ? response.data : [];
    },
    retry: shouldRetry,
  });

  return {
    ...auth,
    isAdmin,
    orders: ordersQuery.data ?? [],
    ordersError: ordersQuery.error?.response?.data?.message
      ?? (ordersQuery.error ? "Impossible de charger vos commandes." : ""),
    ordersLoading: ordersQuery.isLoading,
    refreshOrders: ordersQuery.refetch,
    wishlistError: wishlist.error,
    wishlistItems: wishlist.items,
    wishlistLoading: wishlist.loading,
    refreshWishlist: wishlist.loadWishlist,
    removeFromWishlist: wishlist.removeFromWishlist,
    isWishlistActionPending: wishlist.isWishlistActionPending,
  };
}
