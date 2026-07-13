import http from "./http";

export const reviewApi = {
  getLatestVerified(limit = 6) {
    return http.get("/reviews/latest", { params: { limit } });
  },
};
