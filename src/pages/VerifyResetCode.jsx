import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { verifyResetOtp, forgotPassword } from "../api/auth";
import OtpInput from "../components/OtpInput";
import Seo from "../components/Seo";

const RESEND_COOLDOWN_SECONDS = 120;

function formatCooldown(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function VerifyResetCode() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const [status, setStatus] = useState("idle"); // idle | verifying | success | error
  const [error, setError] = useState(null);
  const [resetKey, setResetKey] = useState(0);
  const [resending, setResending] = useState(false);
  // A code was just sent the moment this page was reached (from
  // ForgotPassword's submit) — the cooldown starts immediately, not only
  // after the first manual resend.
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!email) {
    return (
      <div className="max-w-sm mx-auto px-6 py-16 text-center">
        <Seo title="Verify Code" description="Enter the reset code sent to you." path="/verify-reset-code" />
        <p className="text-navy-900/70 text-sm mb-4">Start by requesting a reset code first.</p>
        <Link to="/forgot-password" className="text-navy-800 font-semibold underline">
          Forgot password
        </Link>
      </div>
    );
  }

  const handleComplete = async (code) => {
    setError(null);
    setStatus("verifying");
    try {
      const resetToken = await verifyResetOtp(email, code);
      setStatus("success");
      setTimeout(() => navigate("/reset-password", { state: { resetToken } }), 900);
    } catch (err) {
      setStatus("error");
      setError(err.response?.data?.message || "Incorrect code. Try again.");
      setTimeout(() => {
        setStatus("idle");
        setResetKey((k) => k + 1);
      }, 900);
    }
  };

  const handleResend = async () => {
    if (secondsLeft > 0) return;
    setResending(true);
    setError(null);
    try {
      await forgotPassword(email);
      setResetKey((k) => k + 1);
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch {
      setError("Couldn't resend the code. Try again shortly.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-16 text-center">
      <Seo title="Verify Code" description="Enter the reset code sent to you." path="/verify-reset-code" />
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-1">Enter your code</h1>
      <p className="text-navy-900/70 text-sm mb-8">
        We sent a 6-digit code to the email and phone on file for <strong>{email}</strong>.
      </p>

      <OtpInput status={status} onComplete={handleComplete} resetKey={resetKey} />

      {status === "success" && (
        <p className="text-status-success text-sm font-semibold mt-4">Code verified!</p>
      )}
      {error && <p className="text-status-danger text-sm mt-4">{error}</p>}

      <button
        type="button"
        onClick={handleResend}
        disabled={resending || secondsLeft > 0 || status === "verifying" || status === "success"}
        className="text-navy-800 text-sm font-semibold underline mt-8 disabled:opacity-50 disabled:no-underline"
      >
        {resending
          ? "Resending…"
          : secondsLeft > 0
          ? `Resend code in ${formatCooldown(secondsLeft)}`
          : "Didn't get a code? Resend"}
      </button>
    </div>
  );
}
