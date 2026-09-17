import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyRoute, markDelivered, markFailed, updateGps } from "../api/deliveries";
import { listMyOrders } from "../api/orders";
import {
  getMyReferral,
  listMyCustomers,
  registerCustomerForRep,
  registerSalesRepForDistributor,
  listTrackRecordCustomers,
  getCustomerHistoryForRep,
  pingCustomer,
  listPayoutBanks,
  resolveBankAccount,
  confirmPayoutAccount,
  getPayoutAccountStatus,
  listHierarchyCustomers,
  getHierarchyCustomerHistory,
  listHierarchySalesReps,
} from "../api/distributor";
import { getPaymentBand, getPaymentBandStyles, getOrderListBadge } from "../utils/paymentStatus";
import ExpiringBatchesList from "../components/ExpiringBatchesList";
import PasswordInput from "../components/PasswordInput";
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

const STATUS_COLORS = {
  assigned: "bg-gold-500/20 text-gold-700",
  in_transit: "bg-navy-700/15 text-navy-700",
  delivered: "bg-green-500/15 text-green-700",
  failed: "bg-status-danger/15 text-status-danger",
};

function DeliveryCard({ delivery, onDelivered, onFailed }) {
  const [busy, setBusy] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const [reason, setReason] = useState("");

  const handleGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await updateGps(delivery.order_id, pos.coords.latitude, pos.coords.longitude);
        } catch {}
      },
      () => {}
    );
  };

  const handleDeliver = async () => {
    setBusy(true);
    try {
      await markDelivered(delivery.order_id);
      onDelivered();
    } catch {
      setBusy(false);
    }
  };

  const handleFail = async () => {
    setBusy(true);
    try {
      await markFailed(delivery.order_id, reason);
      onFailed();
    } catch {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-card shadow-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-display font-bold text-navy-900">{delivery.order_number}</p>
          <p className="text-sm text-navy-900/70 mt-0.5">₦{Number(delivery.total_amount).toLocaleString()}</p>
        </div>
        <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${STATUS_COLORS[delivery.gps_status]}`}>
          {delivery.gps_status.replace(/_/g, " ")}
        </span>
      </div>

      <p className="text-sm text-navy-900/70 mb-4">
        <span className="font-semibold text-navy-900">Deliver to:</span> {delivery.delivery_address}
      </p>

      {delivery.gps_status !== "delivered" && delivery.gps_status !== "failed" && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleGps}
            className="bg-navy-900/5 text-navy-900 text-xs font-semibold px-3 py-2 rounded-md"
          >
            📍 Update GPS
          </button>
          <button
            disabled={busy}
            onClick={handleDeliver}
            className="bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-md disabled:opacity-50"
          >
            ✓ Mark Delivered
          </button>
          <button
            onClick={() => setShowFail(!showFail)}
            className="text-status-danger text-xs font-semibold px-3 py-2"
          >
            Mark Failed
          </button>
        </div>
      )}

      {showFail && (
        <div className="mt-3 flex gap-2">
          <input
            className="input flex-1 text-xs"
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            disabled={busy}
            onClick={handleFail}
            className="bg-status-danger text-white text-xs font-bold px-3 py-2 rounded-md disabled:opacity-50"
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}

export default function DistributorDashboard() {
  const { user } = useAuth();
  const isDistributor = user?.distributor_type === "distributor";
  const roleLabel = isDistributor ? "Distributor" : "Sales Rep";

  if (isDistributor) {
    return <DistributorSimpleDashboard user={user} />;
  }

  return <SalesRepDashboard user={user} roleLabel={roleLabel} />;
}

// The "true" distributor: buys at discount, has a cart, can refer other
// distributors, and — new — can directly onboard their own sales reps and
// customers, mirroring what a sales rep could already do for customers.
function DistributorSimpleDashboard({ user }) {
  const [tab, setTab] = useState("overview");
  const [referral, setReferral] = useState(null);
  const [orders, setOrders] = useState([]);
  const [myCustomers, setMyCustomers] = useState([]);
  const [placeOrderMode, setPlaceOrderMode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getMyReferral().then(setReferral).catch(() => setReferral(null)),
      listMyOrders().then(setOrders).catch(() => setOrders([])),
      listMyCustomers().then(setMyCustomers).catch(() => setMyCustomers([])),
    ]).finally(() => setLoading(false));
  }, []);

  const referralLink = referral
    ? `${window.location.origin}/register?ref=${referral.referralCode}`
    : "";

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-1">
        Welcome, {user?.full_name?.split(" ")[0]}
      </h1>
      <p className="text-navy-900/70 text-sm mb-6">Distributor dashboard</p>

      <div className="flex gap-1 border-b border-navy-900/10 mb-8 flex-wrap">
        {["overview", "place-order", "register-sales-rep", "register-customer", "customers", "sales-reps", "payout-account"].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPlaceOrderMode(null); }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t
                ? "border-gold-500 text-navy-900"
                : "border-transparent text-navy-900/70 hover:text-navy-900"
            }`}
          >
            {t === "overview"
              ? "Overview"
              : t === "place-order"
              ? "Place Order"
              : t === "register-sales-rep"
              ? "Register Sales Rep"
              : t === "register-customer"
              ? "Register Customer"
              : t === "customers"
              ? "Customers"
              : t === "sales-reps"
              ? "Sales Reps"
              : "Payout Account"}
          </button>
        ))}
      </div>

      {tab === "customers" ? (
        <HierarchyCustomersTab />
      ) : tab === "sales-reps" ? (
        <HierarchySalesRepsTab />
      ) : tab === "payout-account" ? (
        <PayoutAccountTab />
      ) : tab === "place-order" ? (
        placeOrderMode === null ? (
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg">
            <button
              onClick={() => setPlaceOrderMode("customer")}
              className="flex-1 bg-white rounded-card shadow-card p-6 text-left hover:shadow-md transition-shadow"
            >
              <p className="font-display font-bold text-navy-900 mb-1">Order for a Customer</p>
              <p className="text-xs text-navy-900/70">
                Pick from your customers who have their own account, and order on their behalf.
              </p>
            </button>
            <button
              onClick={() => navigate("/catalog")}
              className="flex-1 bg-white rounded-card shadow-card p-6 text-left hover:shadow-md transition-shadow"
            >
              <p className="font-display font-bold text-navy-900 mb-1">Order for Myself</p>
              <p className="text-xs text-navy-900/70">Buy at your own distributor pricing.</p>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setPlaceOrderMode(null)}
              className="text-xs font-semibold text-navy-800 underline self-start mb-1"
            >
              ← Back
            </button>
            {myCustomers.length === 0 ? (
              <p className="text-navy-900/70 text-sm">
                No customers assigned to you yet. Share your referral link, or register one from
                the Register Customer tab.
              </p>
            ) : (
              myCustomers.map((c) => (
                <div key={c.id} className="bg-white rounded-card shadow-card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-navy-900">{c.business_name || c.full_name}</p>
                    <p className="text-xs text-navy-900/70">{c.full_name} · {c.email}</p>
                  </div>
                  <button
                    onClick={() =>
                      navigate(
                        `/catalog?forCustomer=${c.id}&forCustomerName=${encodeURIComponent(c.business_name || c.full_name)}`
                      )
                    }
                    className="bg-gold-500 text-navy-900 text-xs font-bold px-4 py-2 rounded-md whitespace-nowrap"
                  >
                    Place Order
                  </button>
                </div>
              ))
            )}
          </div>
        )
      ) : tab === "register-sales-rep" ? (
        <RegisterSalesRepForDistributor />
      ) : tab === "register-customer" ? (
        <RegisterCustomerForRep onRegistered={() => listMyCustomers().then(setMyCustomers).catch(() => {})} />
      ) : loading ? (
        <p className="text-navy-900/70">Loading…</p>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-card shadow-card p-6">
            <h3 className="font-display font-bold text-navy-900 mb-1">
              Bring in other distributors
            </h3>
            <p className="text-sm text-navy-900/70 mb-4">
              Share this link with other distributors. Anyone who signs up through it
              counts toward your total below — you won't manage them directly, this is
              purely for tracking.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                readOnly
                value={referralLink}
                onClick={(e) => e.target.select()}
                className="input flex-1 text-sm text-navy-900/80"
              />
              <button
                onClick={copyReferralLink}
                className="bg-gold-500 text-navy-900 font-bold text-sm px-5 py-3 rounded-md hover:bg-gold-700 transition-colors whitespace-nowrap"
              >
                {copied ? "Copied ✓" : "Copy Link"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-card shadow-card p-5 text-center">
            <p className="font-display font-extrabold text-3xl text-navy-900">
              {referral?.referredCount ?? "—"}
            </p>
            <p className="text-sm text-navy-900/70 mt-1">Distributors referred by you</p>
          </div>

          <div>
            <h3 className="font-display font-bold text-navy-900 mb-3">Your orders</h3>
            {orders.length === 0 ? (
              <div className="bg-navy-900/[0.03] rounded-card p-5 text-sm text-navy-900/70">
                No orders yet. Use the Catalog and Cart to place one.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.map((order) => {
                  const badge = getOrderListBadge(order.paymentPercent);
                  return (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="bg-white rounded-card shadow-card p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        <p className="font-semibold text-navy-900">{order.order_number}</p>
                        <p className="text-xs text-navy-900/70">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-navy-800 mb-1">
                          ₦{Number(order.total_amount).toLocaleString()}
                        </p>
                        <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-display font-bold text-navy-900 mb-3">Expiring Batches</h3>
            <ExpiringBatchesList />
          </div>
        </div>
      )}
    </div>
  );
}

// Distributor-only — onboards a new sales rep directly. Unlike registering
// a customer (a contact record only), this creates a REAL account the new
// rep can log in with right away (auto-approved), so it collects the same
// fields a self-signup would.
function RegisterSalesRepForDistributor() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    state: "Lagos",
    localGovernment: STATE_LGAS["Lagos"][0],
    businessName: "",
    address: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const updateState = (e) => {
    const newState = e.target.value;
    setForm((f) => ({ ...f, state: newState, localGovernment: STATE_LGAS[newState]?.[0] || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await registerSalesRepForDistributor(form);
      setSuccess(`${form.fullName} can sign in right away with the password you set.`);
      setForm((f) => ({ ...f, fullName: "", email: "", phone: "", password: "", businessName: "", address: "" }));
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't register this sales rep.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-card shadow-card p-6 flex flex-col gap-4 max-w-lg">
      <p className="text-sm text-navy-900/70">
        Onboard a new sales rep to work under you. Unlike a customer, they get a real
        account and can sign in immediately — no separate admin approval needed, since
        you're vouching for them. Set a password they can start with; they can change it
        later from their own profile.
      </p>
      <input required placeholder="Full name" value={form.fullName} onChange={update("fullName")} className="input" />
      <input required type="email" placeholder="Email" value={form.email} onChange={update("email")} className="input" />
      <input required placeholder="Phone" value={form.phone} onChange={update("phone")} className="input" />
      <PasswordInput required minLength={8} placeholder="Password (min 8 characters)" value={form.password} onChange={update("password")} />
      <input placeholder="Business name (optional)" value={form.businessName} onChange={update("businessName")} className="input" />
      <div className="flex gap-2">
        <select value={form.state} onChange={updateState} className="input flex-1">
          {NIGERIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={form.localGovernment} onChange={update("localGovernment")} className="input flex-1">
          {(STATE_LGAS[form.state] || []).map((lga) => (
            <option key={lga} value={lga}>{lga}</option>
          ))}
        </select>
      </div>
      <textarea placeholder="Address (optional)" value={form.address} onChange={update("address")} className="input" rows={2} />
      {error && <p className="text-status-danger text-sm">{error}</p>}
      {success && <p className="text-status-success text-sm">{success}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="bg-gold-500 text-navy-900 font-bold py-3 rounded-md hover:bg-gold-700 transition-colors disabled:opacity-50"
      >
        {submitting ? "Registering…" : "Register Sales Rep"}
      </button>
    </form>
  );
}

// Two-step bank account setup: pick a bank + enter account number, tap
// Verify to see the resolved account holder name (free, no side effects —
// nothing is created yet), then Confirm to actually register it as the
// Paystack subaccount payments from this distributor's customers/reps will
// split 100% into. Re-verifying with different details always starts the
// confirm step over, so a distributor can never confirm a name they didn't
// actually see resolved for the details currently in the form.
function PayoutAccountTab() {
  const [status, setStatus] = useState(null);
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolved, setResolved] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([getPayoutAccountStatus(), listPayoutBanks()])
      .then(([s, b]) => {
        setStatus(s);
        setBanks(b);
      })
      .catch((err) => setLoadError(err.response?.data?.message || "Couldn't load payout account settings."))
      .finally(() => setLoading(false));
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setResolved(null);
    setVerifying(true);
    try {
      const result = await resolveBankAccount(bankCode, accountNumber);
      setResolved(result);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't verify that account. Please check the details and try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirm = async () => {
    setError(null);
    setConfirming(true);
    try {
      await confirmPayoutAccount(bankCode, accountNumber);
      const s = await getPayoutAccountStatus();
      setStatus(s);
      setResolved(null);
      setSuccess("Payout account saved. Payments from your customers and sales reps will now come straight to this account.");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save this payout account. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <p className="text-navy-900/70">Loading…</p>;
  if (loadError) return <p className="text-status-danger text-sm">{loadError}</p>;

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <div className="bg-white rounded-card shadow-card p-6">
        <h3 className="font-display font-bold text-navy-900 mb-1">Payout account</h3>
        <p className="text-sm text-navy-900/70 mb-4">
          Payments from customers and sales reps registered under you are paid out straight
          to this bank account — never held by Lumine and paid out later.
        </p>
        {status?.configured ? (
          <div className="bg-green-500/10 text-green-700 rounded-md px-4 py-3 text-sm">
            <p className="font-semibold">{status.accountName}</p>
            <p>
              {banks.find((b) => b.code === status.settlementBank)?.name || status.settlementBank} ·{" "}
              {status.accountNumber}
            </p>
          </div>
        ) : (
          <p className="text-sm text-navy-900/50">Not set up yet — your customers and reps can't pay online until you do.</p>
        )}
      </div>

      <form onSubmit={handleVerify} className="bg-white rounded-card shadow-card p-6 flex flex-col gap-4">
        <h3 className="font-display font-bold text-navy-900 mb-1">
          {status?.configured ? "Change payout account" : "Set up your payout account"}
        </h3>
        <select
          required
          value={bankCode}
          onChange={(e) => { setBankCode(e.target.value); setResolved(null); setSuccess(null); }}
          className="input"
        >
          <option value="">Select bank</option>
          {banks.map((b) => (
            <option key={b.code} value={b.code}>{b.name}</option>
          ))}
        </select>
        <input
          required
          placeholder="Account number"
          value={accountNumber}
          onChange={(e) => { setAccountNumber(e.target.value); setResolved(null); setSuccess(null); }}
          className="input"
        />
        {error && <p className="text-status-danger text-sm">{error}</p>}
        {success && <p className="text-status-success text-sm">{success}</p>}
        {resolved ? (
          <div className="flex flex-col gap-3">
            <div className="bg-gold-500/15 text-gold-700 rounded-md px-4 py-3 text-sm">
              <p className="font-semibold">{resolved.accountName}</p>
              <p className="text-xs">Is this you? Confirm to start receiving payments here.</p>
            </div>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="bg-gold-500 text-navy-900 font-bold py-3 rounded-md hover:bg-gold-700 transition-colors disabled:opacity-50"
            >
              {confirming ? "Saving…" : "Confirm & Save"}
            </button>
          </div>
        ) : (
          <button
            type="submit"
            disabled={verifying || !bankCode || !accountNumber}
            className="bg-white border border-gold-500 text-gold-700 font-bold py-3 rounded-md hover:bg-gold-500/10 transition-colors disabled:opacity-50"
          >
            {verifying ? "Verifying…" : "Verify"}
          </button>
        )}
      </form>
    </div>
  );
}

// Read-only visibility (item 8) — every real customer in this true
// distributor's whole hierarchy: assigned directly to them, or to one of
// their sales reps. Full order/payment detail on tap, but deliberately NO
// action buttons anywhere in this component — no Ping, no reassignment, no
// payment authorization. Payment approval and order management stay
// exclusively admin-controlled; this tab exists purely so a distributor
// can see what's happening across their business.
function HierarchyCustomersTab() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    listHierarchyCustomers().then(setCustomers).finally(() => setLoading(false));
  }, []);

  const openCustomer = async (customer) => {
    setSelected(customer);
    setHistoryLoading(true);
    try {
      setHistory(await getHierarchyCustomerHistory(customer.id));
    } finally {
      setHistoryLoading(false);
    }
  };

  if (loading) return <p className="text-navy-900/70">Loading…</p>;

  if (selected) {
    return (
      <div>
        <button
          onClick={() => { setSelected(null); setHistory(null); }}
          className="text-sm text-navy-900/70 hover:text-navy-900 mb-4"
        >
          ← Back to customers
        </button>
        <h3 className="font-display font-bold text-navy-900 mb-1">
          {selected.business_name || selected.full_name}
        </h3>
        <p className="text-xs text-navy-900/70 mb-5">
          {selected.full_name} · {selected.email} · {selected.phone}
        </p>
        {historyLoading ? (
          <p className="text-navy-900/70">Loading…</p>
        ) : !history || history.orders.length === 0 ? (
          <p className="text-navy-900/70 text-sm">No orders yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {history.orders.map((o) => (
              <Link
                key={o.id}
                to={`/orders/${o.id}`}
                className="bg-white rounded-card shadow-card p-4 block hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="font-semibold text-navy-900 text-sm">{o.order_number}</p>
                  <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full whitespace-nowrap ${
                    o.payment_percent >= 100 ? "bg-green-500/15 text-green-700" : "bg-navy-900/10 text-navy-900/70"
                  }`}>
                    {o.payment_percent.toFixed(0)}% paid
                  </span>
                </div>
                <p className="text-xs text-navy-900/45 mb-1">{new Date(o.created_at).toLocaleDateString()}</p>
                <p className="font-semibold text-navy-900 text-sm">₦{Number(o.total_amount).toLocaleString()}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-display font-bold text-navy-900 mb-1">Customers</h3>
      <p className="text-xs text-navy-900/50 mb-4">
        Every customer registered under you or one of your sales reps. View-only — payment
        approval and order management are handled by admin.
      </p>
      {customers.length === 0 ? (
        <p className="text-navy-900/70 text-sm">No customers in your hierarchy yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {customers.map((c) => (
            <div
              key={c.id}
              onClick={() => openCustomer(c)}
              className="bg-white rounded-card shadow-card p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
            >
              <div>
                <p className="font-semibold text-navy-900">{c.business_name || c.full_name}</p>
                <p className="text-xs text-navy-900/70">
                  {c.full_name}{c.email ? ` · ${c.email}` : ""} · {c.phone}
                  {c.assigned_rep_name && ` · via ${c.assigned_rep_name}`}
                </p>
              </div>
              <span className="text-xs font-semibold text-navy-800">View →</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Read-only visibility (item 8) — every sales rep this true distributor
// onboarded, with summary stats. No approve/suspend/remove action lives
// here — same read-only guarantee as HierarchyCustomersTab above.
function HierarchySalesRepsTab() {
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listHierarchySalesReps().then(setReps).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-navy-900/70">Loading…</p>;

  return (
    <div>
      <h3 className="font-display font-bold text-navy-900 mb-1">Sales Reps</h3>
      <p className="text-xs text-navy-900/50 mb-4">
        Every sales rep you've onboarded. View-only — approval, suspension, and removal are
        handled by admin.
      </p>
      {reps.length === 0 ? (
        <p className="text-navy-900/70 text-sm">You haven't registered any sales reps yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {reps.map((r) => (
            <div key={r.id} className="bg-white rounded-card shadow-card p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-navy-900">{r.business_name || r.full_name}</p>
                <p className="text-xs text-navy-900/70">{r.full_name} · {r.email} · {r.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-navy-900">₦{Number(r.total_revenue).toLocaleString()}</p>
                <p className="text-[11px] text-navy-900/50">{r.customer_count} customer{r.customer_count === "1" ? "" : "s"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Full-width, auto-ranked customer payment standing (item 10) — the same
// customer book as Track Record, but sorted by urgency instead of A-Z:
// under 50% paid at the top (needs chasing), 50-99% in the middle, fully
// paid at the bottom. The ranking is computed fresh from each customer's
// live paymentPercent on every load (not a fixed manual order), so it
// naturally re-sorts as payment status changes between visits. Works the
// same for an independent sales rep and one registered under a
// distributor — both just call the same track-record endpoint.
const STANDING_TIERS = [
  { key: "urgent", label: "Needs Attention", sub: "Under 50% paid", test: (p) => p < 50, accent: "border-status-danger" },
  { key: "progress", label: "In Progress", sub: "50–99% paid", test: (p) => p >= 50 && p < 100, accent: "border-gold-500" },
  { key: "settled", label: "Fully Paid", sub: "100% paid", test: (p) => p >= 100, accent: "border-green-500" },
];

function PaymentStandingTab() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pinging, setPingingId] = useState(null);
  const [pingSent, setPingSentId] = useState(null);

  const refresh = () => listTrackRecordCustomers().then(setCustomers).finally(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    refresh();
  }, []);

  const openCustomer = async (customer) => {
    setSelected(customer);
    setHistoryLoading(true);
    setPingSentId(null);
    try {
      setHistory(await getCustomerHistoryForRep(customer.id));
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePing = async (order) => {
    setPingingId(order.id);
    try {
      await pingCustomer(selected.id, order.id);
      setPingSentId(order.id);
    } finally {
      setPingingId(null);
    }
  };

  if (loading) return <p className="text-navy-900/70">Loading…</p>;

  if (selected) {
    return (
      <div>
        <button
          onClick={() => { setSelected(null); setHistory(null); refresh(); }}
          className="text-sm text-navy-900/70 hover:text-navy-900 mb-4"
        >
          ← Back to Payment Standing
        </button>
        <h3 className="font-display font-bold text-navy-900 text-xl mb-1">
          {selected.business_name || selected.full_name}
        </h3>
        <p className="text-sm text-navy-900/70 mb-6">{selected.full_name} · {selected.phone}</p>

        {historyLoading ? (
          <p className="text-navy-900/70">Loading…</p>
        ) : !history?.orders?.length ? (
          <p className="text-navy-900/70">No orders to show.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {history.orders.map((o) => {
              const band = getPaymentBand(o.payment_percent);
              const styles = getPaymentBandStyles(band);
              const remaining = Math.max(0, Number(o.total_amount) - Number(o.paid_amount));
              return (
                <div key={o.id} className="bg-white rounded-card shadow-card p-5">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div>
                      <p className="font-semibold text-navy-900">{o.order_number}</p>
                      <p className="text-xs text-navy-900/70">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${styles.bg} ${styles.text}`}>
                      {Math.round(o.payment_percent)}% paid
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 pt-3 border-t border-navy-900/10">
                    <div className="text-xs text-navy-900/70">
                      <p>Paid: ₦{Number(o.paid_amount).toLocaleString()}</p>
                      <p>Remaining: ₦{remaining.toLocaleString()}</p>
                    </div>
                    {o.payment_percent < 100 && (
                      <button
                        onClick={() => handlePing(o)}
                        disabled={pinging === o.id}
                        className="bg-gold-500 text-navy-900 text-xs font-bold px-3 py-2 rounded-md hover:bg-gold-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {pinging === o.id ? "Sending…" : pingSent === o.id ? "Sent ✓" : "Ping"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-display font-bold text-navy-900 text-xl mb-1">Payment Standing</h3>
      <p className="text-sm text-navy-900/70 mb-6">
        Your customers, ranked by who needs a nudge most — updates automatically as payments come in.
      </p>
      {customers.length === 0 ? (
        <p className="text-navy-900/70">No customers to track yet.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {STANDING_TIERS.map((tier) => {
            const inTier = customers.filter((c) => tier.test(c.paymentPercent));
            return (
              <div key={tier.key}>
                <div className="flex items-baseline gap-2 mb-3">
                  <h4 className="font-display font-bold text-navy-900">
                    {tier.label} <span className="text-navy-900/40 font-normal">({inTier.length})</span>
                  </h4>
                  <span className="text-xs text-navy-900/50">{tier.sub}</span>
                </div>
                {inTier.length === 0 ? (
                  <p className="text-sm text-navy-900/40">Nobody here right now.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inTier.map((c) => {
                      const band = getPaymentBand(c.paymentPercent);
                      const styles = getPaymentBandStyles(band);
                      return (
                        <button
                          key={c.id}
                          onClick={() => openCustomer(c)}
                          className={`bg-white rounded-card shadow-card p-5 text-left border-l-4 ${tier.accent} hover:shadow-md transition-shadow`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <p className="font-semibold text-navy-900">{c.business_name || c.full_name}</p>
                              <p className="text-xs text-navy-900/70">{c.full_name} · {c.phone}</p>
                            </div>
                            {!c.currently_assigned && (
                              <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-navy-900/10 text-navy-900/70 whitespace-nowrap">
                                Unassigned
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`font-display font-extrabold text-2xl ${styles.text}`}>
                              {Math.round(c.paymentPercent)}%
                            </span>
                            <span className="text-xs text-navy-900/50">
                              ₦{Number(c.total_paid).toLocaleString()} / ₦{Number(c.total_owed).toLocaleString()}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Customer list -> tap a customer -> their full order history with amount
// paid/remaining/percentage, plus a Ping button per unpaid order that
// sends an SMS payment reminder. Customers who've since been reassigned or
// removed still show up here (with only their fully-paid orders visible)
// rather than just disappearing — see distributor.service.js's
// getCustomerHistoryForRep for the actual cascading rule.
function TrackRecordTab() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // customer row, or null for list view
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [pinging, setPingingId] = useState(null);
  const [pingSent, setPingSentId] = useState(null);

  useEffect(() => {
    listTrackRecordCustomers().then(setCustomers).finally(() => setLoading(false));
  }, []);

  const openCustomer = async (customer) => {
    setSelected(customer);
    setHistoryLoading(true);
    setPingSentId(null);
    try {
      const data = await getCustomerHistoryForRep(customer.id);
      setHistory(data);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handlePing = async (order) => {
    setPingingId(order.id);
    try {
      await pingCustomer(selected.id, order.id);
      setPingSentId(order.id);
    } finally {
      setPingingId(null);
    }
  };

  if (loading) return <p className="text-navy-900/70">Loading…</p>;

  if (selected) {
    return (
      <div>
        <button
          onClick={() => { setSelected(null); setHistory(null); }}
          className="text-sm text-navy-900/70 hover:text-navy-900 mb-4"
        >
          ← Back to customers
        </button>
        <h3 className="font-display font-bold text-navy-900 mb-1">
          {selected.business_name || selected.full_name}
        </h3>
        <p className="text-xs text-navy-900/70 mb-5">
          {selected.full_name} · {selected.phone}
          {!selected.currently_assigned && " · No longer assigned to you — showing fully-paid orders only"}
        </p>

        {historyLoading ? (
          <p className="text-navy-900/70">Loading…</p>
        ) : !history?.orders?.length ? (
          <p className="text-navy-900/70">No orders to show.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {history.orders.map((o) => {
              const band = getPaymentBand(o.payment_percent);
              const styles = getPaymentBandStyles(band);
              const remaining = Math.max(0, Number(o.total_amount) - Number(o.paid_amount));
              return (
                <div key={o.id} className="bg-white rounded-card shadow-card p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-navy-900">{o.order_number}</p>
                      <p className="text-xs text-navy-900/70">{new Date(o.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full whitespace-nowrap ${styles.bg} ${styles.text}`}>
                      {Math.round(o.payment_percent)}% paid
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-navy-900/10 flex items-center justify-between gap-4">
                    <div className="text-xs text-navy-900/70">
                      <p>Paid: ₦{Number(o.paid_amount).toLocaleString()}</p>
                      <p>Remaining: ₦{remaining.toLocaleString()}</p>
                    </div>
                    {o.payment_percent < 100 && (
                      <button
                        onClick={() => handlePing(o)}
                        disabled={pinging === o.id}
                        className="bg-gold-500 text-navy-900 text-xs font-bold px-3 py-2 rounded-md hover:bg-gold-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {pinging === o.id ? "Sending…" : pingSent === o.id ? "Sent ✓" : "Ping"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return customers.length === 0 ? (
    <p className="text-navy-900/70">No customers to track yet.</p>
  ) : (
    <div className="flex flex-col gap-3">
      {customers.map((c) => (
        <button
          key={c.id}
          onClick={() => openCustomer(c)}
          className="bg-white rounded-card shadow-card p-4 flex items-center justify-between gap-4 text-left w-full hover:shadow-md transition-shadow"
        >
          <div>
            <p className="font-semibold text-navy-900">{c.business_name || c.full_name}</p>
            <p className="text-xs text-navy-900/70">{c.full_name} · {c.phone}</p>
          </div>
          {!c.currently_assigned && (
            <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-navy-900/10 text-navy-900/70 whitespace-nowrap">
              No longer assigned
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// For customers without an Android phone / who can't self-register — the
// sales rep fills out the exact same fields on their behalf. Auto-assigned
// straight to this rep, no location required (the rep may not be able to
// capture the customer's actual location).
function RegisterCustomerForRep({ onRegistered }) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    state: "Lagos",
    localGovernment: STATE_LGAS["Lagos"][0],
    businessName: "",
    customerType: "retailer",
    deliveryAddress: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const updateState = (e) => {
    const newState = e.target.value;
    setForm((f) => ({ ...f, state: newState, localGovernment: STATE_LGAS[newState]?.[0] || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await registerCustomerForRep(form);
      setSuccess(`${form.fullName} has been saved to your customer book.`);
      setForm((f) => ({ ...f, fullName: "", email: "", phone: "", businessName: "", deliveryAddress: "" }));
      onRegistered?.();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't register this customer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-card shadow-card p-6 flex flex-col gap-4 max-w-lg">
      <p className="text-sm text-navy-900/70">
        For customers who don't have an Android phone (or can't sign up themselves) — this just
        saves their details to your customer book. They won't get a login of their own; when
        they're ready to buy, place it as your own order (Place Order → Self) and pay for it
        yourself.
      </p>
      <input required placeholder="Full name" value={form.fullName} onChange={update("fullName")} className="input" />
      <input type="email" placeholder="Email (optional)" value={form.email} onChange={update("email")} className="input" />
      <input required placeholder="Phone" value={form.phone} onChange={update("phone")} className="input" />
      <input required placeholder="Business name" value={form.businessName} onChange={update("businessName")} className="input" />
      <select value={form.customerType} onChange={update("customerType")} className="input">
        {CUSTOMER_TYPES.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <select value={form.state} onChange={updateState} className="input flex-1">
          {NIGERIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={form.localGovernment} onChange={update("localGovernment")} className="input flex-1">
          {(STATE_LGAS[form.state] || []).map((lga) => (
            <option key={lga} value={lga}>{lga}</option>
          ))}
        </select>
      </div>
      <textarea required placeholder="Delivery address" value={form.deliveryAddress} onChange={update("deliveryAddress")} className="input" rows={2} />
      {error && <p className="text-status-danger text-sm">{error}</p>}
      {success && <p className="text-status-success text-sm">{success}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="bg-gold-500 text-navy-900 font-bold py-3 rounded-md hover:bg-gold-700 transition-colors disabled:opacity-50"
      >
        {submitting ? "Registering…" : "Register Customer"}
      </button>
    </form>
  );
}

function SalesRepDashboard({ user, roleLabel }) {
  const [tab, setTab] = useState("route");
  const [placeOrderMode, setPlaceOrderMode] = useState(null); // null | "customer" | "self"
  const [route, setRoute] = useState([]);
  const [orders, setOrders] = useState([]);
  const [referral, setReferral] = useState(null);
  const [myCustomers, setMyCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const refreshRoute = () => getMyRoute().then(setRoute);
  const refreshOrders = () => listMyOrders().then(setOrders);
  const refreshReferral = () => getMyReferral().then(setReferral).catch(() => setReferral(null));
  const refreshCustomers = () => listMyCustomers().then(setMyCustomers).catch(() => setMyCustomers([]));

  useEffect(() => {
    setLoading(true);
    Promise.all([refreshRoute(), refreshOrders(), refreshReferral(), refreshCustomers()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const referralLink = referral
    ? `${window.location.origin}/register?ref=${referral.referralCode}`
    : "";

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`${tab === "payment-standing" ? "max-w-6xl" : "max-w-3xl"} mx-auto px-6 py-10`}>
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-1">
        Welcome, {user?.full_name?.split(" ")[0]}
      </h1>
      <p className="text-navy-900/70 text-sm mb-6">{roleLabel} dashboard</p>

      <div className="flex gap-1 border-b border-navy-900/10 mb-8 flex-wrap">
        {["route", "orders", "referral", "place-order", "register-customer", "payment-standing", "track-record", "expiring"].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setPlaceOrderMode(null); }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t
                ? "border-gold-500 text-navy-900"
                : "border-transparent text-navy-900/70 hover:text-navy-900"
            }`}
          >
            {t === "route"
              ? `Today's Route (${route.length})`
              : t === "orders"
              ? "All Orders"
              : t === "referral"
              ? "Referral"
              : t === "place-order"
              ? "Place Order"
              : t === "register-customer"
              ? "Register Customer"
              : t === "payment-standing"
              ? "Payment Standing"
              : t === "track-record"
              ? "Track Record"
              : "Expiring Batches"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-navy-900/70">Loading…</p>
      ) : tab === "route" ? (
        route.length === 0 ? (
          <div className="text-center py-16 text-navy-900/70 text-sm">
            No active deliveries assigned to you right now.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {route.map((d) => (
              <DeliveryCard
                key={d.id}
                delivery={d}
                onDelivered={() => refreshRoute()}
                onFailed={() => refreshRoute()}
              />
            ))}
          </div>
        )
      ) : tab === "referral" ? (
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-card shadow-card p-6">
            <h3 className="font-display font-bold text-navy-900 mb-1">Your referral link</h3>
            <p className="text-sm text-navy-900/70 mb-4">
              Share this link with new customers. Anyone who signs up through it is
              automatically linked to your account.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                readOnly
                value={referralLink}
                onClick={(e) => e.target.select()}
                className="input flex-1 text-sm text-navy-900/80"
              />
              <button
                onClick={copyReferralLink}
                className="bg-gold-500 text-navy-900 font-bold text-sm px-5 py-3 rounded-md hover:bg-gold-700 transition-colors whitespace-nowrap"
              >
                {copied ? "Copied ✓" : "Copy Link"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-card shadow-card p-5 text-center">
              <p className="font-display font-extrabold text-3xl text-navy-900">
                {referral?.referredCount ?? "—"}
              </p>
              <p className="text-sm text-navy-900/70 mt-1">Referred customers</p>
            </div>
            <div className="bg-white rounded-card shadow-card p-5 text-center">
              <p className="font-display font-extrabold text-3xl text-navy-900">
                {referral?.assignedCount ?? "—"}
              </p>
              <p className="text-sm text-navy-900/70 mt-1">Currently assigned to you</p>
            </div>
          </div>

          <p className="text-xs text-navy-900/40">
            Note: "assigned" customers can differ from "referred" — admin may reassign a
            customer to another distributor for delivery efficiency, but the original
            referral is always kept on record.
          </p>
        </div>
      ) : tab === "place-order" ? (
        placeOrderMode === null ? (
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg">
            <button
              onClick={() => setPlaceOrderMode("customer")}
              className="flex-1 bg-white rounded-card shadow-card p-6 text-left hover:shadow-md transition-shadow"
            >
              <p className="font-display font-bold text-navy-900 mb-1">Order for a Customer</p>
              <p className="text-xs text-navy-900/70">
                Pick from your customers who have their own account, and order on their behalf.
              </p>
            </button>
            <button
              onClick={() => navigate("/catalog")}
              className="flex-1 bg-white rounded-card shadow-card p-6 text-left hover:shadow-md transition-shadow"
            >
              <p className="font-display font-bold text-navy-900 mb-1">Order for Myself</p>
              <p className="text-xs text-navy-900/70">
                Your own order — paid 100% upfront, no partial payments, capped at 5 packs total.
              </p>
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setPlaceOrderMode(null)}
              className="text-xs font-semibold text-navy-800 underline self-start mb-1"
            >
              ← Back
            </button>
            {myCustomers.length === 0 ? (
              <p className="text-navy-900/70 text-sm">
                No customers assigned to you yet. Share your referral link to bring some in.
              </p>
            ) : (
              myCustomers.map((c) => (
                <div key={c.id} className="bg-white rounded-card shadow-card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-navy-900">{c.business_name || c.full_name}</p>
                    <p className="text-xs text-navy-900/70">{c.full_name} · {c.email}</p>
                  </div>
                  <button
                    onClick={() =>
                      navigate(
                        `/catalog?forCustomer=${c.id}&forCustomerName=${encodeURIComponent(c.business_name || c.full_name)}`
                      )
                    }
                    className="bg-gold-500 text-navy-900 text-xs font-bold px-4 py-2 rounded-md whitespace-nowrap"
                  >
                    Place Order
                  </button>
                </div>
              ))
            )}
          </div>
        )
      ) : tab === "register-customer" ? (
        <RegisterCustomerForRep onRegistered={refreshCustomers} />
      ) : tab === "payment-standing" ? (
        <PaymentStandingTab />
      ) : tab === "track-record" ? (
        <TrackRecordTab />
      ) : tab === "expiring" ? (
        <ExpiringBatchesList />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-card shadow-card p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold text-navy-900">{o.order_number}</p>
                <p className="text-xs text-navy-900/70">{new Date(o.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-navy-800">₦{Number(o.total_amount).toLocaleString()}</p>
                <p className="text-xs text-navy-900/70">
                  {o.status === "pending" ? "Order Confirmed" : o.status.replace(/_/g, " ")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
