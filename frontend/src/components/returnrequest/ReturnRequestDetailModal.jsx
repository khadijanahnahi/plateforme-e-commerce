import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button, Select, Textarea } from "../ui";
import {
  formatReturnDate,
  returnReasonLabels,
  returnStatusLabels,
} from "../../hooks/useAdminReturnRequests";
import ReturnRequestStatusBadge from "./ReturnRequestStatusBadge";

const nextStatuses = {
  REQUESTED: ["REQUESTED", "UNDER_REVIEW", "APPROVED", "REJECTED", "CANCELLED"],
  UNDER_REVIEW: ["UNDER_REVIEW", "APPROVED", "REJECTED"],
  APPROVED: ["APPROVED", "RECEIVED", "CANCELLED"],
  RECEIVED: ["RECEIVED", "COMPLETED"],
  REJECTED: ["REJECTED"],
  COMPLETED: ["COMPLETED"],
  CANCELLED: ["CANCELLED"],
};

export default function ReturnRequestDetailModal({ loading, onClose, onSave, open, request }) {
  const [status, setStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");

  useEffect(() => {
    setStatus(request?.status ?? "");
    setAdminNote(request?.adminNote ?? "");
  }, [request]);

  useEffect(() => {
    if (!open) return undefined;
    function handleKeyDown(event) {
      if (event.key === "Escape" && !loading) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [loading, onClose, open]);

  if (!open || !request) return null;
  const options = nextStatuses[request.status] ?? [request.status];

  return createPortal(
    <div className="ui-dialog-backdrop admin-return-modal-backdrop" role="presentation" onMouseDown={() => !loading && onClose()}>
      <section className="admin-return-modal" role="dialog" aria-modal="true" aria-labelledby="admin-return-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div><span className="section-kicker">Demande #{request.id}</span><h2 id="admin-return-modal-title">Traiter le retour</h2></div>
          <button type="button" aria-label="Fermer" disabled={loading} onClick={onClose}>×</button>
        </header>

        <div className="admin-return-modal-summary">
          <div className="admin-return-modal-product">
            <span>{request.productImageUrl ? <img src={request.productImageUrl} alt="" /> : "—"}</span>
            <div><h3>{request.productName}</h3><p>{request.orderNumber} · Quantité {request.quantity}</p></div>
          </div>
          <ReturnRequestStatusBadge status={request.status} />
        </div>

        <dl className="admin-return-detail-grid">
          <div><dt>Client</dt><dd>{request.customerName}<small>{request.customerEmail}</small></dd></div>
          <div><dt>Date</dt><dd>{formatReturnDate(request.createdAt)}</dd></div>
          <div><dt>Motif</dt><dd>{returnReasonLabels[request.reason] ?? request.reason}</dd></div>
          <div><dt>Prix unitaire</dt><dd>{Number(request.unitPrice ?? 0).toFixed(2)} DH</dd></div>
        </dl>

        <div className="admin-return-customer-message">
          <span>Message du client</span>
          <p>{request.details}</p>
        </div>

        <div className="admin-return-controls">
          <Select label="Nouveau statut" value={status} onChange={(event) => setStatus(event.target.value)}>
            {options.map((value) => <option key={value} value={value}>{returnStatusLabels[value] ?? value}</option>)}
          </Select>
          <Textarea
            label="Réponse / note de traitement"
            maxLength={1000}
            rows={4}
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value)}
            placeholder="Instructions de retour ou motif de la décision…"
          />
        </div>

        <footer>
          <Button disabled={loading} variant="ghost" onClick={onClose}>Fermer</Button>
          <Button
            loading={loading}
            disabled={status === request.status && adminNote.trim() === (request.adminNote ?? "").trim()}
            onClick={() => onSave(request.id, status, adminNote)}
          >
            Enregistrer la décision
          </Button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
