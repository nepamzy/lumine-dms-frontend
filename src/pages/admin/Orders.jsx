import { useEffect, useState } from "react";
import { listAllOrders, updateOrderStatus, assignDistributor, listDistributors } from "../../api/admin";

const STATUS_COLORS = {
  pending: "bg-status-warning/15 text-status-warning",
  paid: "bg-green-500/15 text-green-500",
  processing: "bg-navy-700/15 text-navy-700",
  out_for_delivery: "bg-gold-500/20 text-gold-700",
  delivered: "bg-green-500/15 text-green-500",
  cancelled: "bg-status-danger/15 text-status-danger",
};

const NEXT_STATUS = {
  paid: "processing",
  processing: "out_for_delivery",
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = () => listAllOrders(filter || undefined).then(setOrders);

  useEffect(() => {
    setLoading(true);
    Promise.all([refresh(), listDistributors("approved").then(setDistributors)]).finally(() =>
      setLoading(false)
    );
  }, [filter]);

  const handleAdvance = async (order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    await updateOrderStatus(order.id, next);
    refresh();
  };

  const handleAssign = async (order, distributorId) => {
    if (!distributorId) return;
    await assignDistributor(order.id, distributorId);
    refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-xl text-navy-900">Orders</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input w-auto">
          <option value="">All statuses</option>
          {["pending", "paid", "processing", "out_for_delivery", "delivered", "cancelled"].map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-navy-900/60">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-navy-900/60">No orders match this filter.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-card shadow-card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-navy-900">{order.order_number}</p>
                <p className="text-xs text-navy-900/50">
                  {new Date(order.created_at).toLocaleDateString()} · ₦
                  {Number(order.total_amount).toLocaleString()}
                </p>
              </div>

              <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                {order.status.replace(/_/g, " ")}
              </span>

              {!order.distributor_id && order.status !== "cancelled" && (
                <select
                  defaultValue=""
                  onChange={(e) => handleAssign(order, e.target.value)}
                  className="text-xs border border-navy-900/15 rounded-md px-2 py-1.5"
                >
                  <option value="" disabled>
                    Assign distributor
                  </option>
                  {distributors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.business_name || d.full_name}
                    </option>
                  ))}
                </select>
              )}

              {NEXT_STATUS[order.status] && (
                <button
                  onClick={() => handleAdvance(order)}
                  className="text-navy-800 font-semibold text-xs underline whitespace-nowrap"
                >
                  Move to {NEXT_STATUS[order.status].replace(/_/g, " ")}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
