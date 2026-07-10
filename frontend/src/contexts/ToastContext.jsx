import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import Toast from "../components/ui/Toast";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, options = {}) => {
    if (!message) return null;

    const id = ++nextId.current;
    setToasts((current) => [
      ...current.slice(-3),
      { id, duration: options.duration ?? 4000, message, type: options.type ?? "success" },
    ]);
    return id;
  }, []);

  const value = useMemo(() => ({
    dismissToast,
    showToast,
    success: (message, options) => showToast(message, { ...options, type: "success" }),
    error: (message, options) => showToast(message, { ...options, type: "error" }),
    warning: (message, options) => showToast(message, { ...options, type: "warning" }),
    info: (message, options) => showToast(message, { ...options, type: "info" }),
  }), [dismissToast, showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="ui-toast-stack" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <Toast
            duration={toast.duration}
            key={toast.id}
            message={toast.message}
            onClose={() => dismissToast(toast.id)}
            type={toast.type}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToastContext must be used inside ToastProvider.");
  return context;
}
