const ADMIN_REALTIME_EVENT = "shopsphere:admin-realtime";

export function publishAdminRealtimeEvent(detail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(ADMIN_REALTIME_EVENT, { detail }));
}

export function subscribeAdminRealtime(listener) {
  if (typeof window === "undefined") return () => {};

  const handleEvent = (event) => listener(event.detail);
  window.addEventListener(ADMIN_REALTIME_EVENT, handleEvent);
  return () => window.removeEventListener(ADMIN_REALTIME_EVENT, handleEvent);
}
