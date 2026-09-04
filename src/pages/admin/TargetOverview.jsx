import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listDistributors, getTargetOverviewForRep } from "../../api/admin";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-card shadow-card p-5">
      <p className="text-xs font-semibold text-navy-900/70 uppercase tracking-wide mb-1">{label}</p>
      <p className="font-display font-bold text-2xl text-navy-900">{value}</p>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input text-sm mb-3 w-full max-w-xs"
    />
  );
}

// Only counts orders that reached 100% payment AND have already been
// through the monthly sweep (see backend order.service.js's
// runMonthlyTargetSweep) -- an order that hit 100% this month but hasn't
// been swept yet still lives in the normal Orders tab, not here.
export default function TargetOverview() {
  const [reps, setReps] = useState(null);
  const [repSearch, setRepSearch] = useState("");
  const [selectedRep, setSelectedRep] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(null);
  const [monthData, setMonthData] = useState(null);
  const [monthLoading, setMonthLoading] = useState(false);
  const [monthError, setMonthError] = useState(null);

  useEffect(() => {
    listDistributors("approved", "sales_rep").then(setReps);
  }, []);

  useEffect(() => {
    if (!selectedRep || !month) return;
    setMonthLoading(true);
    setMonthData(null);
    setMonthError(null);
    getTargetOverviewForRep(selectedRep.id, year, month)
      .then(setMonthData)
      .catch((err) => setMonthError(err.response?.data?.message || "Couldn't load this month's data — please try again."))
      .finally(() => setMonthLoading(false));
  }, [selectedRep, year, month]);

  const visibleReps = useMemo(() => {
    if (!reps) return [];
    return reps.filter((r) =>
      (r.business_name || r.full_name || "").toLowerCase().includes(repSearch.toLowerCase())
    );
  }, [reps, repSearch]);

  const openRep = (rep) => {
    setSelectedRep(rep);
    setMonth(null);
    setMonthData(null);
  };

  const backToReps = () => {
    setSelectedRep(null);
    setMonth(null);
    setMonthData(null);
  };

  // ---- Rep selected: year/month picker + that month's results ----
  if (selectedRep) {
    return (
      <div>
        <button onClick={backToReps} className="text-xs font-semibold text-navy-800 underline mb-3">
          ← Back to Sales Reps
        </button>
        <h3 className="font-display font-bold text-navy-900 mb-1">
          {selectedRep.business_name || selectedRep.full_name}
        </h3>
        <p className="text-xs text-navy-900/50 mb-5">{selectedRep.full_name} · {selectedRep.phone}</p>

        <div className="flex items-center gap-2 mb-4">
          <label className="text-xs font-semibold text-navy-900/70">Year</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="input text-sm w-28"
          >
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6">
          {MONTHS.map((label, i) => {
            const m = i + 1;
            return (
              <button
                key={m}
                onClick={() => setMonth(m)}
                className={`text-xs font-semibold py-2.5 rounded-md border transition-colors ${
                  month === m
                    ? "bg-navy-800 text-cream-50 border-navy-800"
                    : "bg-white text-navy-900/70 border-navy-900/15 hover:border-navy-900/30"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {!month ? (
          <p className="text-navy-900/60 text-sm">Pick a month to see that period's numbers.</p>
        ) : monthLoading ? (
          <p className="text-navy-900/60 text-sm">Loading…</p>
        ) : monthError ? (
          <p className="text-status-danger text-sm">{monthError}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard label="Total Orders" value={monthData?.summary.totalOrders ?? 0} />
              <StatCard
                label="Total Revenue"
                value={`₦${Number(monthData?.summary.totalRevenue ?? 0).toLocaleString()}`}
              />
            </div>

            {!monthData?.orders?.length ? (
              <p className="text-navy-900/60 text-sm">No completed orders for {MONTHS[month - 1]} {year} yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {monthData.orders.map((o) => (
                  <div
                    key={o.id}
                    className="border border-navy-900/10 rounded-md p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-semibold text-navy-900 text-sm">{o.order_number}</p>
                      <p className="text-xs text-navy-900/45">
                        {o.customer_business_name || o.customer_name} · paid in full{" "}
                        {new Date(o.paid_in_full_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-navy-900 text-sm whitespace-nowrap">
                        ₦{Number(o.total_amount).toLocaleString()}
                      </span>
                      <Link
                        to={`/orders/${o.id}`}
                        className="text-xs font-semibold text-navy-800 underline whitespace-nowrap"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ---- Rep list ----
  return (
    <div>
      <p className="text-sm text-navy-900/60 mb-4">
        Only orders that reached 100% payment count here, credited to whichever month they were fully paid —
        not the month they were placed.
      </p>
      <SearchInput value={repSearch} onChange={setRepSearch} placeholder="Search sales reps…" />
      {reps === null ? (
        <p className="text-navy-900/60 text-sm">Loading…</p>
      ) : visibleReps.length === 0 ? (
        <p className="text-navy-900/60 text-sm">No sales reps found.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {visibleReps.map((rep) => (
            <button
              key={rep.id}
              onClick={() => openRep(rep)}
              className="border border-navy-900/10 rounded-md p-3 flex items-center justify-between text-left hover:shadow-md transition-shadow"
            >
              <div>
                <p className="font-semibold text-navy-900 text-sm">{rep.business_name || rep.full_name}</p>
                <p className="text-xs text-navy-900/45">{rep.full_name} · {rep.phone}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
