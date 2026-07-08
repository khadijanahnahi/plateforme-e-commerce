import http from "./http";

export const adminApi = {
  getDashboardStats(params = {}) {
    return http.get("/admin/dashboard/stats", { params });
  },

  getProducts(params = {}) {
    return http.get("/admin/products", { params });
  },

  getCategories() {
    return http.get("/admin/categories");
  },

  getOrders() {
    return http.get("/admin/orders");
  },

  updateOrderStatus(orderId, payload) {
    return http.patch(`/admin/orders/${orderId}/status`, payload);
  },

  updatePaymentStatus(orderId, payload) {
    return http.patch(`/admin/orders/${orderId}/payment-status`, payload);
  },

  uploadProductImage(formData) {
    return http.post("/admin/uploads/product-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
