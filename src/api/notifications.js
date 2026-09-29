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
