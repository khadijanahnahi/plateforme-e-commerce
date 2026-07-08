import AdminPageHeader from "../components/layout/AdminPageHeader";
import AdminReviewsTable from "../components/review/AdminReviewsTable";
import { reviewStatuses, useAdminReviews } from "../hooks/useAdminReviews";

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

  return (
    <section className="page admin-page">
      <AdminPageHeader
        kicker="Admin moderation"
        title="Reviews"
        description="Moderer les avis produits verifies avant publication dans la boutique."
      />

      {message ? <div className="admin-alert admin-success">{message}</div> : null}
      {error ? <div className="admin-alert">{error}</div> : null}

      <div className="admin-panel">
        <div className="admin-search admin-review-toolbar">
          <select value={statusFilter} onChange={(event) => updateStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {reviewStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
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
