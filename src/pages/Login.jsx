import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Seo from "../components/Seo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      const dest = user.role === "admin" ? "/admin" : user.role === "distributor" ? "/distributor" : "/catalog";
      navigate(dest);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't sign you in. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-6 py-16">
      <Seo title="Login" description="Sign in to your Lumine account." path="/login" />
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-1">Welcome back</h1>
      <p className="text-navy-900/70 text-sm mb-8">Sign in to your Lumine account.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="login-email" className="text-xs font-semibold text-navy-900/70 block mb-1">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-navy-900/15 rounded-md px-3 py-2.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="text-xs font-semibold text-navy-900/70 block mb-1">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-navy-900/15 rounded-md px-3 py-2.5 text-sm"
          />
        </div>

        {error && <p className="text-status-danger text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-navy-800 text-cream-50 font-bold text-sm py-3 rounded-md hover:bg-gold-500 hover:text-navy-900 transition-colors disabled:opacity-50"
        >
          {submitting ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="text-sm text-navy-900/70 mt-6">
        New to Lumine?{" "}
        <Link to="/register" className="text-navy-800 font-semibold underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
