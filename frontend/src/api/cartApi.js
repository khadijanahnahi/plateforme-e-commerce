import http from "./http";

export const cartApi = {
  getCart() {
    return http.get("/cart");
  },

  addItem(payload) {
    return http.post("/cart/items", payload);
  },

  updateItem(itemId, payload) {
    return http.put(`/cart/items/${itemId}`, payload);
  },

  removeItem(itemId) {
    return http.delete(`/cart/items/${itemId}`);
  },

  clearCart() {
    return http.delete("/cart");
  },
};
