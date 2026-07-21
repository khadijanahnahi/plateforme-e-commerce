import http from "./http";

export const blogApi = {
  getPosts(params = {}) { return http.get("/blog/posts", { params }); },
  getPost(slug) { return http.get(`/blog/posts/${slug}`); },
  getFeatured(limit = 1) { return http.get("/blog/posts/featured", { params: { limit } }); },
  getLatest(limit = 3) { return http.get("/blog/posts/latest", { params: { limit } }); },
  getCategories() { return http.get("/blog/categories"); },
  getTags() { return http.get("/blog/tags"); },
};
