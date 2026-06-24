import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMyOrders } from "../api/orders";
import OrderStatusStepper from "../components/OrderStatusStepper";

export default function CustomerDashboard() {
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

      {loading && <p className="text-navy-900/60">Loading your orders…</p>}

      {!loading && orders.length === 0 && (
        <div className="text-center py-16">
          <p className="text-navy-900/60 mb-4">You haven't placed any orders yet.</p>
          <Link to="/catalog" className="bg-navy-800 text-cream-50 font-bold text-sm px-6 py-3 rounded-md">
            Browse Catalog
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-card shadow-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-navy-900">{order.order_number}</p>
                <p className="text-xs text-navy-900/50">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className="font-display font-bold text-navy-800">
                ₦{Number(order.total_amount).toLocaleString()}
              </span>
            </div>
            <OrderStatusStepper status={order.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
