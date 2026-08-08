import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateLocation, registerLocationStrike } from "../api/auth";

// Gates Customers, Sales Reps, AND Distributors behind a real, current
// check of their browser's actual geolocation permission — not just
// "did they ever grant it." Uses the Permissions API where available to
// silently check status in the background; only shows the blocking modal
// when permission is genuinely not granted right now. Each time that
// happens, it counts as a strike against the account (Sales
// Reps/Distributors only — repeatedly turning location off is treated as
// a policy violation, not just an inconvenience).
export default function LocationConsentGate() {
  const { user, refreshUser } = useAuth();
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState(null);
  const [permissionState, setPermissionState] = useState("checking"); // "checking" | "granted" | "needs-prompt"
  const [strikes, setStrikes] = useState(null);

  const isGatedRole = user && user.role !== "admin"; // customer, sales_rep, or distributor

  useEffect(() => {
    if (!isGatedRole) return;
    let cancelled = false;

    async function checkPermission() {
      if (!navigator.permissions || !navigator.permissions.query) {
        // Permissions API unsupported (older Safari, some browsers) —
        // fall back to just trying geolocation directly when needed.
        if (!cancelled) setPermissionState("needs-prompt");
        return;
      }
      try {
        const status = await navigator.permissions.query({ name: "geolocation" });
        if (cancelled) return;
        if (status.state === "granted") {
          setPermissionState("granted");
        } else {
          setPermissionState("needs-prompt");
        }
        // Keep watching — if the person revokes permission from browser
        // settings while the tab is open, catch that too.
        status.onchange = () => {
          setPermissionState(status.state === "granted" ? "granted" : "needs-prompt");
        };
      } catch {
        if (!cancelled) setPermissionState("needs-prompt");
      }
    }

    checkPermission();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Register a strike the moment we detect location isn't granted for a
  // Sales Rep or Distributor — once per detection, not on every render.
  useEffect(() => {
    if (permissionState !== "needs-prompt") return;
    if (!user || user.role === "customer" || user.role === "admin") return;
    registerLocationStrike()
      .then((r) => setStrikes(r.strikes))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissionState, user?.id]);

  if (!isGatedRole || permissionState !== "needs-prompt") return null;

  const roleLabel = user.role === "customer" ? "Customer" : user.distributor_type === "distributor" ? "Distributor" : "Sales Rep";

  const handleAllow = () => {
    setError(null);
    setRequesting(true);
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location access. Please try a different browser or device.");
      setRequesting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await updateLocation(pos.coords.latitude, pos.coords.longitude);
          await refreshUser();
          setPermissionState("granted");
        } catch {
          setError("Couldn't save your location. Please try again.");
        } finally {
          setRequesting(false);
        }
      },
      (geoErr) => {
        if (geoErr.code === 1) {
          setError(
            "Location was blocked for this site. Tap the lock/info icon next to the web address, find \"Location,\" set it to Allow, then try again."
          );
        } else if (geoErr.code === 3) {
          setError("Getting your location took too long. Please check your connection and try again.");
        } else {
          setError("Couldn't get your location right now. Please try again.");
        }
        setRequesting(false);
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="fixed inset-0 bg-navy-900/70 z-[100] flex items-center justify-center p-6">
      <div className="bg-white rounded-card max-w-sm w-full p-6 text-center">
        <h2 className="font-display font-bold text-lg text-navy-900 mb-2">Location access needed</h2>
        <p className="text-sm text-navy-900/60 mb-5">
          Location is mandatory on Lumine for {roleLabel}s. Tap below, then respond to your browser's
          own permission popup (it usually appears near the address bar). You can't continue using
          your account until it's on.
        </p>
        {error && <p className="text-status-danger text-xs mb-4">{error}</p>}
        <button
          onClick={handleAllow}
          disabled={requesting}
          className="bg-gold-500 text-navy-900 font-bold text-sm py-2.5 px-6 rounded-md hover:bg-gold-700 transition-colors disabled:opacity-50"
        >
          {requesting ? "Requesting…" : "Allow Location Access"}
        </button>
        {user.role !== "customer" && strikes != null && strikes > 0 && (
          <p className="mt-4 text-xs font-semibold text-status-danger bg-status-danger/10 rounded-md px-3 py-2">
            {strikes} out of 5 strikes. Continuous deactivation of location on this app will cause your
            account to be blocked/removed. Stop deactivating your location on this app.
          </p>
        )}
      </div>
    </div>
  );
}
