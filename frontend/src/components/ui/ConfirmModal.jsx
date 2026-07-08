export default function ConfirmModal({
  title = "Confirmer l'action",
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onCancel,
  onConfirm,
  open,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <div className="modal-card confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h2 id="confirm-modal-title">{title}</h2>
        </div>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="button button-secondary" type="button" onClick={onCancel}>{cancelLabel}</button>
          <button className="button button-primary" type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
