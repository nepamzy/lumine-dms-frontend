import { useEffect, useState } from "react";
import { listTrash, restoreUser, listDeletedOrders, restoreOrder } from "../../api/admin";
import { getPaymentBand, getPaymentBandStyles } from "../../utils/paymentStatus";

export default function Trash() {
  const [tab, setTab] = useState("users");

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-navy-900 mb-2">Trash</h2>
      <p className="text-sm text-navy-900/70 mb-5">
        Nothing here is destroyed — everything can be restored to exactly where it was.
      </p>

      <div className="flex gap-2 mb-5 border-b border-navy-900/10">
        {[
          { key: "users", label: "Users" },
          { key: "orders", label: "Orders" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t.key ? "border-gold-500 text-navy-900" : "border-transparent text-navy-900/70 hover:text-navy-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "users" ? <UsersTab /> : <OrdersTab />}
    </div>
  );
}

function UsersTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState(null);
  const [error, setError] = useState(null);

  const refresh = () => listTrash().then(setRows).finally(() => setLoading(false));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const roleLabel = (row) => {
    if (row.role === "customer") return "Customer";
    if (row.role === "distributor") return row.distributor_type === "distributor" ? "Distributor" : "Sales Rep";
    return row.role;
  };

  const handleRestore = async (row) => {
    setError(null);
    setRestoringId(row.id);
    try {
      await restoreUser(row.id);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't restore this account.");
    } finally {
      setRestoringId(null);
    }
  };

  if (loading) return <p className="text-navy-900/70">Loading…</p>;
  if (rows.length === 0) return <p className="text-navy-900/70">No removed accounts.</p>;

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-status-danger text-sm">{error}</p>}
      {rows.map((r) => (
        <div key={r.id} className="bg-white rounded-card shadow-card p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-navy-900">
              {r.distributor_business_name || r.customer_business_name || r.full_name}
            </p>
            <p className="text-xs text-navy-900/70">
              {r.full_name} · {r.email} · {r.phone}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-navy-900/10 text-navy-900/70">
                {roleLabel(r)}
              </span>
              <p className="text-[11px] text-navy-900/40 mt-1">Removed {new Date(r.deleted_at).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => handleRestore(r)}
              disabled={restoringId === r.id}
              className="bg-navy-800 text-cream-50 text-xs font-bold px-3 py-2 rounded-md hover:bg-gold-500 hover:text-navy-900 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {restoringId === r.id ? "Restoring…" : "Restore"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState(null);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const refresh = () => listDeletedOrders().then(setOrders).finally(() => setLoading(false));

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestore = async (order) => {
    setError(null);
    setNotice(null);
    setRestoringId(order.id);
    try {
      const result = await restoreOrder(order.id);
      if (result.data?.stockWasReleased) {
        setNotice(
          `${order.order_number} restored — its stock was released back to inventory when it was deleted, so verify availability before treating it as fulfillable again.`
        );
      }
      await refresh();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't restore this order.");
    } finally {
      setRestoringId(null);
    }
  };

  if (loading) return <p className="text-navy-900/70">Loading…</p>;
  if (orders.length === 0) return <p className="text-navy-900/70">No removed orders.</p>;

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-status-danger text-sm">{error}</p>}
      {notice && <p className="text-status-warning text-sm bg-gold-500/10 rounded-md p-3">{notice}</p>}
      {orders.map((order) => {
        const band = getPaymentBand(order.payment?.percent ?? 0);
        const styles = getPaymentBandStyles(band);
        return (
          <div key={order.id} className="bg-white rounded-card shadow-card p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-navy-900">{order.order_number}</p>
                <p className="text-xs text-navy-900/70">
                  {order.customer_name} · {new Date(order.created_at).toLocaleDateString()} · ₦
                  {Number(order.total_amount).toLocaleString()} · <span className="capitalize">{order.status}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full whitespace-nowrap ${styles.bg} ${styles.text}`}>
                  {Math.round(order.payment?.percent ?? 0)}% paid
                </span>
                <button
                  onClick={() => handleRestore(order)}
                  disabled={restoringId === order.id}
                  className="bg-navy-800 text-cream-50 text-xs font-bold px-3 py-2 rounded-md hover:bg-gold-500 hover:text-navy-900 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {restoringId === order.id ? "Restoring…" : "Restore"}
                </button>
              </div>
            </div>
            {order.items?.length > 0 && (
              <ul className="mt-3 pt-3 border-t border-navy-900/10 text-xs text-navy-900/70 flex flex-col gap-1">
                {order.items.map((item, i) => (
                  <li key={i}>
                    {item.product_name} {item.variant_size ? `(${item.variant_size})` : ""} × {item.quantity} — ₦
                    {Number(item.line_total).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-navy-900/40 mt-2">Removed {new Date(order.deleted_at).toLocaleDateString()}</p>
          </div>
        );
      })}
    </div>
  );
}
