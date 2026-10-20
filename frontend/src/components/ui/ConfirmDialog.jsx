import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";

export default function ConfirmDialog({
  cancelLabel = "Annuler",
  confirmLabel = "Confirmer",
  description,
  loading = false,
  onClose,
  onConfirm,
  open,
  title = "Confirmer l’action",
  variant = "default",
}) {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    confirmButtonRef.current?.focus();
    function handleKeyDown(event) {
      if (event.key === "Escape" && !loading) onClose?.();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [loading, onClose, open]);

  if (!open) return null;

  return createPortal(
    <div className="ui-dialog-backdrop" role="presentation" onMouseDown={() => !loading && onClose?.()}>
      <div className="ui-dialog" role="alertdialog" aria-modal="true" aria-labelledby="ui-dialog-title" aria-describedby="ui-dialog-description" onMouseDown={(event) => event.stopPropagation()}>
        <div className={`ui-dialog-mark ui-dialog-mark-${variant}`} aria-hidden="true">{variant === "danger" ? "!" : "?"}</div>
        <h2 id="ui-dialog-title">{title}</h2>
        {description ? <p id="ui-dialog-description">{description}</p> : null}
        <div className="ui-dialog-actions">
          <Button disabled={loading} variant="ghost" onClick={onClose}>{cancelLabel}</Button>
          <Button ref={confirmButtonRef} loading={loading} variant={variant === "danger" ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
