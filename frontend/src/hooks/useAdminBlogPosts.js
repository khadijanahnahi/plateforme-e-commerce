import { useEffect, useState } from "react";
import { adminBlogApi, blogError } from "../api/adminBlogApi";

export default function useAdminBlogPosts() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ search: "", status: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load(nextPage = page, nextFilters = filters) {
    setLoading(true);
    setError("");
    try {
      const { data } = await adminBlogApi.getPosts({
        page: nextPage - 1,
        size: 12,
        search: nextFilters.search || undefined,
        status: nextFilters.status || undefined,
        sort: "updatedAt",
      });
      setPosts(data.content ?? []);
      setTotalPages(Math.max(1, data.totalPages ?? 1));
      setPage(nextPage);
    } catch (exception) {
      setError(blogError(exception, "Impossible de charger les articles."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); }, []);

  return { error, filters, loading, page, posts, totalPages, load, setFilters };
}
