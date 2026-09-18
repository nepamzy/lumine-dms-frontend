import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { forgotPassword } from "../api/auth";
import Seo from "../components/Seo";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword(email);
      navigate("/verify-reset-code", { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <Seo title="Forgot Password" description="Reset your Lumine account password." path="/forgot-password" />
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-1">Forgot your password?</h1>
      <p className="text-navy-900/70 text-sm mb-8">
        Enter the email or phone number you signed up with. We'll send a reset code to whichever
        contact methods are on file.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="fp-email" className="text-xs font-semibold text-navy-900/70 block mb-1">
            Email or Phone
          </label>
          <input
            id="fp-email"
            type="text"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
          />
        </div>

        {error && <p className="text-status-danger text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-navy-800 text-cream-50 font-bold text-sm py-3 rounded-md hover:bg-gold-500 hover:text-navy-900 transition-colors disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Send Reset Code"}
        </button>
      </form>

      <p className="text-sm text-navy-900/70 mt-6">
        Remembered your password?{" "}
        <Link to="/login" className="text-navy-800 font-semibold underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
