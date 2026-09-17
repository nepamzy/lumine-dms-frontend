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

  // Split view (item 6): a "Distributor Order" is one whose buyer chain
  // belongs to a true distributor (registered_under_distributor_id set at
  // order-creation time — see order.service.js) — a customer or sales rep
  // registered under that distributor. Everything else — a distributor
  // dealing directly, or an unaffiliated customer/sales rep — is a "Normal
  // Order". Purely a display split; both groups share the same underlying
  // order management.
  const distributorOrders = orders.filter((o) => o.registered_under_distributor_id);
  const normalOrders = orders.filter((o) => !o.registered_under_distributor_id);

  const renderOrderRow = (order) => {
    const band = getPaymentBand(order.paymentPercent);
    const styles = getPaymentBandStyles(band);
    return (
      <div key={order.id} className="bg-white rounded-card shadow-card p-4 flex items-center justify-between gap-4">
        <Link to={`/orders/${order.id}`} className="flex-1">
          <p className="font-semibold text-navy-900">{order.order_number}</p>
          <p className="text-xs text-navy-900/70">
            {order.customer_name} · {new Date(order.created_at).toLocaleDateString()} · ₦
            {Number(order.total_amount).toLocaleString()}
            {" · "}
            <span className="capitalize">{order.buyerKind}</span>
            {order.registered_under_distributor_name && (
              <>
                {" · "}
                <span className="font-semibold text-gold-700">{order.registered_under_distributor_name}</span>
              </>
            )}
          </p>
        </Link>

        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full whitespace-nowrap ${
              order.paymentPercent >= 100 ? "bg-green-500/15 text-green-700" : "bg-navy-900/10 text-navy-900/70"
            }`}
          >
            {order.paymentPercent >= 100 ? "Complete" : "Pending"}
          </span>
          <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${styles.bg} ${styles.text}`}>
            {order.paymentPercent.toFixed(0)}% paid
          </span>
        </div>

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
  };

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-navy-900 mb-5">Orders</h2>

      {loading ? (
        <p className="text-navy-900/70">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="text-navy-900/70">No orders yet.</p>
      ) : (
        <div className="flex flex-col gap-8">
          <div>
            <h3 className="font-display font-bold text-navy-900 mb-3">
              Normal Orders <span className="text-navy-900/40 font-normal">({normalOrders.length})</span>
            </h3>
            {normalOrders.length === 0 ? (
              <p className="text-navy-900/50 text-sm">None right now.</p>
            ) : (
              <div className="flex flex-col gap-3">{normalOrders.map(renderOrderRow)}</div>
            )}
          </div>

          <div>
            <h3 className="font-display font-bold text-navy-900 mb-1">
              Distributor Orders <span className="text-navy-900/40 font-normal">({distributorOrders.length})</span>
            </h3>
            <p className="text-xs text-navy-900/50 mb-3">
              Customers and sales reps registered under a distributor — payment for these splits
              straight to that distributor.
            </p>
            {distributorOrders.length === 0 ? (
              <p className="text-navy-900/50 text-sm">None right now.</p>
            ) : (
              <div className="flex flex-col gap-3">{distributorOrders.map(renderOrderRow)}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
