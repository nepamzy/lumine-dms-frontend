import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyRoute, markDelivered, markFailed, updateGps } from "../api/deliveries";
import { listMyOrders } from "../api/orders";

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
  const [tab, setTab] = useState("route");
  const [route, setRoute] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshRoute = () => getMyRoute().then(setRoute);
  const refreshOrders = () => listMyOrders().then(setOrders);

  useEffect(() => {
    setLoading(true);
    Promise.all([refreshRoute(), refreshOrders()]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-1">
        Welcome, {user?.full_name?.split(" ")[0]}
      </h1>
      <p className="text-navy-900/60 text-sm mb-6">Distributor dashboard</p>

      <div className="flex gap-1 border-b border-navy-900/10 mb-8">
        {["route", "orders"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t
                ? "border-gold-500 text-navy-900"
                : "border-transparent text-navy-900/50 hover:text-navy-900"
            }`}
          >
            {t === "route" ? `Today's Route (${route.length})` : "All Orders"}
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
