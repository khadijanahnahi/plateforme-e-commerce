import http from "./http";

export const adminOrdersApi = {
  getAdminOrders() {
    return http.get("/admin/orders");
  },

  getAdminOrderById(id) {
    return http.get(`/admin/orders/${id}`);
  },

  updateOrderStatus(id, status) {
    return http.patch(`/admin/orders/${id}/status`, { status });
  },

  updatePaymentStatus(id, paymentStatus) {
    return http.patch(`/admin/orders/${id}/payment-status`, { paymentStatus });
  },

  markAsPaid(id) {
    return http.patch(`/admin/orders/${id}/payment-status`, { paymentStatus: "PAID" });
  },

  downloadInvoice(id) {
    return http.get(`/admin/orders/${id}/invoice`, { responseType: "blob" });
  },
};
