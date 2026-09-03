import { useEffect, useState } from "react";
import { getExpiringBatches } from "../api/products";
import { getExpiryBandStyles } from "../utils/expiryStatus";

// Admin-only — shows actual PRODUCT BATCH stock nearing expiry (ties into
// the daily auto-batch system), as distinct from ExpiringBatchesList which
// tracks individual order-level expiry dates.
export default function ExpiringProductBatchesList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getExpiringBatches(30)
      .then(setRows)
      .catch((err) => setError(err.response?.data?.message || err.message || "Couldn't load expiring batches."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-navy-900/70">Loading…</p>;
  if (error) return <p className="text-status-danger">{error}</p>;
  if (rows.length === 0) return <p className="text-navy-900/70">No batches expiring within the next 30 days.</p>;

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const styles = getExpiryBandStyles(row.band);
        return (
          <div
            key={row.id}
            className="bg-white rounded-card shadow-card p-4 flex items-center justify-between gap-4"
          >
            <div>
              <p className="font-semibold text-navy-900">{row.product_name}</p>
              <p className="text-xs text-navy-900/70">
                Batch {row.batch_number} · {Number(row.quantity_on_hand).toLocaleString()} bottles in stock
              </p>
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full whitespace-nowrap ${styles.bg} ${styles.text}`}>
              {row.daysRemaining} day{row.daysRemaining === 1 ? "" : "s"} left
            </span>
          </div>
        );
      })}
    </div>
  );
}
