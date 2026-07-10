import {
  formatReviewDate,
  renderReviewStars,
} from "../../hooks/useAdminReviews";
import ReviewStatusBadge from "./ReviewStatusBadge";
import { AsyncState } from "../ui";

export default function AdminReviewsTable({
  loading,
  onApprove,
  onDelete,
  onReject,
  reviews,
}) {
  return (
    <AsyncState
      empty={reviews.length === 0}
      emptyDescription="Les avis correspondant aux filtres apparaîtront ici."
      emptyTitle="Aucun avis trouvé"
      loading={loading}
      skeletonVariant="table"
    >
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
          {reviews.map((review) => (
            <tr key={review.id}>
              <td>
                <strong>{review.productName}</strong>
                <small className="admin-muted">{review.orderNumber}</small>
              </td>
              <td>{review.customerName}</td>
              <td className="review-stars">{renderReviewStars(review.rating)}</td>
              <td className="review-comment-cell">{review.comment}</td>
              <td><ReviewStatusBadge status={review.status} /></td>
              <td>{review.verifiedPurchase ? "Yes" : "No"}</td>
              <td>{formatReviewDate(review.createdAt)}</td>
              <td>
                <div className="table-actions review-actions">
                  <button type="button" onClick={() => onApprove(review.id)} disabled={review.status === "APPROVED"}>
                    Approve
                  </button>
                  <button type="button" onClick={() => onReject(review.id)} disabled={review.status === "REJECTED"}>
                    Reject
                  </button>
                  <button type="button" onClick={() => onDelete(review.id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </AsyncState>
  );
}
