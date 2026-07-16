import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getOrder, confirmTransport, confirmReceived } from "../api/orders";
import OrderStatusStepper from "../components/OrderStatusStepper";
import PaymentPanel from "../components/PaymentPanel";

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = () => getOrder(id).then(setOrder);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="max-w-2xl mx-auto px-6 py-16 text-navy-900/60">Loading…</p>;
  if (!order) return <p className="max-w-2xl mx-auto px-6 py-16 text-navy-900/60">Order not found.</p>;

  const isAdmin = user?.role === "admin";
  const isBuyer = order.customer_id === user?.id;
  const isAssignedStaff =
    order.buyerKind === "customer" && user?.role === "distributor" && order.distributor_id === user?.distributor_id;

  const runAction = async (fn) => {
    setBusy(true);
    try {
      await fn();
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const ordersBackPath = user?.role === "admin" ? "/admin" : user?.role === "distributor" ? "/distributor" : "/account";

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Link to={ordersBackPath} className="text-sm text-navy-800 font-semibold mb-4 inline-block">
        ← Back to orders
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-900">{order.order_number}</h1>
          <p className="text-navy-900/50 text-sm">
            Placed {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <p className="font-display font-bold text-xl text-navy-900">
          ₦{Number(order.total_amount).toLocaleString()}
        </p>
      </div>

      <div className="bg-white rounded-card shadow-card p-5 mb-5">
        <OrderStatusStepper stage={order.stage} buyerKind={order.buyerKind} />
      </div>

      {/* Admin controls */}
      {isAdmin && (
        <div className="bg-navy-900/[0.03] rounded-card p-4 mb-5 flex flex-wrap gap-2">
          {!order.stage.transport && (
            <button
              disabled={busy}
              onClick={() => runAction(() => confirmTransport(order.id))}
              className="bg-navy-800 text-cream-50 text-xs font-bold px-3 py-2 rounded-md disabled:opacity-50"
            >
              Confirm On Transport
            </button>
          )}
          {!order.stage.received.admin && (
            <button
              disabled={busy}
              onClick={() => runAction(() => confirmReceived(order.id, "admin"))}
              className="bg-navy-800 text-cream-50 text-xs font-bold px-3 py-2 rounded-md disabled:opacity-50"
            >
              Confirm Received (Admin)
            </button>
          )}
          {order.buyerKind === "customer" && !order.stage.received.staff && (
            <button
              disabled={busy}
              onClick={() => runAction(() => confirmReceived(order.id, "staff"))}
              className="bg-navy-800/80 text-cream-50 text-xs font-bold px-3 py-2 rounded-md disabled:opacity-50"
            >
              Confirm Received (on behalf of Sales Rep)
            </button>
          )}
          {!order.stage.received.buyer && (
            <button
              disabled={busy}
              onClick={() => runAction(() => confirmReceived(order.id, "buyer"))}
              className="bg-navy-800/80 text-cream-50 text-xs font-bold px-3 py-2 rounded-md disabled:opacity-50"
            >
              Confirm Received (on behalf of {order.buyerKind === "distributor" ? "Distributor" : "Customer"})
            </button>
          )}
        </div>
      )}

      {/* Sales rep's own confirmation */}
      {isAssignedStaff && !order.stage.received.staff && (
        <div className="bg-navy-900/[0.03] rounded-card p-4 mb-5">
          <button
            disabled={busy}
            onClick={() => runAction(() => confirmReceived(order.id, "staff"))}
            className="bg-gold-500 text-navy-900 text-sm font-bold px-4 py-2.5 rounded-md disabled:opacity-50"
          >
            Confirm Received
          </button>
        </div>
      )}

      {/* Buyer's own confirmation */}
      {isBuyer && !order.stage.received.buyer && order.stage.transport && (
        <div className="bg-navy-900/[0.03] rounded-card p-4 mb-5">
          <button
            disabled={busy}
            onClick={() => runAction(() => confirmReceived(order.id))}
            className="bg-gold-500 text-navy-900 text-sm font-bold px-4 py-2.5 rounded-md disabled:opacity-50"
          >
            Confirm I Received This Order
          </button>
        </div>
      )}

      <PaymentPanel order={order} canPay={isBuyer} onUpdated={refresh} />

      <div className="bg-white rounded-card shadow-card p-5 mt-5">
        <h3 className="font-display font-bold text-navy-900 mb-3">Items</h3>
        <div className="flex flex-col gap-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-navy-900/70">
                {item.product_name} — {item.variant_size} × {item.quantity}
              </span>
              <span className="font-semibold text-navy-900">
                ₦{Number(item.line_total).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
