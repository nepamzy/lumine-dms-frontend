import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateLocation } from "../api/auth";

// Full-screen, non-dismissible gate for accounts that haven't granted
// location yet — either they signed up before this was required, or
// something went wrong capturing it at signup. Only Customers and Sales
// Reps are ever gated this way (true Distributors are exempt); the
// `needsLocationConsent` flag from /auth/me controls it, so this renders
// nothing for anyone else.
export default function LocationConsentGate() {
  const { user, refreshUser } = useAuth();
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState(null);

  if (!user || !user.needsLocationConsent) return null;

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
        } catch {
          setError("Couldn't save your location. Please try again.");
        } finally {
          setRequesting(false);
        }
      },
      () => {
        setError(
          "Location access was denied. Lumine requires this to continue — please allow location access in your browser's site settings and try again."
        );
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
          delivery and coverage information. Please allow location access to keep using your account.
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
