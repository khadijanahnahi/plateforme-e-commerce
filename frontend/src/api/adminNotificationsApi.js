import http from "./http";
import { getAccessToken } from "./authTokenStore";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export async function getAdminNotifications(limit = 12) {
  const response = await http.get("/admin/notifications", { params: { limit } });
  return response.data;
}

export async function markAdminNotificationRead(id) {
  const response = await http.patch(`/admin/notifications/${id}/read`);
  return response.data;
}

export async function markAllAdminNotificationsRead() {
  await http.patch("/admin/notifications/read-all");
}

export async function getAdminPushStatus() {
  const response = await http.get("/admin/push-subscriptions/status");
  return response.data;
}

export async function subscribeAdminDevice(subscription, deviceName) {
  const serialized = subscription.toJSON();
  const response = await http.post("/admin/push-subscriptions", {
    endpoint: serialized.endpoint,
    keys: serialized.keys,
    deviceName,
  });
  return response.data;
}

export async function unsubscribeAdminDevice(endpoint) {
  await http.delete("/admin/push-subscriptions", { data: { endpoint } });
}

export async function streamAdminNotifications({ signal, onNotification }) {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("AUTH_REQUIRED");
  }

  const response = await fetch(`${apiBaseUrl}/admin/notifications/stream`, {
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
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      parseSseBlock(block, onNotification);
      boundary = buffer.indexOf("\n\n");
    }
  }
}

function parseSseBlock(block, onNotification) {
  const lines = block.split("\n");
  const eventName = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
  const data = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");

  if (eventName !== "notification" || !data) return;
  try {
    onNotification(JSON.parse(data));
  } catch {
    // Ignore malformed SSE messages and keep the connection alive.
  }
}
