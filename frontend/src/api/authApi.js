import http from "./http";

export const authApi = {
  login(payload) {
    return http.post("/auth/login", payload);
  },

  register(payload) {
    return http.post("/auth/register", payload);
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
