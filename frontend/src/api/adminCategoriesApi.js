import http from "./http";

export const adminCategoriesApi = {
  getCategories() {
    return http.get("/admin/categories");
  },

  createCategory(payload) {
    return http.post("/admin/categories", payload);
  },

  updateCategory(id, payload) {
    return http.put(`/admin/categories/${id}`, payload);
  },

  activateCategory(id) {
    return http.patch(`/admin/categories/${id}/activate`);
  },

  deactivateCategory(id) {
    return http.patch(`/admin/categories/${id}/deactivate`);
  },

  uploadCategoryImage(formData) {
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
