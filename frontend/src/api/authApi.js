import http from "./http";

export const authApi = {
  login(payload) {
    return http.post("/auth/login", payload);
  },

  register(payload) {
    return http.post("/auth/register", payload);
  },

  refresh() {
    return http.post("/auth/refresh");
  },

  logout() {
    return http.post("/auth/logout");
  },

  forgotPassword(email) {
    return http.post("/auth/forgot-password", { email });
  },

  resetPassword(payload) {
    return http.post("/auth/reset-password", payload);
  },

  getProfile() {
    return http.get("/profile");
  },

  updateProfile(payload) {
    return http.put("/profile", payload);
  },

  updatePassword(payload) {
    return http.put("/profile/password", payload);
  },
};
