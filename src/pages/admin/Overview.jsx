import { useEffect, useMemo, useState } from "react";
import { salesReport, inventoryReport, repRevenueBreakdown } from "../../api/admin";
import { replayAdminPushHistory } from "../../api/notifications";
import RepRevenueDrilldown from "../../components/RepRevenueDrilldown";

// One-time catch-up button — re-pushes every order/signup alert on record
// to whichever admin device clicks it, nobody else. Not something anyone
// needs more than rarely (e.g. after fixing a push delivery issue), so it
// lives as a small dismissable strip rather than permanent dashboard UI.
function PushReplayBanner() {
  const [state, setState] = useState("idle"); // idle | sending | done | dismissed | error
  const [count, setCount] = useState(0);

  if (state === "dismissed") return null;

  const handleClick = async () => {
    setState("sending");
    try {
      const { count } = await replayAdminPushHistory();
      setCount(count);
      setState("done");
    } catch {
      setState("error");
    }
  };

  return (
    <div className="bg-white rounded-card shadow-card p-4 mb-4 flex items-center justify-between gap-4 flex-wrap">
      {state === "done" ? (
        <p className="text-sm text-navy-900/70">
          Sent {count} order/signup push notification{count === 1 ? "" : "s"} to this device.
        </p>
      ) : state === "error" ? (
        <p className="text-sm text-status-danger">Couldn't send those — try again in a moment.</p>
      ) : (
        <p className="text-sm text-navy-900/70">
          Resend every order &amp; new-signup push notification to this device only, one time.
        </p>
      )}
      <div className="flex gap-2">
        {state !== "done" && (
          <button
            onClick={handleClick}
            disabled={state === "sending"}
            className="text-xs font-bold border border-gold-500 text-gold-500 px-3 py-2 rounded-md hover:bg-gold-500 hover:text-navy-900 transition-colors disabled:opacity-50"
          >
            {state === "sending" ? "Sending…" : "Resend to this device"}
          </button>
        )}
        <button
          onClick={() => setState("dismissed")}
          className="text-xs font-bold text-navy-900/50 px-3 py-2 rounded-md hover:bg-navy-900/5 transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="bg-white rounded-card shadow-card p-5">
      <p className="text-xs font-semibold text-navy-900/70 uppercase tracking-wide mb-1">{label}</p>
      <p className={`font-display font-bold text-2xl ${accent || "text-navy-900"}`}>{value}</p>
    </div>
  );
}

function LowStockSection({ lowStock }) {
  const [search, setSearch] = useState("");
  const visible = lowStock.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="bg-white rounded-card shadow-card p-5">
      <h3 className="font-display font-bold text-navy-900 mb-3">Low Stock</h3>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products…"
        className="input text-sm mb-3 w-full max-w-xs"
      />
      {visible.length === 0 ? (
        <p className="text-sm text-navy-900/70">Nothing low on stock right now.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((p) => (
            <div key={p.id} className="flex justify-between text-sm">
              <span className="text-navy-900/70">{p.name}</span>
              <span className="font-semibold text-status-danger">{Number(p.total_stock).toLocaleString()} bottles left</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Overview() {
  const [sales, setSales] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [repRows, setRepRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([salesReport(), inventoryReport(), repRevenueBreakdown()])
      .then(([s, i, r]) => {
        setSales(s);
        setInventory(i);
        setRepRows(r);
      })
      .catch((err) => {
        console.error("Overview failed to load:", err);
        setError(err.response?.data?.message || err.message || "Couldn't load dashboard data.");
      })
      .finally(() => setLoading(false));
  }, []);

  const salesRepTotals = useMemo(() => {
    if (!repRows) return { orders: 0, revenue: 0 };
    const reps = repRows.filter((r) => r.distributor_type === "sales_rep");
    return {
      orders: reps.reduce((sum, r) => sum + Number(r.order_count), 0),
      revenue: reps.reduce((sum, r) => sum + Number(r.revenue), 0),
    };
  }, [repRows]);

  const distributorTotals = useMemo(() => {
    if (!repRows) return { orders: 0, revenue: 0 };
    const dists = repRows.filter((r) => r.distributor_type === "distributor");
    return {
      orders: dists.reduce((sum, r) => sum + Number(r.order_count), 0),
      revenue: dists.reduce((sum, r) => sum + Number(r.revenue), 0),
    };
  }, [repRows]);

  if (loading) return <p className="text-navy-900/70">Loading overview…</p>;
  if (error) return <p className="text-status-danger">{error}</p>;

  return (
    <div>
      <PushReplayBanner />

      {/* Top-line totals — the two numbers that matter most */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Orders" value={sales.summary.order_count} />
        <StatCard
          label="Total Revenue"
          value={`₦${Number(sales.summary.total_revenue).toLocaleString()}`}
          accent="text-green-700"
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

      {/* Sales rep / distributor split */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Sales Rep Orders" value={salesRepTotals.orders} />
        <StatCard
          label="Sales Rep Revenue"
          value={`₦${salesRepTotals.revenue.toLocaleString()}`}
          accent="text-green-700"
        />
        <StatCard label="Distributor Orders" value={distributorTotals.orders} />
        <StatCard
          label="Distributor Revenue"
          value={`₦${distributorTotals.revenue.toLocaleString()}`}
          accent="text-green-700"
        />
      </div>

      <div className="mb-8">
        <LowStockSection lowStock={inventory.lowStock} />
      </div>

      {/* Revenue by State — full drill-down: state -> Sales Rep/Distributor -> individual -> their orders */}
      <div className="bg-white rounded-card shadow-card p-5 mb-8">
        <h3 className="font-display font-bold text-navy-900 mb-3">Revenue by State</h3>
        <RepRevenueDrilldown rows={repRows} />
      </div>

      {/* Sales Rep Revenue — same drill-down, locked to sales reps only */}
      <div className="bg-white rounded-card shadow-card p-5 mb-8">
        <h3 className="font-display font-bold text-navy-900 mb-3">Sales Rep Revenue</h3>
        <RepRevenueDrilldown rows={repRows} lockType="sales_rep" />
      </div>

      {/* Distributor Revenue — same drill-down, locked to distributors only */}
      <div className="bg-white rounded-card shadow-card p-5 mb-8">
        <h3 className="font-display font-bold text-navy-900 mb-3">Distributor Revenue</h3>
        <RepRevenueDrilldown rows={repRows} lockType="distributor" />
      </div>
    </div>
  );
}
