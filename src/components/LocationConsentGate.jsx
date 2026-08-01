import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateLocation } from "../api/auth";

// Full-screen, non-dismissible gate that re-asks Customers and Sales Reps
// for location on every fresh page load — deliberately NOT remembered
// across refreshes. `grantedThisLoad` is plain component state, so a
// browser refresh remounts the whole app and resets it to false again,
// forcing the prompt every time. True Distributors are exempt.
export default function LocationConsentGate() {
  const { user, refreshUser } = useAuth();
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState(null);
  const [grantedThisLoad, setGrantedThisLoad] = useState(false);

  const isGatedRole = user && (user.role === "customer" || user.distributor_type === "sales_rep");
  if (!isGatedRole || grantedThisLoad) return null;

  const roleLabel = user.role === "customer" ? "Customer" : "Sales Rep";

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
          setGrantedThisLoad(true); // holds until the next actual page refresh
        } catch {
          setError("Couldn't save your location. Please try again.");
        } finally {
          setRequesting(false);
        }
      },
      (geoErr) => {
        if (geoErr.code === 1) {
          // PERMISSION_DENIED — browsers won't re-show their own popup once
          // blocked; the only fix is the person changing it themselves in
          // their browser's site settings, so we point them there directly.
          setError(
            "Location was blocked for this site. To fix it: tap the lock/info icon next to the web address, find \"Location,\" and set it to Allow — then try again."
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
          As a {roleLabel} on Lumine, we need your location to continue — it's used to show accurate
          delivery and coverage information. Tap below, then respond to your browser's own permission
          popup (it usually appears near the address bar).
        </p>
        {error && <p className="text-status-danger text-xs mb-4">{error}</p>}
        <button
          onClick={handleAllow}
          disabled={requesting}
          className="bg-gold-500 text-navy-900 font-bold text-sm py-2.5 px-6 rounded-md hover:bg-gold-700 transition-colors disabled:opacity-50"
        >
          {requesting ? "Requesting…" : "Allow Location Access"}
        </button>
      </div>
    </div>
  );
}
