import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AdminOrdersTable from "../components/order/AdminOrdersTable";
import AdminStatsCard from "../components/ui/AdminStatsCard";
import { ErrorState } from "../components/ui";
import {
  ADMIN_ORDERS_PAGE_SIZE,
  orderStatuses,
  paymentStatuses,
  useAdminOrders,
} from "../hooks/useAdminOrders";

export default function AdminOrdersPage() {
  const [searchParams] = useSearchParams();
  const {
    currentPage,
    error,
    filteredOrders,
    loading,
    message,
    paginatedOrders,
    paymentFilter,
    search,
    selectedStatuses,
    statusFilter,
    summary,
    totalPages,
    handleMarkAsPaid,
    handleUpdateStatus,
    isOrderActionPending,
    loadOrders,
    resetFilters,
    setCurrentPage,
    updatePaymentFilter,
    updateSearch,
    updateSelectedStatus,
    updateStatusFilter,
  } = useAdminOrders(searchParams.get("customer") ?? "");

  useEffect(() => {
    const customerQuery = searchParams.get("customer");
    if (customerQuery) {
      updateSearch(customerQuery);
    }
  }, [searchParams]);

  const firstShown = filteredOrders.length === 0 ? 0 : (currentPage - 1) * ADMIN_ORDERS_PAGE_SIZE + 1;
  const lastShown = Math.min(currentPage * ADMIN_ORDERS_PAGE_SIZE, filteredOrders.length);

  return (
    <section className="page admin-page">
      {message ? <div className="admin-alert admin-success">{message}</div> : null}
      {error ? <ErrorState description={error} onRetry={loadOrders} /> : null}

      <div className="admin-panel">
        <div className="admin-orders-summary">
          <AdminStatsCard label="Total Orders" value={summary.total} />
          <AdminStatsCard label="Pending" value={summary.pending} />
          <AdminStatsCard label="Delivered" value={summary.delivered} />
          <AdminStatsCard label="Unpaid" value={summary.unpaid} />
        </div>

        <div className="admin-search admin-orders-toolbar">
          <input
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Search by order number, customer name or phone"
          />
          <select value={statusFilter} onChange={(event) => updateStatusFilter(event.target.value)}>
            <option value="">All statuses</option>
            {orderStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <select value={paymentFilter} onChange={(event) => updatePaymentFilter(event.target.value)}>
            <option value="">All payments</option>
            {paymentStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <button className="button button-secondary" type="button" onClick={resetFilters}>Reset</button>
        </div>

        <AdminOrdersTable
          isActionPending={isOrderActionPending}
          loading={loading}
          onMarkAsPaid={handleMarkAsPaid}
          onSelectedStatusChange={updateSelectedStatus}
          onUpdateStatus={handleUpdateStatus}
          orders={paginatedOrders}
          selectedStatuses={selectedStatuses}
        />

        {!loading && filteredOrders.length > 0 ? (
          <div className="pagination-bar">
            <span>Showing {firstShown}-{lastShown} of {filteredOrders.length}</span>
            <div className="pagination-controls">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  className={page === currentPage ? "pagination-active" : ""}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
