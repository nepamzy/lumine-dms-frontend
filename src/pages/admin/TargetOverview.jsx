import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listDistributors, listRepCycles, getTargetOverviewForRep } from "../../api/admin";

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

const formatDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

// One cycle in the picker — a rep's own "month," running from their
// approval day-of-month to the same day next month. The current cycle's
// start/end dates are marked green so admin can see at a glance exactly
// which window is still running, since that's different for every rep.
function CyclePicker({ cycles, selectedIndex, onSelect }) {
  return (
    <div className="flex flex-col gap-2 mb-6">
      {cycles
        .slice()
        .reverse()
        .map((c) => {
          const isSelected = c.index === selectedIndex;
          return (
            <button
              key={c.index}
              onClick={() => onSelect(c.index)}
              className={`text-left text-sm rounded-md border px-4 py-3 transition-colors ${
                isSelected
                  ? "bg-navy-800 border-navy-800 text-cream-50"
                  : "bg-white border-navy-900/15 hover:border-navy-900/30 text-navy-900"
              }`}
            >
              <span className={isSelected ? "text-cream-50" : c.isCurrent ? "text-green-700 font-bold" : "text-navy-900"}>
                {formatDate(c.start)}
              </span>
              <span className={isSelected ? "text-cream-50/70" : "text-navy-900/40"}> → </span>
              <span className={isSelected ? "text-cream-50" : c.isCurrent ? "text-green-700 font-bold" : "text-navy-900"}>
                {formatDate(c.end)}
              </span>
              {c.isCurrent && (
                <span
                  className={`ml-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                    isSelected ? "bg-cream-50/20 text-cream-50" : "bg-green-700/10 text-green-700"
                  }`}
                >
                  Current
                </span>
              )}
            </button>
          );
        })}
    </div>
  );
}

// Packs, not order count, are what a rep is actually paid against (target:
// 30 packs/cycle) -- one order can be a quarter pack or dozens, so order
// count alone was never a real stand-in for packs sold.
const formatPacks = (n) => {
  const num = Number(n);
  return Number.isInteger(num) ? String(num) : num.toFixed(2).replace(/\.?0+$/, "");
};

export default function TargetOverview() {
  const [reps, setReps] = useState(null);
  const [repSearch, setRepSearch] = useState("");
  const [selectedRep, setSelectedRep] = useState(null);

  const [cycles, setCycles] = useState(null);
  const [cyclesError, setCyclesError] = useState(null);
  const [selectedCycleIndex, setSelectedCycleIndex] = useState(null);

  const [cycleData, setCycleData] = useState(null);
  const [cycleLoading, setCycleLoading] = useState(false);
  const [cycleError, setCycleError] = useState(null);

  useEffect(() => {
    listDistributors("approved", "sales_rep").then(setReps);
  }, []);

  useEffect(() => {
    if (!selectedRep) return;
    setCycles(null);
    setCyclesError(null);
    listRepCycles(selectedRep.id)
      .then((list) => {
        setCycles(list);
        // Default to the current (or most recent) cycle.
        const current = list.find((c) => c.isCurrent) ?? list[list.length - 1];
        setSelectedCycleIndex(current?.index ?? null);
      })
      .catch((err) => setCyclesError(err.response?.data?.message || "Couldn't load this rep's cycles."));
  }, [selectedRep]);

  useEffect(() => {
    if (!selectedRep || selectedCycleIndex == null) return;
    setCycleLoading(true);
    setCycleData(null);
    setCycleError(null);
    getTargetOverviewForRep(selectedRep.id, selectedCycleIndex)
      .then(setCycleData)
      .catch((err) => setCycleError(err.response?.data?.message || "Couldn't load this cycle's data — please try again."))
      .finally(() => setCycleLoading(false));
  }, [selectedRep, selectedCycleIndex]);

  const visibleReps = useMemo(() => {
    if (!reps) return [];
    return reps.filter((r) =>
      (r.business_name || r.full_name || "").toLowerCase().includes(repSearch.toLowerCase())
    );
  }, [reps, repSearch]);

  const openRep = (rep) => {
    setSelectedRep(rep);
    setSelectedCycleIndex(null);
    setCycleData(null);
  };

  const backToReps = () => {
    setSelectedRep(null);
    setCycles(null);
    setSelectedCycleIndex(null);
    setCycleData(null);
  };

  // ---- Rep selected: their own cycle picker + that cycle's results ----
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

        {cyclesError ? (
          <p className="text-status-danger text-sm">{cyclesError}</p>
        ) : !cycles ? (
          <p className="text-navy-900/60 text-sm">Loading…</p>
        ) : (
          <>
            <p className="text-xs text-navy-900/50 mb-2">
              Each cycle runs from this rep's own approval date — the <span className="text-green-700 font-bold">green</span> dates below are the one still running.
            </p>
            <CyclePicker cycles={cycles} selectedIndex={selectedCycleIndex} onSelect={setSelectedCycleIndex} />
          </>
        )}

        {selectedCycleIndex == null ? null : cycleLoading ? (
          <p className="text-navy-900/60 text-sm">Loading…</p>
        ) : cycleError ? (
          <p className="text-status-danger text-sm">{cycleError}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <StatCard label="Total Packs Sold" value={formatPacks(cycleData?.summary.totalPacks ?? 0)} />
              <StatCard
                label="Total Revenue"
                value={`₦${Number(cycleData?.summary.totalRevenue ?? 0).toLocaleString()}`}
              />
            </div>

            {!cycleData?.orders?.length ? (
              <p className="text-navy-900/60 text-sm">No completed orders in this cycle yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {cycleData.orders.map((o) => (
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
                      <span className="text-xs text-navy-900/60 whitespace-nowrap">{formatPacks(o.packs)} packs</span>
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
        Only orders that reached 100% payment count here, credited to whichever cycle they were fully paid in —
        not the one they were placed in. Each rep's cycle runs on their own approval date, not the calendar month.
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
