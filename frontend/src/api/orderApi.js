import http from "./http";

export const orderApi = {
  createOrder(payload) {
    return http.post("/orders", payload);
  },

  createDirectOrder(payload) {
    return http.post("/orders/direct", payload);
  },

  getMyOrders() {
    return http.get("/orders/my-orders");
  },

  getOrder(id) {
    return http.get(`/orders/${id}`);
  },

  getInvoiceInfo(orderId) {
    return http.get(`/orders/${orderId}/invoice/info`);
  },

  downloadInvoice(orderId) {
    return http.get(`/orders/${orderId}/invoice`, { responseType: "blob" });
  },

  validateCoupon(payload) {
    return http.post("/coupons/validate", payload);
  },

  validateDirectCoupon(payload) {
    return http.post("/coupons/validate-direct", payload);
  },
};
