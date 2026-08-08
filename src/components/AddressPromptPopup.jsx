import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "../api/auth";

// Dismissible (has an X) — unlike LocationConsentGate, filling this in
// isn't mandatory to keep using the site, just strongly encouraged.
export default function AddressPromptPopup() {
  const { user, refreshUser } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  if (!user || !user.needsAddressPrompt || dismissed) return null;

  const handleSave = async () => {
    if (!address.trim()) {
      setError("Please enter an address, or tap the X to skip for now.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await updateProfile({ address });
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save your address. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-900/70 z-[90] flex items-center justify-center p-6">
      <div className="bg-white rounded-card max-w-sm w-full p-6 relative">
        <button
          onClick={() => setDismissed(true)}
          aria-label="Close"
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-navy-900/40 hover:text-navy-900 hover:bg-navy-900/5 transition-colors"
        >
          ✕
        </button>
        <h2 className="font-display font-bold text-lg text-navy-900 mb-2">Add your address</h2>
        <p className="text-sm text-navy-900/60 mb-4">
          We don't have a street address on file for your account yet — adding one helps admin and
          customers reach you accurately.
        </p>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          placeholder="Street address"
          className="input w-full mb-3"
        />
        {error && <p className="text-status-danger text-xs mb-3">{error}</p>}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-gold-500 text-navy-900 font-bold text-sm py-2.5 rounded-md hover:bg-gold-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
