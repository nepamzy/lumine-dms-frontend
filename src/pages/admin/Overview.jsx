import { useEffect, useMemo, useState } from "react";
import { salesReport, inventoryReport, repRevenueBreakdown, userTotals, monthlyRevenue } from "../../api/admin";
import RepRevenueDrilldown from "../../components/RepRevenueDrilldown";

// Rounded-top-only bar path, anchored flat to the baseline — a plain
// four-corner rounded rect looks wrong sitting on an axis line.
function roundedTopBarPath(x, y, w, h, r) {
  if (h <= 0) return "";
  const radius = Math.min(r, h, w / 2);
  return `M${x},${y + h} L${x},${y + radius} Q${x},${y} ${x + radius},${y} L${x + w - radius},${y} Q${x + w},${y} ${x + w},${y + radius} L${x + w},${y + h} Z`;
}

// Rounds a scale ceiling up to a clean step (1/2/2.5/5/10 x a power of ten)
// so gridlines read as whole, sensible numbers instead of an arbitrary max.
function niceAxisMax(rawMax) {
  if (rawMax <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (rawMax <= step * magnitude) return step * magnitude;
  }
  return 10 * magnitude;
}

function formatMonth(yyyyMm) {
  const [y, m] = yyyyMm.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

// Actual money collected, by month — a single series, so no legend (the
// heading names it); every bar gets a direct value label since a monthly
// series rarely has more than a dozen points to label.
function MonthlyRevenueChart({ data }) {
  const [hovered, setHovered] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-card shadow-card p-5">
        <h3 className="font-display font-bold text-navy-900 mb-1">Monthly Revenue</h3>
        <p className="text-sm text-navy-900/70">No payments recorded yet — this fills in as revenue comes in.</p>
      </div>
    );
  }

  const width = 640;
  const height = 260;
  const padding = { top: 30, right: 12, bottom: 34, left: 12 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 0);
  const axisMax = niceAxisMax(maxRevenue || 1);
  const gridFractions = [0, 0.25, 0.5, 0.75, 1];

  const barGap = 14;
  const barWidth = Math.min(64, (plotWidth - barGap * (data.length - 1)) / data.length);
  const totalBarsWidth = barWidth * data.length + barGap * (data.length - 1);
  const startX = padding.left + Math.max(0, (plotWidth - totalBarsWidth) / 2);

  // Nigerian convention: K = thousand, M = million. The million tier was
  // missing before — a figure like ₦1,674,300 was showing as "₦1674.3k"
  // instead of "₦1.7M", which is correct but easy to misread as a number
  // over a thousand times too large at a glance.
  const formatNaira = (n) => {
    if (n >= 1_000_000) return `₦${(n / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`;
    if (n >= 1000) return `₦${(n / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k`;
    return `₦${Math.round(n)}`;
  };

  const first = data[0].revenue;
  const last = data[data.length - 1].revenue;
  const trendWord = data.length < 2 ? "" : last > first ? "trending up" : last < first ? "trending down" : "flat";
  const summary = `Monthly revenue from ${formatMonth(data[0].month)} to ${formatMonth(data[data.length - 1].month)}, ${trendWord}. Highest month: ${formatNaira(maxRevenue)}.`;

  return (
    <div className="bg-white rounded-card shadow-card p-5">
      <h3 className="font-display font-bold text-navy-900 mb-1">Monthly Revenue</h3>
      <p className="text-xs text-navy-900/60 mb-4">Actual payments collected, by month</p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label={summary}
      >
        {gridFractions.map((f) => {
          const value = axisMax * f;
          const y = padding.top + plotHeight - f * plotHeight;
          return (
            <g key={f}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="#0A2D6F"
                strokeOpacity={0.08}
                strokeWidth={1}
              />
              <text x={padding.left} y={y - 4} fontSize={9} fill="#0A2D6F" fillOpacity={0.45}>
                {formatNaira(value)}
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const barHeight = (d.revenue / axisMax) * plotHeight;
          const x = startX + i * (barWidth + barGap);
          const y = padding.top + plotHeight - barHeight;
          const isHovered = hovered === i;
          return (
            <g
              key={d.month}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            >
              {/* Wider invisible hit area — easier to hover than the bar alone */}
              <rect
                x={x - barGap / 2}
                y={padding.top}
                width={barWidth + barGap}
                height={plotHeight}
                fill="transparent"
              />
              <path d={roundedTopBarPath(x, y, barWidth, Math.max(barHeight, 2), 4)} fill={isHovered ? "#0A2D6F" : "#0F4DB8"} />
              <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fontSize={10} fontWeight={700} fill="#0A2D6F">
                {formatNaira(d.revenue)}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 16}
                textAnchor="middle"
                fontSize={10}
                fill="#0A2D6F"
                fillOpacity={0.7}
              >
                {formatMonth(d.month)}
              </text>
            </g>
          );
        })}
      </svg>
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
  const [userCounts, setUserCounts] = useState(null);
  const [revenueByMonth, setRevenueByMonth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([salesReport(), inventoryReport(), repRevenueBreakdown(), userTotals(), monthlyRevenue()])
      .then(([s, i, r, u, m]) => {
        setSales(s);
        setInventory(i);
        setRepRows(r);
        setUserCounts(u);
        setRevenueByMonth(m);
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

      {/* Total Users — every account on the platform, by role */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={userCounts.total} accent="text-navy-900" />
        <StatCard label="Customers" value={userCounts.customers} />
        <StatCard label="Distributors" value={userCounts.distributors} />
        <StatCard label="Sales Reps" value={userCounts.salesReps} />
      </div>

      <div className="mb-8">
        <MonthlyRevenueChart data={revenueByMonth} />
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
