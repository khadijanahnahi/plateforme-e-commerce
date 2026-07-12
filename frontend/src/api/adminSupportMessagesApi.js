import http from "./http";

function toDateTime(value, endOfDay = false) {
  if (!value) return undefined;
  return `${value}T${endOfDay ? "23:59:59" : "00:00:00"}`;
}

export const adminSupportMessagesApi = {
  getMessages(filters = {}) {
    return http.get("/admin/support-messages", {
      params: {
        status: filters.status || undefined,
        search: filters.search || undefined,
        dateFrom: toDateTime(filters.dateFrom),
        dateTo: toDateTime(filters.dateTo, true),
      },
    });
  },

  getMessageById(id) {
    return http.get(`/admin/support-messages/${id}`);
  },

  updateStatus(id, status) {
    return http.patch(`/admin/support-messages/${id}/status`, { status });
  },

  updateNote(id, adminNote) {
    return http.patch(`/admin/support-messages/${id}/note`, { adminNote });
  },

  deleteMessage(id) {
    return http.delete(`/admin/support-messages/${id}`);
  },
};

export function getAdminSupportError(exception, fallback = "Impossible de charger les messages support.") {
  return exception.response?.data?.message ?? exception.message ?? fallback;
}
