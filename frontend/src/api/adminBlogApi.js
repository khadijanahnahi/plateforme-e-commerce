import http from "./http";

export const adminBlogApi = {
  getPosts(params = {}) { return http.get("/admin/blog/posts", { params }); },
  getPost(id) { return http.get(`/admin/blog/posts/${id}`); },
  createPost(payload) { return http.post("/admin/blog/posts", payload); },
  updatePost(id, payload) { return http.put(`/admin/blog/posts/${id}`, payload); },
  deletePost(id) { return http.delete(`/admin/blog/posts/${id}`); },
  publishPost(id) { return http.patch(`/admin/blog/posts/${id}/publish`); },
  schedulePost(id, publishedAt) { return http.patch(`/admin/blog/posts/${id}/schedule`, { publishedAt }); },
  archivePost(id) { return http.patch(`/admin/blog/posts/${id}/archive`); },
  featurePost(id, featured) { return http.patch(`/admin/blog/posts/${id}/feature`, { featured }); },
  getCategories() { return http.get("/admin/blog/categories"); },
  createCategory(payload) { return http.post("/admin/blog/categories", payload); },
  updateCategory(id, payload) { return http.put(`/admin/blog/categories/${id}`, payload); },
  deleteCategory(id) { return http.delete(`/admin/blog/categories/${id}`); },
  getTags() { return http.get("/admin/blog/tags"); },
  createTag(payload) { return http.post("/admin/blog/tags", payload); },
  updateTag(id, payload) { return http.put(`/admin/blog/tags/${id}`, payload); },
  deleteTag(id) { return http.delete(`/admin/blog/tags/${id}`); },
  getProducts() { return http.get("/admin/products"); },
  uploadMedia(scope, file) {
    const body = new FormData();
    body.append("file", file);
    return http.post(`/admin/blog/media/${scope}`, body, { headers: { "Content-Type": "multipart/form-data" } });
  },
};

export function blogError(error, fallback = "Une erreur est survenue.") {
  const validation = error.response?.data?.validationErrors;
  return (validation && Object.values(validation).join(" ")) || error.response?.data?.message || fallback;
}
