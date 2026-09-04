import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMyOrders } from "../api/orders";
import { getOrderListBadge } from "../utils/paymentStatus";
import ExpiringBatchesList from "../components/ExpiringBatchesList";

export default function CustomerDashboard() {
  const [tab, setTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listMyOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-6">My Orders</h1>

      <div className="flex gap-1 border-b border-navy-900/10 mb-6">
        {["orders", "expiring"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              tab === t ? "border-gold-500 text-navy-900" : "border-transparent text-navy-900/70 hover:text-navy-900"
            }`}
          >
            {t === "orders" ? "Orders" : "Expiring Batches"}
          </button>
        ))}
      </div>

      {tab === "expiring" ? (
        <ExpiringBatchesList />
      ) : (
        <>
          {loading && <p className="text-navy-900/70">Loading your orders…</p>}

          {!loading && orders.length === 0 && (
            <div className="text-center py-16">
              <p className="text-navy-900/70 mb-4">You haven't placed any orders yet.</p>
              <Link to="/catalog" className="bg-navy-800 text-cream-50 font-bold text-sm px-6 py-3 rounded-md">
                Browse Catalog
              </Link>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {orders.map((order) => {
              const badge = getOrderListBadge(order.paymentPercent);
              return (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="bg-white rounded-card shadow-card p-5 flex items-center justify-between hover:shadow-md transition-shadow"
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
        </>
      )}
    </div>
  );
}
