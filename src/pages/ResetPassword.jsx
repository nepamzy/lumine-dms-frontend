import { useState, useId, cloneElement } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";
import Seo from "../components/Seo";

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const { completePasswordReset } = useAuth();
  const resetToken = location.state?.resetToken;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!resetToken) {
    return (
      <div className="max-w-sm mx-auto px-6 py-16 text-center">
        <Seo title="Reset Password" description="Choose a new password for your account." path="/reset-password" />
        <p className="text-navy-900/70 text-sm mb-4">This reset session is no longer valid.</p>
        <Link to="/forgot-password" className="text-navy-800 font-semibold underline">
          Start over
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      const user = await completePasswordReset(resetToken, newPassword);
      const dest = user.role === "admin" ? "/admin" : user.role === "distributor" ? "/distributor" : "/catalog";
      navigate(dest);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't reset your password. Try requesting a new code.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <Seo title="Reset Password" description="Choose a new password for your account." path="/reset-password" />
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-1">Set a new password</h1>
      <p className="text-navy-900/70 text-sm mb-8">Your identity's confirmed — no need for your old password.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="New password">
          <PasswordInput
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm new password">
          <PasswordInput
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>

        {error && <p className="text-status-danger text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-navy-800 text-cream-50 font-bold text-sm py-3 rounded-md hover:bg-gold-500 hover:text-navy-900 transition-colors disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Reset Password & Sign In"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-xs font-semibold text-navy-900/70 block mb-1">
        {label}
      </label>
      {cloneElement(children, { id })}
    </div>
  );
}
