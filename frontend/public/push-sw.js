self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data?.json() || {};
  } catch {
    payload = { body: "Une nouvelle activite requiert votre attention." };
  }

  event.waitUntil(self.registration.showNotification(
    payload.title || "ShopSphere Admin",
    {
      body: payload.body || "Une nouvelle commande a ete enregistree.",
      data: { url: payload.url || "/admin/orders" },
      tag: payload.tag || "shopsphere-admin",
      renotify: true,
    },
  ));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/admin/orders", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => client.url.startsWith(self.location.origin));
    if (existing) {
      await existing.navigate(targetUrl);
      return existing.focus();
    }
    return self.clients.openWindow(targetUrl);
  })());
});
