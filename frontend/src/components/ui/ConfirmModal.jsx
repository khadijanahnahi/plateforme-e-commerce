import ConfirmDialog from "./ConfirmDialog";

export default function ConfirmModal({
  title = "Confirmer l'action",
  message,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onCancel,
  onConfirm,
  open,
}) {
  return (
    <ConfirmDialog
      cancelLabel={cancelLabel}
      confirmLabel={confirmLabel}
      description={message}
      open={open}
      title={title}
      onClose={onCancel}
      onConfirm={onConfirm}
    />
  );
}
