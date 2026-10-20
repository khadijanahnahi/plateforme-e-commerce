import http from "./http";

export const adminSettingsApi = {
  getSettings() {
    return http.get("/admin/settings");
  },

  updateSettings(payload) {
    return http.put("/admin/settings", payload);
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
