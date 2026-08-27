import { useEffect, useState } from "react";
import { adminReviewsApi, getApiErrorMessage } from "../api/adminReviewsApi";

export const reviewStatuses = ["PENDING", "APPROVED", "REJECTED"];

export function formatReviewDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

export function renderReviewStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return `${"\u2605".repeat(safeRating)}${"\u2606".repeat(5 - safeRating)}`;
}

export function useAdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refreshReviews(status = statusFilter) {
    const response = await adminReviewsApi.getReviews(status);
    setReviews(response.data);
    return response.data;
  }

  async function loadReviews() {
    setLoading(true);
    try {
      await refreshReviews("");
      setError("");
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de charger les avis."));
    } finally {
      setLoading(false);
    }
  }

  async function updateStatusFilter(status) {
    setStatusFilter(status);
    setError("");
    setLoading(true);
    try {
      await refreshReviews(status);
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de filtrer les avis."));
    } finally {
      setLoading(false);
    }
  }

  async function approveReview(id) {
    setMessage("");
    setError("");
    try {
      await adminReviewsApi.approveReview(id);
      setMessage("Review approved.");
      await refreshReviews();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de modifier l’avis."));
    }
  }

  async function rejectReview(id) {
    setMessage("");
    setError("");
    try {
      await adminReviewsApi.rejectReview(id);
      setMessage("Review rejected.");
      await refreshReviews();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de modifier l’avis."));
    }
  }

  async function deleteReview(id) {
    setMessage("");
    setError("");
    try {
      await adminReviewsApi.deleteReview(id);
      setMessage("Review deleted.");
      await refreshReviews();
    } catch (exception) {
      setError(getApiErrorMessage(exception, "Impossible de supprimer l’avis."));
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  return {
    error,
    loading,
    message,
    reviews,
    statusFilter,
    approveReview,
    deleteReview,
    rejectReview,
    setError,
    setMessage,
    updateStatusFilter,
  };
}
