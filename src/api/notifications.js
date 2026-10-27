import api from "./client";

export async function getPushPublicKey() {
  const { data } = await api.get("/notifications/push/vapid-public-key");
  return data.data; // { publicKey }
}

// endpoint-keyed upsert on the backend — safe to call repeatedly, and is
// exactly what silently rebinds an existing browser subscription to
// whichever user is currently logged in (see usePushNotifications).
export async function subscribeToPush({ endpoint, keys, userAgent }) {
  await api.post("/notifications/push/subscribe", { endpoint, keys, userAgent });
}

export async function unsubscribeFromPush(endpoint) {
  await api.post("/notifications/push/unsubscribe", { endpoint });
}

// One-time catch-up: re-pushes every order/signup alert on record to
// whichever admin device calls this, never to every admin automatically.
export async function replayAdminPushHistory() {
  const { data } = await api.post("/notifications/push/replay-admin-history");
  return data.data; // { count }
}
