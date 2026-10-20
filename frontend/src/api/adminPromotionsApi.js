import http from "./http";

export const adminPromotionsApi = {
  getPromotions(params = {}) {
    return http.get("/admin/promotions", { params });
  },

  getPromotionById(id) {
    return http.get(`/admin/promotions/${id}`);
  },

  getProducts() {
    return http.get("/admin/products");
  },

  createPromotion(payload) {
    return http.post("/admin/promotions", payload);
  },

  updatePromotion(id, payload) {
    return http.put(`/admin/promotions/${id}`, payload);
  },

  activatePromotion(id) {
    return http.patch(`/admin/promotions/${id}/activate`);
  },

  deactivatePromotion(id) {
    return http.patch(`/admin/promotions/${id}/deactivate`);
  },

  expirePromotion(id) {
    return http.patch(`/admin/promotions/${id}/expire`);
  },

  deletePromotion(id) {
    return http.delete(`/admin/promotions/${id}`);
  },
};

export function getApiErrorMessage(exception, fallback) {
  const status = exception.response?.status;
  const data = exception.response?.data;
  const validationErrors = data?.validationErrors
    ? Object.values(data.validationErrors).filter(Boolean).join(" ")
    : "";
  const message = validationErrors || data?.message || exception.message || fallback;

  return status ? `${message} (HTTP ${status})` : message;
}
