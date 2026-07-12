import { AsyncState, Button } from "../ui";
import SupportMessageStatusBadge from "./SupportMessageStatusBadge";
import { formatSupportMessageDate } from "../../hooks/useAdminSupportMessages";

export default function AdminSupportMessagesTable({
  loading,
  messages,
  onOpen,
  onStatusChange,
}) {
  return (
    <AsyncState
      empty={messages.length === 0}
      emptyDescription="Les messages envoyes depuis la page Support apparaitront ici."
      emptyTitle="Aucun message support"
      loading={loading}
      skeletonVariant="table"
    >
      <div className="admin-table-wrap">
        <table className="admin-table admin-support-table">
          <thead>
            <tr>
              <th>Client</th>
              <th>Email</th>
              <th>Sujet</th>
              <th>Commande</th>
              <th>Date</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.fullName}</strong></td>
                <td><span className="admin-muted">{item.email}</span></td>
                <td>
                  <strong>{item.subject}</strong>
                  <small className="admin-muted support-message-preview">{item.message}</small>
                </td>
                <td>{item.orderNumber || <span className="admin-muted">-</span>}</td>
                <td>{formatSupportMessageDate(item.createdAt)}</td>
                <td><SupportMessageStatusBadge status={item.status} /></td>
                <td>
                  <div className="table-actions support-actions">
                    <Button size="sm" variant="outline" onClick={() => onOpen(item.id)}>Voir</Button>
                    <Button
                      disabled={item.status === "IN_PROGRESS"}
                      size="sm"
                      variant="ghost"
                      onClick={() => onStatusChange(item.id, "IN_PROGRESS")}
                    >
                      En cours
                    </Button>
                    <Button
                      disabled={item.status === "RESOLVED"}
                      size="sm"
                      variant="ghost"
                      onClick={() => onStatusChange(item.id, "RESOLVED")}
                    >
                      Resolu
                    </Button>
                    <Button
                      disabled={item.status === "ARCHIVED"}
                      size="sm"
                      variant="ghost"
                      onClick={() => onStatusChange(item.id, "ARCHIVED")}
                    >
                      Archiver
                    </Button>
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
