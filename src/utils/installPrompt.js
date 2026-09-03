import { useEffect, useState } from "react";

// beforeinstallprompt fires once, early, on Chrome/Edge/Android — it has to
// be captured at module load (not inside a component's useEffect), or a
// component that mounts after it fires would miss it entirely. iOS Safari
// never fires it at all; there's no programmatic install prompt there, only
// the manual "Add to Home Screen" instructions.
let deferredEvent = null;
let installed = false;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn());
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredEvent = e;
  notify();
});

window.addEventListener("appinstalled", () => {
  installed = true;
  deferredEvent = null;
  notify();
});

export const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
export const isStandalone =
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

// Shared reactive state so both the popup and the Navbar's persistent
// Install button reflect the same underlying captured event / installed
// state, without either needing to own it.
export function useInstallPrompt() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  const canInstall = isIOS ? !isStandalone : !!deferredEvent && !installed;

  const promptInstall = async () => {
    if (!deferredEvent) return null;
    deferredEvent.prompt();
    const { outcome } = await deferredEvent.userChoice;
    deferredEvent = null;
    notify();
    return outcome; // "accepted" | "dismissed"
  };

  return { canInstall, isIOS, isStandalone, promptInstall };
}
