import http from "./http";
import { getAccessToken } from "./authTokenStore";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export const orderApi = {
  createOrder(payload) {
    return http.post("/orders", payload);
  },

  createDirectOrder(payload) {
    return http.post("/orders/direct", payload);
  },

  getMyOrders() {
    return http.get("/orders/my-orders");
  },

  getOrder(id) {
    return http.get(`/orders/${id}`);
  },

  getInvoiceInfo(orderId) {
    return http.get(`/orders/${orderId}/invoice/info`);
  },

  downloadInvoice(orderId) {
    return http.get(`/orders/${orderId}/invoice`, { responseType: "blob" });
  },

  validateCoupon(payload) {
    return http.post("/coupons/validate", payload);
  },

  validateDirectCoupon(payload) {
    return http.post("/coupons/validate-direct", payload);
  },
};

export async function streamMyOrderUpdates({ signal, onUpdate }) {
  const accessToken = getAccessToken();
  if (!accessToken) throw new Error("AUTH_REQUIRED");

  const response = await fetch(`${apiBaseUrl}/orders/stream`, {
    credentials: "include",
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${accessToken}`,
    },
    signal,
  });

  if (!response.ok || !response.body) {
    const error = new Error(`SSE_HTTP_${response.status}`);
    error.status = response.status;
    throw error;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (!signal.aborted) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r/g, "");
    let boundary = buffer.indexOf("\n\n");
    while (boundary >= 0) {
      parseOrderSseBlock(buffer.slice(0, boundary), onUpdate);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
    }
  }
}

function parseOrderSseBlock(block, onUpdate) {
  const lines = block.split("\n");
  const eventName = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
  const data = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");
  if (eventName !== "order-updated" || !data) return;
  try {
    onUpdate(JSON.parse(data));
  } catch {
    // A malformed event must not close the live connection.
  }
}
