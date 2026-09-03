import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Reached only via the hidden tap gesture on the homepage — not linked
// from anywhere else. Verifies the account is actually an admin before
// letting the session stick; anything else gets logged straight back out.
export default function AdminLoginModal({ onClose }) {
  const { login, logout } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role !== "admin") {
        await logout();
        setError("This isn't an admin account.");
        setSubmitting(false);
        return;
      }
      navigate("/admin");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy-900/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-card max-w-xs w-full p-6">
        <h3 className="font-display font-bold text-lg text-navy-900 mb-4">Admin Login</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3" autoComplete="off">
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input"
            autoFocus
            autoComplete="off"
            name="admin-login-email"
          />
          <input
            required
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
            autoComplete="new-password"
            name="admin-login-password"
          />
          {error && <p className="text-status-danger text-xs">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-navy-800 text-cream-50 font-bold text-sm py-2.5 rounded-md disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign In"}
          </button>
          <button type="button" onClick={onClose} className="text-navy-900/70 text-xs">
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
