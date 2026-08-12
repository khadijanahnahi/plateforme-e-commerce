import AdminReviewsTable from "../components/review/AdminReviewsTable";
import { reviewStatuses, useAdminReviews } from "../hooks/useAdminReviews";
import useFeedbackToast from "../hooks/useFeedbackToast";
import { Select } from "../components/ui";

export default function AdminReviewsPage() {
  const {
    error,
    loading,
    message,
    reviews,
    statusFilter,
    approveReview,
    deleteReview,
    rejectReview,
    updateStatusFilter,
  } = useAdminReviews();
  useFeedbackToast(message, error);

  return (
    <section className="page admin-page">
      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="admin-panel">
        <div className="admin-search admin-review-toolbar">
          <Select value={statusFilter} onChange={(event) => updateStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {reviewStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </Select>
        </div>

        <AdminReviewsTable
          loading={loading}
          onApprove={approveReview}
          onDelete={deleteReview}
          onReject={rejectReview}
          reviews={reviews}
        />
      </div>
    </section>
  );
}
