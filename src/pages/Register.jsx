import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import STATE_LGAS from "../data/nigeria-states-lgas.json";

const NIGERIAN_STATES = Object.keys(STATE_LGAS);

const CUSTOMER_TYPES = [
  { value: "supermarket", label: "Supermarket" },
  { value: "retailer", label: "Retailer" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "hotel", label: "Hotel" },
  { value: "restaurant", label: "Restaurant" },
  { value: "wholesaler", label: "Wholesaler" },
  { value: "other", label: "Other" },
];

export default function Register() {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get("role");
  const defaultKind =
    roleParam === "distributor" || roleParam === "sales_rep" ? roleParam : "customer";

  const [kind, setKind] = useState(defaultKind); // "customer" | "sales_rep" | "distributor"
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    state: "Lagos",
    localGovernment: STATE_LGAS["Lagos"][0],
    businessName: "",
    customerType: "retailer",
    deliveryAddress: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const updateState = (e) => {
    const newState = e.target.value;
    setForm((f) => ({
      ...f,
      state: newState,
      localGovernment: STATE_LGAS[newState]?.[0] || "",
    }));
  };

  // Captures a distributor's referral code from ?ref=CODE in the signup link,
  // so the new customer auto-attaches to that distributor on creation.
  const referralCode = searchParams.get("ref") || null;

  const getLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve({ latitude: null, longitude: null });
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        () => resolve({ latitude: null, longitude: null }), // permission denied or failed — don't block signup
        { timeout: 8000 }
      );
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { latitude, longitude } = await getLocation();
      const role = kind === "customer" ? "customer" : "distributor";
      const distributorType = kind === "distributor" ? "distributor" : kind === "sales_rep" ? "sales_rep" : undefined;
      const result = await register({ ...form, role, distributorType, latitude, longitude, referralCode });
      setSuccess(result.message || "Account created. You can now sign in.");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong creating your account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-6 py-16">
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-1">Create your account</h1>
      <p className="text-navy-900/60 text-sm mb-6">
        Join Lumine as a customer, sales rep, or distributor.
      </p>

      {referralCode && (
        <div className="bg-green-500/10 border border-green-500/25 rounded-md px-4 py-3 mb-6 text-sm text-navy-900">
          You're signing up via a referral link. You'll be automatically linked to
          the person who shared it once your account is created.
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {[
          { value: "customer", label: "Customer" },
          { value: "sales_rep", label: "Sales Rep" },
          { value: "distributor", label: "Distributor" },
        ].map((k) => (
          <button
            key={k.value}
            type="button"
            onClick={() => setKind(k.value)}
            className={`flex-1 text-sm font-semibold py-2.5 rounded-md border transition-colors ${
              kind === k.value
                ? "bg-navy-800 text-cream-50 border-navy-800"
                : "bg-white text-navy-900/60 border-navy-900/15"
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Full name">
          <input required value={form.fullName} onChange={update("fullName")} className="input" />
        </Field>
        <Field label="Email">
          <input type="email" required value={form.email} onChange={update("email")} className="input" />
        </Field>
        <Field label="Phone">
          <input required value={form.phone} onChange={update("phone")} className="input" placeholder="08012345678" />
        </Field>
        <Field label="Password">
          <input type="password" required minLength={8} value={form.password} onChange={update("password")} className="input" />
        </Field>
        <Field label="State">
          <select value={form.state} onChange={updateState} className="input">
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Local Government Area">
          <select value={form.localGovernment} onChange={update("localGovernment")} className="input">
            {(STATE_LGAS[form.state] || []).map((lga) => (
              <option key={lga} value={lga}>{lga}</option>
            ))}
          </select>
        </Field>

        {kind === "customer" ? (
          <>
           <Field label="Business name (optional)">
            <input value={form.businessName} onChange={update("businessName")} className="input" />
          </Field>
            <Field label="Customer type">
              <select value={form.customerType} onChange={update("customerType")} className="input">
                {CUSTOMER_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Delivery address">
              <textarea required value={form.deliveryAddress} onChange={update("deliveryAddress")} className="input" rows={2} />
            </Field>
          </>
        ) : (
          <Field label="Business name">
            <input required value={form.businessName} onChange={update("businessName")} className="input" />
          </Field>
        )}

        {kind !== "customer" && (
          <p className="text-xs text-navy-900/50 bg-navy-900/5 rounded-md p-3">
            {kind === "distributor" ? "Distributor" : "Sales rep"} accounts require admin approval before you can sign in.
          </p>
        )}

        {error && <p className="text-status-danger text-sm">{error}</p>}
        {success && <p className="text-status-success text-sm">{success}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-gold-500 text-navy-900 font-bold text-sm py-3 rounded-md hover:bg-gold-700 transition-colors disabled:opacity-50"
        >
          {submitting ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="text-sm text-navy-900/60 mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-navy-800 font-semibold underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs font-semibold text-navy-900/70 block mb-1">{label}</label>
      {children}
    </div>
  );
}
