import { useEffect, useState } from "react";
import { salesReport, inventoryReport } from "../../api/admin";

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-card shadow-card p-5">
      <p className="text-xs font-semibold text-navy-900/50 uppercase tracking-wide mb-1">{label}</p>
      <p className={`font-display font-bold text-2xl ${accent || "text-navy-900"}`}>{value}</p>
    </div>
  );
}

export default function Overview() {
  const [sales, setSales] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([salesReport(), inventoryReport()])
      .then(([s, i]) => {
        setSales(s);
        setInventory(i);
      })
      .catch(() => setError("Couldn't load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-navy-900/60">Loading overview…</p>;
  if (error) return <p className="text-status-danger">{error}</p>;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Orders" value={sales.summary.order_count} />
        <StatCard
          label="Revenue"
          value={`₦${Number(sales.summary.total_revenue).toLocaleString()}`}
          accent="text-green-500"
        />
        <StatCard
          label="Expiring Soon"
          value={inventory.expiringBatches.length}
          accent={inventory.expiringBatches.length > 0 ? "text-status-warning" : "text-navy-900"}
        />
        <StatCard
          label="Low Stock SKUs"
          value={inventory.lowStock.length}
          accent={inventory.lowStock.length > 0 ? "text-status-danger" : "text-navy-900"}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-card shadow-card p-5">
          <h3 className="font-display font-bold text-navy-900 mb-3">Revenue by State</h3>
          {sales.byState.length === 0 ? (
            <p className="text-sm text-navy-900/50">No sales data yet.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {sales.byState.map((s) => (
                <div key={s.state} className="flex justify-between text-sm">
                  <span className="text-navy-900/70">{s.state}</span>
                  <span className="font-semibold text-navy-900">
                    ₦{Number(s.revenue).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-card shadow-card p-5">
          <h3 className="font-display font-bold text-navy-900 mb-3">Expiring Batches</h3>
          {inventory.expiringBatches.length === 0 ? (
            <p className="text-sm text-navy-900/50">Nothing expiring soon. Good shape.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {inventory.expiringBatches.slice(0, 6).map((b) => (
                <div key={b.id} className="flex justify-between text-sm">
                  <span className="text-navy-900/70">
                    {b.product_name} — {b.batch_number}
                  </span>
                  <span className="font-semibold text-status-warning">
                    {b.days_until_expiry}d left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
