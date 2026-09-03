import { useState } from "react";

const STORAGE_KEY = "lumine_cookie_consent";

function readStoredChoice() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// Persisted (unlike the site's other popups) — once the visitor picks
// Allow or Deny, this never shows again on this device. Allow actually
// grants Google Analytics consent (see index.html's gtag consent-mode
// setup); Deny leaves it off.
export default function CookieConsentPopup() {
  const [choice, setChoice] = useState(() => readStoredChoice());

  if (choice) return null;

  const decide = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // localStorage unavailable (private browsing, etc.) — the popup will
      // just reappear next visit, which is an acceptable fallback here.
    }
    if (value === "granted" && window.gtag) {
      window.gtag("consent", "update", { analytics_storage: "granted" });
    }
    setChoice(value);
    window.dispatchEvent(new Event("lumine:cookie-consent-decided"));
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] p-4 sm:p-6 flex justify-center">
      <div className="bg-white rounded-card shadow-card max-w-lg w-full p-5 flex flex-col sm:flex-row sm:items-center gap-4 border border-navy-900/10">
        <p className="text-sm text-navy-900/70 flex-1">
          We use cookies to understand how the site is used and improve it. You can allow or decline analytics
          cookies — either way, the site works the same.
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => decide("denied")}
            className="text-sm font-semibold text-navy-900/60 hover:text-navy-900 px-4 py-2.5 rounded-md transition-colors whitespace-nowrap"
          >
            Deny
          </button>
          <button
            onClick={() => decide("granted")}
            className="bg-gold-500 text-navy-900 font-bold text-sm px-5 py-2.5 rounded-md hover:bg-gold-700 transition-colors whitespace-nowrap"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
