import { useEffect, useRef, useState } from "react";

const LENGTH = 6;

// status: "idle" (red — waiting for input) | "verifying" (yellow — checking
// with the server) | "success" (green + checkmark) | "error" (red + shake,
// then the caller resets back to idle for a retry).
export default function OtpInput({ status = "idle", onComplete, resetKey }) {
  const [digits, setDigits] = useState(Array(LENGTH).fill(""));
  const inputRefs = useRef([]);

  useEffect(() => {
    setDigits(Array(LENGTH).fill(""));
    inputRefs.current[0]?.focus();
  }, [resetKey]);

  const focusInput = (i) => inputRefs.current[i]?.focus();

  const handleChange = (i, raw) => {
    const value = raw.replace(/\D/g, "");
    if (!value) {
      setDigits((d) => {
        const next = [...d];
        next[i] = "";
        return next;
      });
      return;
    }

    const chars = value.split("");
    setDigits((d) => {
      const next = [...d];
      let idx = i;
      for (const ch of chars) {
        if (idx >= LENGTH) break;
        next[idx] = ch;
        idx++;
      }
      if (next.every((c) => c !== "")) {
        onComplete(next.join(""));
      } else {
        setTimeout(() => focusInput(Math.min(idx, LENGTH - 1)), 0);
      }
      return next;
    });
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      focusInput(i - 1);
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LENGTH);
    if (!text) return;
    e.preventDefault();
    const next = text.split("");
    while (next.length < LENGTH) next.push("");
    setDigits(next);
    if (text.length === LENGTH) {
      onComplete(text);
    } else {
      focusInput(text.length);
    }
  };

  const stateClasses = {
    idle: "border-status-danger/50 bg-white text-navy-900",
    verifying: "border-status-warning bg-status-warning/10 text-navy-900",
    success: "border-status-success bg-status-success/10 text-status-success",
    error: "border-status-danger bg-status-danger/10 text-status-danger otp-shake",
  };

  return (
    <div>
      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <div
            key={i}
            className="otp-flip"
            data-status={status}
            style={{ transitionDelay: `${i * 60}ms`, animationDelay: `${i * 60}ms` }}
          >
            <input
              ref={(el) => (inputRefs.current[i] = el)}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              disabled={status === "verifying" || status === "success"}
              aria-label={`Digit ${i + 1} of ${LENGTH}`}
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-lg border-2 outline-none transition-colors duration-300 disabled:opacity-100 ${stateClasses[status]}`}
            />
          </div>
        ))}
      </div>

      {status === "success" && (
        <div className="flex justify-center mt-4 otp-pop-in">
          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-status-success text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        </div>
      )}
    </div>
  );
}
