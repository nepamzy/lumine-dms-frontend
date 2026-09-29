import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getPushPublicKey, subscribeToPush, unsubscribeFromPush } from "../api/notifications";

// Browser push, tied to the LOGGED-IN ACCOUNT rather than just "this
// browser" — the subscribe endpoint is an upsert keyed by endpoint on the
// backend (see push_subscriptions migration), so re-subscribing here
// whenever permission is already "granted" is silent (no re-prompt) and
// just rebinds the same browser subscription to whichever user is
// currently logged in. That's the whole trick to it surviving logout and
// login, or even a different account logging into the same browser:
// nothing in this hook, or anywhere in the logout flow, ever calls
// pushManager.unsubscribe() — the browser-level permission grant and
// service worker subscription are left alone entirely; only the
// server-side row's owner changes.
export function usePushNotifications() {
  const { user } = useAuth();
  const supported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
  const [permission, setPermission] = useState(() =>
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const syncStatus = useCallback(async () => {
    if (!supported || !user) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setSubscribed(!!sub);
      if (sub) {
        const json = sub.toJSON();
        subscribeToPush({ endpoint: json.endpoint, keys: json.keys, userAgent: navigator.userAgent }).catch(() => {});
      }
    } catch {
      // Service worker not ready yet, or getSubscription failed — the
      // "Enable" button just stays available; not worth surfacing an error
      // for a background sync attempt.
    }
  }, [supported, user]);

  useEffect(() => {
    if (typeof Notification !== "undefined") setPermission(Notification.permission);
    syncStatus();
  }, [syncStatus]);

  const enable = useCallback(async () => {
    if (!supported) {
      setError("Push notifications aren't supported in this browser.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return;

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const { publicKey } = await getPushPublicKey();
        if (!publicKey) throw new Error("Push notifications aren't configured on the server yet.");
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }
      const json = sub.toJSON();
      await subscribeToPush({ endpoint: json.endpoint, keys: json.keys, userAgent: navigator.userAgent });
      setSubscribed(true);
    } catch (err) {
      setError(err.message || "Couldn't enable notifications.");
    } finally {
      setBusy(false);
    }
  }, [supported]);

  // Explicit opt-out only — never called automatically, logout included.
  const disable = useCallback(async () => {
    if (!supported) return;
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribeFromPush(sub.endpoint).catch(() => {});
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      setError(err.message || "Couldn't disable notifications.");
    } finally {
      setBusy(false);
    }
  }, [supported]);

  return { supported, permission, subscribed, busy, error, enable, disable };
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
