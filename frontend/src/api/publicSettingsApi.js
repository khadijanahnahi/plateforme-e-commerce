import http from "./http";

export const publicSettingsApi = {
  getSettings(config = {}) {
    return http.get("/settings/public", config);
  },
};
