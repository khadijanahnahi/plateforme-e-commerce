import http from "./http";

export const adminProductsApi = {
  getProducts(search = "") {
    return http.get("/admin/products", {
      params: { search: search || undefined },
    });
  },

  getCategories() {
    return http.get("/admin/categories");
  },

  createProduct(payload) {
    return http.post("/admin/products", payload);
  },

  updateProduct(id, payload) {
    return http.put(`/admin/products/${id}`, payload);
  },

  archiveProduct(id) {
    return http.delete(`/admin/products/${id}`);
  },

  deleteProduct(id) {
    return http.delete(`/admin/products/${id}/permanent`);
  },

  updateStock(id, stockQuantity) {
    return http.patch(`/admin/products/${id}/stock`, { stockQuantity });
  },

  uploadProductImage(formData) {
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
