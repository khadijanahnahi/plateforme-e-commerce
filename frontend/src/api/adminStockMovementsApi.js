import http from "./http";

function toDateTime(value, endOfDay = false) {
  if (!value) return undefined;
  return `${value}T${endOfDay ? "23:59:59" : "00:00:00"}`;
}

export const adminStockMovementsApi = {
  getMovements(filters = {}) {
    return http.get("/admin/stock-movements", {
      params: {
        productId: filters.productId || undefined,
        movementType: filters.movementType || undefined,
        orderId: filters.orderId || undefined,
        dateFrom: toDateTime(filters.dateFrom),
        dateTo: toDateTime(filters.dateTo, true),
      },
    });
  },

  getProductMovements(productId) {
    return http.get(`/admin/products/${productId}/stock-movements`);
  },

  getProducts() {
    return http.get("/admin/products");
  },
};
