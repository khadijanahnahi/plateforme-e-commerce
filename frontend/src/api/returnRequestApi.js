import http from "./http";

export const returnRequestApi = {
  getEligibleItems() {
    return http.get("/return-requests/eligible-items");
  },

  getMyRequests() {
    return http.get("/return-requests");
  },

  create(payload) {
    return http.post("/return-requests", payload);
  },

  cancel(id) {
    return http.patch(`/return-requests/${id}/cancel`);
  },
};
