import http from "./http";

export const adminDashboardApi = {
  getStats(period = "all") {
    return http.get("/admin/dashboard/stats", {
      params: { period },
    });
  },

  async getOverview(period = "all") {
    const requests = await Promise.allSettled([
      this.getStats(period),
      http.get("/admin/orders"),
      http.get("/admin/products"),
      http.get("/admin/reviews", { params: { status: "PENDING" } }),
      http.get("/admin/customers"),
      http.get("/admin/settings"),
    ]);

    const [statsResult, ordersResult, productsResult, reviewsResult, customersResult, settingsResult] = requests;
    if (statsResult.status === "rejected") {
      throw statsResult.reason;
    }

    const unavailableSections = [];
    if (ordersResult.status === "rejected") unavailableSections.push("commandes");
    if (productsResult.status === "rejected") unavailableSections.push("stock");
    if (reviewsResult.status === "rejected") unavailableSections.push("avis");
    if (customersResult.status === "rejected") unavailableSections.push("clients");

    return {
      stats: statsResult.value.data,
      orders: ordersResult.status === "fulfilled" ? ordersResult.value.data : [],
      products: productsResult.status === "fulfilled" ? productsResult.value.data : [],
      reviews: reviewsResult.status === "fulfilled" ? reviewsResult.value.data : [],
      customers: customersResult.status === "fulfilled" ? customersResult.value.data : null,
      settings: settingsResult.status === "fulfilled" ? settingsResult.value.data : null,
      unavailableSections,
    };
  },
};

export function getApiErrorMessage(exception, fallback) {
  return exception.response?.data?.message ?? exception.message ?? fallback;
}
