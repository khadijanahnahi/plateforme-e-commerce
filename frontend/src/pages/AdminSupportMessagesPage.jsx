import AdminStatsCard from "../components/ui/AdminStatsCard";
import AdminSupportMessagesTable from "../components/support/AdminSupportMessagesTable";
import SupportMessageDetailModal from "../components/support/SupportMessageDetailModal";
import { AsyncState, Button, Input, Select } from "../components/ui";
import {
  supportMessageStatusLabels,
  supportMessageStatuses,
  useAdminSupportMessages,
} from "../hooks/useAdminSupportMessages";
import useFeedbackToast from "../hooks/useFeedbackToast";

export default function AdminSupportMessagesPage() {
  const {
    actionLoading,
    detailLoading,
    error,
    filters,
    loading,
    message,
    messages,
    selectedMessage,
    stats,
    applyFilters,
    closeMessage,
    deleteMessage,
    loadMessages,
    openMessage,
    resetFilters,
    updateFilter,
    updateNote,
    updateStatus,
  } = useAdminSupportMessages();
  useFeedbackToast(message, error);

  return (
    <section className="page admin-page admin-support-messages-page">
      <div className="admin-stats-grid">
        <AdminStatsCard label="Total Messages" value={stats.total} />
        <AdminStatsCard label="New" value={stats.new} />
        <AdminStatsCard label="In Progress" value={stats.inProgress} />
        <AdminStatsCard label="Resolved" value={stats.resolved} />
      </div>

      <form className="admin-panel admin-support-filters" onSubmit={applyFilters}>
        <Input
          label="Search"
          name="search"
          value={filters.search}
          onChange={updateFilter}
          placeholder="Search by name, email, subject or order number..."
        />
        <Select label="Status" name="status" value={filters.status} onChange={updateFilter}>
          <option value="">All statuses</option>
          {supportMessageStatuses.map((status) => (
            <option key={status} value={status}>{supportMessageStatusLabels[status] ?? status}</option>
          ))}
        </Select>
        <Input label="Date de debut" name="dateFrom" type="date" value={filters.dateFrom} onChange={updateFilter} />
        <Input label="Date de fin" name="dateTo" type="date" value={filters.dateTo} onChange={updateFilter} />
        <div className="support-filter-actions">
          <Button loading={loading} type="submit">Filtrer</Button>
          <Button disabled={loading} variant="outline" onClick={resetFilters}>Reset</Button>
        </div>
      </form>

      <div className="admin-panel">
        <AsyncState error={error} loading={false} onRetry={loadMessages}>
          <AdminSupportMessagesTable
            loading={loading}
            messages={messages}
            onOpen={openMessage}
            onStatusChange={updateStatus}
          />
        </AsyncState>
      </div>

      <SupportMessageDetailModal
        loading={actionLoading || detailLoading}
        message={selectedMessage}
        onClose={closeMessage}
        onDelete={deleteMessage}
        onSaveNote={updateNote}
        onStatusChange={updateStatus}
        open={Boolean(selectedMessage)}
      />
    </section>
  );
}
