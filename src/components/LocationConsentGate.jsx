import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateLocation } from "../api/auth";

// Dismissible (has an X) — encourages Customers, Sales Reps, and
// Distributors to share their location, but doesn't block use of the
// site if they decline or dismiss it. Shown once per session unless the
// account still has no location on file.
export default function LocationConsentGate() {
  const { user, refreshUser } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState(null);

  const isEligibleRole = user && user.role !== "admin"; // customer, sales_rep, or distributor

  if (!isEligibleRole || !user.needsLocationConsent || dismissed) return null;

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
      <div className="bg-white rounded-card max-w-sm w-full p-6 text-center relative">
        <button
          onClick={() => setDismissed(true)}
          aria-label="Close"
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-navy-900/40 hover:text-navy-900 hover:bg-navy-900/5 transition-colors"
        >
          ✕
        </button>
        <h2 className="font-display font-bold text-lg text-navy-900 mb-2">Share your location</h2>
        <p className="text-sm text-navy-900/60 mb-5">
          Adding your location helps us serve you better as a {roleLabel}, like assigning nearby deliveries and
          support faster. It's optional — tap the X to skip for now.
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
