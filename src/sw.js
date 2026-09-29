// Custom service worker (injectManifest strategy) — replaces the
// auto-generated one specifically so we can add push/notificationclick
// handlers. self.__WB_MANIFEST is filled in at build time by
// vite-plugin-pwa with the same precache list generateSW used to produce,
// so offline/update behavior is unchanged from before.
import { precacheAndRoute } from "workbox-precaching";

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Lumine", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Lumine";
  const options = {
    body: data.body || "",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: data.tag || "lumine-notification",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Focuses an already-open tab and navigates it, instead of always opening a
// new one — most people already have Lumine open in a tab somewhere.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
