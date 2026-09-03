import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listExpiringOrders } from "../api/orders";
import { getExpiryBandStyles } from "../utils/expiryStatus";

// Reused across the admin, customer, distributor, and sales rep dashboards
// — the backend already scopes which orders each role can see.
export default function ExpiringBatchesList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listExpiringOrders()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-navy-900/70">Loading…</p>;
  if (rows.length === 0) return <p className="text-navy-900/70">No batches currently tracked for expiry.</p>;

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const styles = getExpiryBandStyles(row.band);
        return (
          <Link
            key={row.id}
            to={`/orders/${row.id}`}
            className="bg-white rounded-card shadow-card p-4 flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
          >
            <div>
              <p className="font-semibold text-navy-900">{row.order_number}</p>
              <p className="text-xs text-navy-900/70">
                {row.product_names} — {row.customer_name}
              </p>
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${styles.bg} ${styles.text}`}>
              {row.daysRemaining} day{row.daysRemaining === 1 ? "" : "s"} left
            </span>
          </Link>
        );
      })}
    </div>
  );
}
