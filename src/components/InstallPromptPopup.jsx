import { useState, useEffect } from "react";
import { useInstallPrompt } from "../utils/installPrompt";

const STORAGE_KEY = "lumine_install_prompt";
const COOKIE_STORAGE_KEY = "lumine_cookie_consent";

function readStoredChoice() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function cookieChoiceMade() {
  try {
    return !!localStorage.getItem(COOKIE_STORAGE_KEY);
  } catch {
    return true; // localStorage unavailable — don't block this popup on it
  }
}

// Persisted independently of CookieConsentPopup — each popup remembers its
// own choice, so accepting/denying one has no effect on whether the other
// still shows.
export default function InstallPromptPopup() {
  const [choice, setChoice] = useState(() => readStoredChoice());
  const [waitingOnCookies, setWaitingOnCookies] = useState(() => !cookieChoiceMade());
  const { canInstall, isIOS, promptInstall } = useInstallPrompt();
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  useEffect(() => {
    if (!waitingOnCookies) return;
    const onDecided = () => setWaitingOnCookies(false);
    window.addEventListener("lumine:cookie-consent-decided", onDecided);
    return () => window.removeEventListener("lumine:cookie-consent-decided", onDecided);
  }, [waitingOnCookies]);

  if (choice || !canInstall || waitingOnCookies) return null;

  const decide = (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // localStorage unavailable — popup reappears next visit, acceptable fallback.
    }
    setChoice(value);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSSteps(true);
      return;
    }
    await promptInstall();
    decide("granted");
  };

  return (
    <div className="fixed inset-0 bg-navy-900/70 z-[95] flex items-center justify-center p-6">
      <div className="bg-white rounded-card max-w-sm w-full p-6 text-center relative">
        <button
          onClick={() => decide("denied")}
          aria-label="Close"
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full text-navy-900/40 hover:text-navy-900 hover:bg-navy-900/5 transition-colors"
        >
          ✕
        </button>

        {showIOSSteps ? (
          <>
            <h2 className="font-display font-bold text-lg text-navy-900 mb-2">Add Lumine to your Home Screen</h2>
            <ol className="text-sm text-navy-900/70 text-left mb-5 list-decimal list-inside flex flex-col gap-2">
              <li>Tap the Share button in Safari's toolbar</li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Tap "Add" in the top-right corner</li>
            </ol>
            <button
              onClick={() => decide("granted")}
              className="bg-gold-500 text-navy-900 font-bold text-sm py-2.5 px-6 rounded-md hover:bg-gold-700 transition-colors"
            >
              Got it
            </button>
          </>
        ) : (
          <>
            <h2 className="font-display font-bold text-lg text-navy-900 mb-2">Install Lumine</h2>
            <p className="text-sm text-navy-900/60 mb-5">
              Add Lumine to your phone or computer for quick access, straight from your home screen — no browser tab
              to find.
            </p>
            <button
              onClick={handleInstall}
              className="bg-gold-500 text-navy-900 font-bold text-sm py-2.5 px-6 rounded-md hover:bg-gold-700 transition-colors"
            >
              Install
            </button>
          </>
        )}
      </div>
    </div>
  );
}
