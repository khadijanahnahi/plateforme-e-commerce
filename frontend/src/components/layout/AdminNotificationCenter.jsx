import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminNotifications } from "../../hooks/useAdminNotifications";

export default function AdminNotificationCenter() {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const {
    deviceSubscribed,
    disablePush,
    enablePush,
    loading,
    markAllRead,
    markRead,
    notifications,
    pushBusy,
    pushMessage,
    pushStatus,
    pushSupported,
    unreadCount,
  } = useAdminNotifications();

  useEffect(() => {
    if (!open) return undefined;
    function close(event) {
      if (!panelRef.current?.contains(event.target)) setOpen(false);
    }
    function closeOnEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  async function openNotification(notification) {
    await markRead(notification);
    setOpen(false);
    navigate(notification.actionUrl || "/admin/orders");
  }

  return (
    <div className="admin-notification-center" ref={panelRef}>
      <button
        className="admin-notification-trigger"
        type="button"
        aria-label={`Notifications admin${unreadCount ? `, ${unreadCount} non lues` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <BellIcon />
        {unreadCount > 0 ? <span>{unreadCount > 99 ? "99+" : unreadCount}</span> : null}
      </button>

      {open ? (
        <section className="admin-notification-panel" aria-label="Notifications admin">
          <div className="admin-notification-panel__header">
            <div>
              <small>ACTIVITE EN DIRECT</small>
              <h2>Notifications</h2>
            </div>
            {unreadCount > 0 ? (
              <button type="button" onClick={markAllRead}>Tout marquer comme lu</button>
            ) : null}
          </div>

          <div className="admin-notification-list">
            {loading ? <p className="admin-notification-state">Chargement...</p> : null}
            {!loading && notifications.length === 0 ? (
              <p className="admin-notification-state">Aucune notification pour le moment.</p>
            ) : null}
            {notifications.map((notification) => (
              <button
                className={`admin-notification-item ${notification.read ? "is-read" : "is-unread"}`}
                key={notification.id}
                type="button"
                onClick={() => openNotification(notification)}
              >
                <span className="admin-notification-item__marker" aria-hidden="true" />
                <span>
                  <strong>{notification.title}</strong>
                  <span>{notification.message}</span>
                  <time>{formatDate(notification.createdAt)}</time>
                </span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>

          <div className="admin-push-preferences">
            <div>
              <strong>Notifications sur cet appareil</strong>
              <span>{deviceSubscribed ? "Actives" : "Recevez les nouvelles commandes même hors du site."}</span>
            </div>
            {pushSupported && pushStatus.configured ? (
              <button
                type="button"
                disabled={pushBusy}
                onClick={deviceSubscribed ? disablePush : enablePush}
              >
                {pushBusy ? "Traitement..." : deviceSubscribed ? "Désactiver" : "Activer"}
              </button>
            ) : (
              <span className="admin-push-unavailable">
                {pushStatus.configured ? "Non pris en charge" : "Configuration serveur requise"}
              </span>
            )}
            {pushMessage ? <p>{pushMessage}</p> : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
    </svg>
  );
}

function formatDate(value) {
  if (!value) return "À l'instant";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
