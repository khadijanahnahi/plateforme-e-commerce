import http from "./http";

export const wishlistApi = {
  getWishlist() {
    return http.get("/wishlist");
  },

  addProduct(productId) {
    return http.post(`/wishlist/${productId}`);
  },

  removeProduct(productId) {
    return http.delete(`/wishlist/${productId}`);
  },

  exists(productId) {
    return http.get(`/wishlist/${productId}/exists`);
  },
};
