import http from "./http";

export const adminReturnRequestsApi = {
  getAll() {
    return http.get("/admin/return-requests");
  },

  updateStatus(id, status, adminNote) {
    return http.patch(`/admin/return-requests/${id}/status`, { status, adminNote });
  },
};

export function getAdminReturnError(error, fallback = "Impossible de charger les demandes de retour.") {
  return error?.response?.data?.message ?? error?.message ?? fallback;
}
