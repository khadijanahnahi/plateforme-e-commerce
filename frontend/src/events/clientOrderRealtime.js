const CLIENT_ORDER_REALTIME_EVENT = "shopsphere:client-order-realtime";

export function publishClientOrderUpdate(update) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CLIENT_ORDER_REALTIME_EVENT, { detail: update }));
}

export function subscribeClientOrderUpdates(listener) {
  if (typeof window === "undefined") return () => {};
  const handleEvent = (event) => listener(event.detail);
  window.addEventListener(CLIENT_ORDER_REALTIME_EVENT, handleEvent);
  return () => window.removeEventListener(CLIENT_ORDER_REALTIME_EVENT, handleEvent);
}

export function applyOrderUpdate(order, update) {
  if (!order || Number(order.id) !== Number(update?.orderId)) return order;
  return {
    ...order,
    status: update.status ?? order.status,
    paymentStatus: update.paymentStatus ?? order.paymentStatus,
    updatedAt: update.updatedAt ?? order.updatedAt,
  };
}
