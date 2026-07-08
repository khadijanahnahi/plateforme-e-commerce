import { useEffect, useMemo, useState } from "react";
import { adminCategoriesApi, getApiErrorMessage } from "../api/adminCategoriesApi";

export const emptyCategoryForm = {
  name: "",
  description: "",
  imageUrl: "",
  active: true,
};

export const categoryStatusFilters = ["ALL", "ACTIVE", "INACTIVE"];

export function useAdminCategories() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return categories.filter((category) => {
      const matchesSearch = !keyword
        || category.name?.toLowerCase().includes(keyword)
        || category.description?.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === "ALL"
        || (statusFilter === "ACTIVE" && category.active)
        || (statusFilter === "INACTIVE" && !category.active);

      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  async function refreshCategories() {
    const response = await adminCategoriesApi.getCategories();
    setCategories(response.data);
    return response.data;
  }

  async function loadCategories() {
    setLoading(true);
    try {
      await refreshCategories();
      setError("");
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to load categories."));
    } finally {
      setLoading(false);
    }
  }

  async function saveCategory(editingId, form) {
    setMessage("");
    setError("");

    try {
      if (editingId) {
        await adminCategoriesApi.updateCategory(editingId, form);
        setMessage("Category updated.");
      } else {
        await adminCategoriesApi.createCategory(form);
        setMessage("Category created.");
      }
      await refreshCategories();
      return true;
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to save category."));
      return false;
    }
  }

  async function changeCategoryStatus(category) {
    setMessage("");
    setError("");

    try {
      if (category.active) {
        await adminCategoriesApi.deactivateCategory(category.id);
        setMessage("Category deactivated.");
      } else {
        await adminCategoriesApi.activateCategory(category.id);
        setMessage("Category activated.");
      }
      await refreshCategories();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to update category status."));
    }
  }

  async function uploadCategoryImage(file) {
    if (!file) {
      return "";
    }

    const formData = new FormData();
    formData.append("file", file);

    setImageUploading(true);
    setMessage("");
    setError("");

    try {
      const response = await adminCategoriesApi.uploadCategoryImage(formData);
      setMessage("Category image uploaded.");
      return response.data.imageUrl;
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Unable to upload category image."));
      return "";
    } finally {
      setImageUploading(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("ALL");
  }

  useEffect(() => {
    loadCategories();
  }, []);

  return {
    categories,
    error,
    filteredCategories,
    imageUploading,
    loading,
    message,
    search,
    statusFilter,
    changeCategoryStatus,
    resetFilters,
    saveCategory,
    setError,
    setMessage,
    setSearch,
    setStatusFilter,
    uploadCategoryImage,
  };
}
