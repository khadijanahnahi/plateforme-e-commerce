import http from "./http";

export const productApi = {
  getProducts(params = {}) {
    return http.get("/products", { params });
  },

  getProduct(id) {
    return http.get(`/products/${id}`);
  },

  searchProductSuggestions(query, limit = 6, signal) {
    const normalizedQuery = query?.trim() ?? "";
    if (normalizedQuery.length < 2) {
      return Promise.resolve({ data: [] });
    }

    return http.get("/products/search-suggestions", {
      params: { query: normalizedQuery, limit },
      signal,
    });
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
