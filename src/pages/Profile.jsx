import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateProfile, changePassword } from "../api/auth";

const NIGERIAN_STATES = [
  "Lagos", "Kaduna", "Abuja", "Rivers", "Oyo", "Kano", "Ogun", "Enugu", "Delta", "Other",
];

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [form, setForm] = useState({
    fullName: user?.full_name || "",
    phone: user?.phone || "",
    state: user?.state || "Lagos",
  });
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoError, setInfoError] = useState(null);
  const [infoSuccess, setInfoSuccess] = useState(null);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    setInfoError(null);
    setInfoSuccess(null);
    setSavingInfo(true);
    try {
      await updateProfile(form);
      await refreshUser();
      setInfoSuccess("Profile updated successfully.");
    } catch (err) {
      setInfoError(err.response?.data?.message || "Couldn't update your profile.");
    } finally {
      setSavingInfo(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    setSavingPassword(true);
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordSuccess("Password changed successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Couldn't change your password.");
    } finally {
      setSavingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto px-6 py-12">
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-1">My Profile</h1>
      <p className="text-navy-900/60 text-sm mb-8">
        {user.role === "distributor" ? "Distributor account" : "Customer account"} · {user.email}
      </p>

      <form onSubmit={handleInfoSubmit} className="flex flex-col gap-4 mb-10">
        <h2 className="font-display font-bold text-navy-900">Account Info</h2>

        <Field label="Full name">
          <input required value={form.fullName} onChange={update("fullName")} className="input" />
        </Field>

        <Field label="Phone">
          <input required value={form.phone} onChange={update("phone")} className="input" />
        </Field>

        <Field label="State">
          <select value={form.state} onChange={update("state")} className="input">
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>

        {infoError && <p className="text-status-danger text-sm">{infoError}</p>}
        {infoSuccess && <p className="text-green-500 text-sm">{infoSuccess}</p>}

        <button
          type="submit"
          disabled={savingInfo}
          className="bg-navy-800 text-cream-50 font-bold text-sm py-3 rounded-md hover:bg-gold-500 hover:text-navy-900 transition-colors disabled:opacity-50"
        >
          {savingInfo ? "Saving…" : "Save Changes"}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
        <h2 className="font-display font-bold text-navy-900">Change Password</h2>

        <Field label="Current password">
          <input
            type="password"
            required
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
            className="input"
          />
        </Field>

        <Field label="New password">
          <input
            type="password"
            required
            minLength={8}
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
            className="input"
          />
        </Field>

        {passwordError && <p className="text-status-danger text-sm">{passwordError}</p>}
        {passwordSuccess && <p className="text-green-500 text-sm">{passwordSuccess}</p>}

        <button
          type="submit"
          disabled={savingPassword}
          className="bg-navy-800 text-cream-50 font-bold text-sm py-3 rounded-md hover:bg-gold-500 hover:text-navy-900 transition-colors disabled:opacity-50"
        >
          {savingPassword ? "Updating…" : "Change Password"}
        </button>
      </form>
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
