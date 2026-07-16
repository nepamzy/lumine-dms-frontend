import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getMyRoute, markDelivered, markFailed, updateGps } from "../api/deliveries";
import { listMyOrders } from "../api/orders";
import { getMyReferral, listMyCustomers } from "../api/distributor";
import { getPaymentBand, getPaymentBandStyles } from "../utils/paymentStatus";
import ExpiringBatchesList from "../components/ExpiringBatchesList";

const STATUS_COLORS = {
  assigned: "bg-gold-500/20 text-gold-700",
  in_transit: "bg-navy-700/15 text-navy-700",
  delivered: "bg-green-500/15 text-green-500",
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
          <p className="text-sm text-navy-900/60 mt-0.5">₦{Number(delivery.total_amount).toLocaleString()}</p>
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

// The "true" distributor: buys at discount, has a cart, and can refer other
// distributors — but only sees a headcount, not a managed list (unlike a
// Sales Rep, who sees each attached customer individually).
function DistributorSimpleDashboard({ user }) {
  const [referral, setReferral] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getMyReferral().then(setReferral).catch(() => setReferral(null)),
      listMyOrders().then(setOrders).catch(() => setOrders([])),
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
      <p className="text-navy-900/60 text-sm mb-8">Distributor dashboard</p>

      {loading ? (
        <p className="text-navy-900/60">Loading…</p>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="bg-white rounded-card shadow-card p-6">
            <h3 className="font-display font-bold text-navy-900 mb-1">
              Bring in other distributors
            </h3>
            <p className="text-sm text-navy-900/60 mb-4">
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
            <p className="text-sm text-navy-900/55 mt-1">Distributors referred by you</p>
          </div>

          <div>
            <h3 className="font-display font-bold text-navy-900 mb-3">Your orders</h3>
            {orders.length === 0 ? (
              <div className="bg-navy-900/[0.03] rounded-card p-5 text-sm text-navy-900/60">
                No orders yet. Use the Catalog and Cart to place one.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {orders.map((order) => {
                  const band = getPaymentBand(order.paymentPercent);
                  const styles = getPaymentBandStyles(band);
                  return (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="bg-white rounded-card shadow-card p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        <p className="font-semibold text-navy-900">{order.order_number}</p>
                        <p className="text-xs text-navy-900/50">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-display font-bold text-navy-800 mb-1">
                          ₦{Number(order.total_amount).toLocaleString()}
                        </p>
                        <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${styles.bg} ${styles.text}`}>
                          {order.paymentPercent.toFixed(0)}% paid
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

function SalesRepDashboard({ user, roleLabel }) {
  const [tab, setTab] = useState("route");
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
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-1">
        Welcome, {user?.full_name?.split(" ")[0]}
      </h1>
      <p className="text-navy-900/60 text-sm mb-6">{roleLabel} dashboard</p>

      <div className="flex gap-1 border-b border-navy-900/10 mb-8">
        {["route", "orders", "referral", "place-order", "expiring"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t
                ? "border-gold-500 text-navy-900"
                : "border-transparent text-navy-900/50 hover:text-navy-900"
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
              : "Expiring Batches"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-navy-900/60">Loading…</p>
      ) : tab === "route" ? (
        route.length === 0 ? (
          <div className="text-center py-16 text-navy-900/50 text-sm">
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
            <p className="text-sm text-navy-900/60 mb-4">
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
              <p className="text-sm text-navy-900/55 mt-1">Referred customers</p>
            </div>
            <div className="bg-white rounded-card shadow-card p-5 text-center">
              <p className="font-display font-extrabold text-3xl text-navy-900">
                {referral?.assignedCount ?? "—"}
              </p>
              <p className="text-sm text-navy-900/55 mt-1">Currently assigned to you</p>
            </div>
          </div>

          <p className="text-xs text-navy-900/40">
            Note: "assigned" customers can differ from "referred" — admin may reassign a
            customer to another distributor for delivery efficiency, but the original
            referral is always kept on record.
          </p>
        </div>
      ) : tab === "place-order" ? (
        <div className="flex flex-col gap-3">
          {myCustomers.length === 0 ? (
            <p className="text-navy-900/60 text-sm">
              No customers assigned to you yet. Share your referral link to bring some in.
            </p>
          ) : (
            myCustomers.map((c) => (
              <div key={c.id} className="bg-white rounded-card shadow-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-navy-900">{c.business_name || c.full_name}</p>
                  <p className="text-xs text-navy-900/50">{c.full_name} · {c.email}</p>
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
      ) : tab === "expiring" ? (
        <ExpiringBatchesList />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-card shadow-card p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold text-navy-900">{o.order_number}</p>
                <p className="text-xs text-navy-900/50">{new Date(o.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-navy-800">₦{Number(o.total_amount).toLocaleString()}</p>
                <p className="text-xs text-navy-900/50">{o.status.replace(/_/g, " ")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
