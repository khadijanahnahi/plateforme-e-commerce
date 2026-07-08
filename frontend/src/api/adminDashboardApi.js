import http from "./http";

export const adminDashboardApi = {
  getStats(period = "all") {
    return http.get("/admin/dashboard/stats", {
      params: { period },
    });
  },
};

export function getApiErrorMessage(exception, fallback) {
  return exception.response?.data?.message ?? exception.message ?? fallback;
}
