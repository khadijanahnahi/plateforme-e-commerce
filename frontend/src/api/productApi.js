import http from "./http";

export const productApi = {
  getProducts(params = {}) {
    return http.get("/products", { params });
  },

  getProduct(id) {
    return http.get(`/products/${id}`);
  },

  getBestSellers(limit = 8) {
    return http.get("/products/best-sellers", { params: { limit } });
  },

  getCategories() {
    return http.get("/categories");
  },

  getProductReviews(productId) {
    return http.get(`/products/${productId}/reviews`);
  },

  getReviewEligibility(productId) {
    return http.get(`/products/${productId}/reviews/eligibility`);
  },

  createReview(productId, payload) {
    return http.post(`/products/${productId}/reviews`, payload);
  },
};
