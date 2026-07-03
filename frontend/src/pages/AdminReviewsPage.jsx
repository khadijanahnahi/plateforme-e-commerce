import { useEffect, useState } from "react";
import http from "../api/http";

const reviewStatuses = ["PENDING", "APPROVED", "REJECTED"];

function formatDate(value) {
  return value ? new Date(value).toLocaleString() : "-";
}

function renderStars(rating) {
  const safeRating = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  return `${"★".repeat(safeRating)}${"☆".repeat(5 - safeRating)}`;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadReviews(status = statusFilter) {
    const response = await http.get("/admin/reviews", {
      params: status ? { status } : {},
    });
    setReviews(response.data);
  }

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const response = await http.get("/admin/reviews");
        if (mounted) {
          setReviews(response.data);
        }
      } catch (exception) {
        if (mounted) {
          setError(exception.response?.data?.message ?? "Unable to load reviews.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  async function handleStatusFilterChange(event) {
    const status = event.target.value;
    setStatusFilter(status);
    setError("");
    try {
      await loadReviews(status);
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Unable to filter reviews.");
    }
  }

  async function updateReview(id, action) {
    setMessage("");
    setError("");
    try {
      await http.patch(`/admin/reviews/${id}/${action}`);
      setMessage(action === "approve" ? "Review approved." : "Review rejected.");
      await loadReviews();
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Unable to update review.");
    }
  }

  async function deleteReview(id) {
    setMessage("");
    setError("");
    try {
      await http.delete(`/admin/reviews/${id}`);
      setMessage("Review deleted.");
      await loadReviews();
    } catch (exception) {
      setError(exception.response?.data?.message ?? "Unable to delete review.");
    }
  }

  return (
    <section className="page admin-page">
      <div className="admin-hero">
        <div>
          <span className="section-kicker">Admin moderation</span>
          <h1>Reviews</h1>
          <p>Moderer les avis produits verifies avant publication dans la boutique.</p>
        </div>
      </div>

      {message ? <div className="admin-alert admin-success">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="admin-panel">
        <div className="admin-search admin-review-toolbar">
          <select value={statusFilter} onChange={handleStatusFilterChange}>
            <option value="">All statuses</option>
            {reviewStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Customer</th>
                <th>Rating</th>
                <th>Comment</th>
                <th>Status</th>
                <th>Verified</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8">Loading reviews...</td></tr>
              ) : reviews.length === 0 ? (
                <tr><td colSpan="8">No reviews found.</td></tr>
              ) : reviews.map((review) => (
                <tr key={review.id}>
                  <td>
                    <strong>{review.productName}</strong>
                    <small className="admin-muted">{review.orderNumber}</small>
                  </td>
                  <td>{review.customerName}</td>
                  <td className="review-stars">{renderStars(review.rating)}</td>
                  <td className="review-comment-cell">{review.comment}</td>
                  <td><span className={`status-pill review-${review.status.toLowerCase()}`}>{review.status}</span></td>
                  <td>{review.verifiedPurchase ? "Yes" : "No"}</td>
                  <td>{formatDate(review.createdAt)}</td>
                  <td>
                    <div className="table-actions review-actions">
                      <button type="button" onClick={() => updateReview(review.id, "approve")} disabled={review.status === "APPROVED"}>
                        Approve
                      </button>
                      <button type="button" onClick={() => updateReview(review.id, "reject")} disabled={review.status === "REJECTED"}>
                        Reject
                      </button>
                      <button type="button" onClick={() => deleteReview(review.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
