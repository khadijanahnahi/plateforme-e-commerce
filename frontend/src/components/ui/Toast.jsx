import { useEffect } from "react";

export default function Toast({ duration = 4000, message, onClose, open = true, type = "success" }) {
  useEffect(() => {
    if (!open || !duration || !onClose) return undefined;
    const timeoutId = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timeoutId);
  }, [duration, onClose, open]);

  if (!open || !message) return null;

  return (
    <div className={`ui-toast ui-toast-${type}`} role={type === "error" ? "alert" : "status"}>
      <span className="ui-toast-indicator" aria-hidden="true" />
      <p>{message}</p>
      {onClose ? <button aria-label="Fermer la notification" type="button" onClick={onClose}>×</button> : null}
    </div>
  );
}
