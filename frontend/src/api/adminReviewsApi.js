import http from "./http";

export const adminReviewsApi = {
  getReviews(status = "") {
    return http.get("/admin/reviews", {
      params: status ? { status } : {},
    });
  },

  getReviewById(id) {
    return http.get(`/admin/reviews/${id}`);
  },

  approveReview(id) {
    return http.patch(`/admin/reviews/${id}/approve`);
  },

  rejectReview(id) {
    return http.patch(`/admin/reviews/${id}/reject`);
  },

  deleteReview(id) {
    return http.delete(`/admin/reviews/${id}`);
  },
};

export function getApiErrorMessage(exception, fallback) {
  return exception.response?.data?.message ?? exception.message ?? fallback;
}
