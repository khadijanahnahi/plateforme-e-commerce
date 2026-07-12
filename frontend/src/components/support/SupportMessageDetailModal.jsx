import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Select, Textarea } from "../ui";
import SupportMessageStatusBadge from "./SupportMessageStatusBadge";
import {
  formatSupportMessageDate,
  supportMessageStatusLabels,
  supportMessageStatuses,
} from "../../hooks/useAdminSupportMessages";

export default function SupportMessageDetailModal({
  loading,
  message,
  onClose,
  onDelete,
  onSaveNote,
  onStatusChange,
  open,
}) {
  const [adminNote, setAdminNote] = useState("");
  const [nextStatus, setNextStatus] = useState("");

  useEffect(() => {
    setAdminNote(message?.adminNote ?? "");
    setNextStatus(message?.status ?? "");
  }, [message]);

  if (!open || !message) return null;

  return createPortal(
    <div className="ui-dialog-backdrop support-detail-backdrop" role="presentation" onMouseDown={() => !loading && onClose()}>
      <section className="support-detail-modal" role="dialog" aria-modal="true" aria-labelledby="support-detail-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="support-detail-header">
          <div>
            <span className="section-kicker">Message support</span>
            <h2 id="support-detail-title">{message.subject}</h2>
          </div>
          <button type="button" className="support-detail-close" onClick={onClose} disabled={loading} aria-label="Fermer">x</button>
        </header>

        <div className="support-detail-grid">
          <dl>
            <div><dt>Client</dt><dd>{message.fullName}</dd></div>
            <div><dt>Email</dt><dd>{message.email}</dd></div>
            <div><dt>Commande</dt><dd>{message.orderNumber || "-"}</dd></div>
            <div><dt>Date</dt><dd>{formatSupportMessageDate(message.createdAt)}</dd></div>
            <div><dt>Statut</dt><dd><SupportMessageStatusBadge status={message.status} /></dd></div>
          </dl>

          <div className="support-detail-message">
            <span>Message</span>
            <p>{message.message}</p>
          </div>
        </div>

        <div className="support-detail-controls">
          <Select label="Statut" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
            {supportMessageStatuses.map((status) => (
              <option key={status} value={status}>{supportMessageStatusLabels[status] ?? status}</option>
            ))}
          </Select>
          <Button
            disabled={nextStatus === message.status}
            loading={loading}
            onClick={() => onStatusChange(message.id, nextStatus)}
          >
            Mettre a jour
          </Button>
        </div>

        <Textarea
          label="Note interne"
          minLength={0}
          rows={5}
          value={adminNote}
          onChange={(event) => setAdminNote(event.target.value)}
          placeholder="Ajouter une note visible uniquement par l'administration..."
        />

        <div className="support-detail-actions">
          <Button disabled={loading} variant="danger" onClick={() => onDelete(message.id)}>Supprimer</Button>
          <Button loading={loading} onClick={() => onSaveNote(message.id, adminNote)}>Enregistrer la note</Button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
