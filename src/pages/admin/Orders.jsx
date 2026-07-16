import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listAllOrders, assignDistributor, listDistributors } from "../../api/admin";
import { getPaymentBand, getPaymentBandStyles } from "../../utils/paymentStatus";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => listAllOrders().then(setOrders);

  useEffect(() => {
    setLoading(true);
    Promise.all([refresh(), listDistributors("approved").then(setDistributors)]).finally(() =>
      setLoading(false)
    );
  }, []);

  const handleAssign = async (order, distributorId) => {
    if (!distributorId) return;
    await assignDistributor(order.id, distributorId);
    refresh();
  };

  // Only sales reps deliver orders — a true distributor's own purchase has
  // no deliverer to assign.
  const salesReps = distributors.filter((d) => d.distributor_type !== "distributor");

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-navy-900 mb-5">Orders</h2>

      {loading ? (
        <p className="text-navy-900/60">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-navy-900/60">No orders yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => {
            const band = getPaymentBand(order.paymentPercent);
            const styles = getPaymentBandStyles(band);
            return (
              <div key={order.id} className="bg-white rounded-card shadow-card p-4 flex items-center justify-between gap-4">
                <Link to={`/orders/${order.id}`} className="flex-1">
                  <p className="font-semibold text-navy-900">{order.order_number}</p>
                  <p className="text-xs text-navy-900/50">
                    {order.customer_name} · {new Date(order.created_at).toLocaleDateString()} · ₦
                    {Number(order.total_amount).toLocaleString()}
                    {" · "}
                    <span className="capitalize">{order.buyerKind}</span>
                  </p>
                </Link>

                <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${styles.bg} ${styles.text}`}>
                  {order.paymentPercent.toFixed(0)}% paid
                </span>

                {order.buyerKind === "customer" && !order.distributor_id && (
                  <select
                    defaultValue=""
                    onChange={(e) => handleAssign(order, e.target.value)}
                    className="text-xs border border-navy-900/15 rounded-md px-2 py-1.5"
                  >
                    <option value="" disabled>
                      Assign sales rep
                    </option>
                    {salesReps.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.business_name || d.full_name}
                      </option>
                    ))}
                  </select>
                )}

                <Link
                  to={`/orders/${order.id}`}
                  className="text-navy-800 font-semibold text-xs underline whitespace-nowrap"
                >
                  Manage
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
