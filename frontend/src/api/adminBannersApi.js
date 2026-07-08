import http from "./http";

export const adminBannersApi = {
  getBanners() {
    return http.get("/admin/banners");
  },

  getBannerById(id) {
    return http.get(`/admin/banners/${id}`);
  },

  createBanner(payload) {
    return http.post("/admin/banners", payload);
  },

  updateBanner(id, payload) {
    return http.put(`/admin/banners/${id}`, payload);
  },

  activateBanner(id) {
    return http.patch(`/admin/banners/${id}/activate`);
  },

  deactivateBanner(id) {
    return http.patch(`/admin/banners/${id}/deactivate`);
  },

  deleteBanner(id) {
    return http.delete(`/admin/banners/${id}`);
  },

  uploadBannerImage(formData) {
    return http.post("/admin/uploads/product-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
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
