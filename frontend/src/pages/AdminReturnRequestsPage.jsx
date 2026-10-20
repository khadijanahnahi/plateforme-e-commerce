import AdminReturnRequestsTable from "../components/returnrequest/AdminReturnRequestsTable";
import ReturnRequestDetailModal from "../components/returnrequest/ReturnRequestDetailModal";
import AdminStatsCard from "../components/ui/AdminStatsCard";
import { AsyncState, Button, Input, Select } from "../components/ui";
import {
  returnReasonLabels,
  returnReasons,
  returnStatusLabels,
  returnStatuses,
  useAdminReturnRequests,
} from "../hooks/useAdminReturnRequests";
import useFeedbackToast from "../hooks/useFeedbackToast";

export default function AdminReturnRequestsPage() {
  const {
    actionLoading,
    error,
    filteredRequests,
    filters,
    loading,
    message,
    requests,
    selectedRequest,
    stats,
    closeRequest,
    loadRequests,
    openRequest,
    resetFilters,
    updateFilter,
    updateStatus,
  } = useAdminReturnRequests();
  useFeedbackToast(message, error);

  return (
    <section className="page admin-page admin-return-requests-page">
      <div className="admin-return-page-heading">
        <div><span className="section-kicker">Service après-vente</span><h1>Demandes de retour</h1><p>Contrôlez l’éligibilité, communiquez les instructions et suivez chaque produit retourné.</p></div>
        <Button variant="outline" loading={loading} onClick={loadRequests}>Actualiser</Button>
      </div>

      <div className="admin-stats-grid">
        <AdminStatsCard label="Total" value={stats.total} />
        <AdminStatsCard label="À traiter" value={stats.pending} />
        <AdminStatsCard label="Acceptées / reçues" value={stats.approved} />
        <AdminStatsCard label="Finalisées" value={stats.completed} />
      </div>

      <div className="admin-panel admin-return-filters">
        <Input
          fullWidth
          label="Recherche"
          name="search"
          value={filters.search}
          onChange={updateFilter}
          placeholder="Client, email, commande ou produit…"
        />
        <Select label="Statut" name="status" value={filters.status} onChange={updateFilter}>
          <option value="">Tous les statuts</option>
          {returnStatuses.map((status) => <option key={status} value={status}>{returnStatusLabels[status]}</option>)}
        </Select>
        <Select label="Motif" name="reason" value={filters.reason} onChange={updateFilter}>
          <option value="">Tous les motifs</option>
          {returnReasons.map((reason) => <option key={reason} value={reason}>{returnReasonLabels[reason]}</option>)}
        </Select>
        <Button variant="outline" onClick={resetFilters}>Réinitialiser</Button>
      </div>

      <div className="admin-panel">
        <div className="admin-return-result-count">
          <span>{filteredRequests.length} sur {requests.length} demandes</span>
        </div>
        <AsyncState error={error} loading={false} onRetry={loadRequests}>
          <AdminReturnRequestsTable loading={loading} onOpen={openRequest} requests={filteredRequests} />
        </AsyncState>
      </div>

      <ReturnRequestDetailModal
        loading={actionLoading}
        onClose={closeRequest}
        onSave={updateStatus}
        open={Boolean(selectedRequest)}
        request={selectedRequest}
      />
    </section>
  );
}
