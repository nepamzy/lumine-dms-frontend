import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getDistributorHistory } from "../api/admin";

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

// rows = repRevenueBreakdown() output: one row per rep/distributor with
// state, distributor_type, revenue, order_count, completed_count, pending_count.
//
// lockType: null shows every state with Sales Rep/Distributor tabs at
// level 2; "sales_rep" or "distributor" skips straight from state to that
// type's individuals (used by the Sales Rep Revenue / Distributor Revenue
// subsections, which reuse this exact same component).
export default function RepRevenueDrilldown({ rows, lockType = null }) {
  const [state, setState] = useState(null);
  const [repType, setRepType] = useState(lockType);
  const [individual, setIndividual] = useState(null); // { distributor_id, full_name, ... }
  const [orders, setOrders] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [individualSearch, setIndividualSearch] = useState("");

  useEffect(() => {
    if (!individual) return;
    setOrdersLoading(true);
    getDistributorHistory(individual.distributor_id)
      .then((data) => setOrders(data.orders || []))
      .finally(() => setOrdersLoading(false));
  }, [individual]);

  const filteredRows = lockType ? rows.filter((r) => r.distributor_type === lockType) : rows;

  // Level 1 — states
  const byState = useMemo(() => {
    const map = {};
    for (const r of filteredRows) {
      if (!map[r.state]) map[r.state] = { state: r.state, revenue: 0, order_count: 0 };
      map[r.state].revenue += Number(r.revenue);
      map[r.state].order_count += Number(r.order_count);
    }
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filteredRows]);

  const visibleStates = byState.filter((s) => s.state?.toLowerCase().includes(stateSearch.toLowerCase()));

  // Level 3 — individuals within the chosen state (+ type, if applicable)
  const individuals = useMemo(() => {
    if (!state) return [];
    return filteredRows
      .filter((r) => r.state === state && (!repType || r.distributor_type === repType))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filteredRows, state, repType]);

  const visibleIndividuals = individuals.filter((i) =>
    (i.business_name || i.full_name || "").toLowerCase().includes(individualSearch.toLowerCase())
  );

  const reset = () => {
    setState(null);
    setRepType(lockType);
    setIndividual(null);
    setOrders(null);
    setStateSearch("");
    setIndividualSearch("");
  };

  // ---- Level 4: an individual's orders ----
  if (individual) {
    return (
      <div>
        <button onClick={() => setIndividual(null)} className="text-xs font-semibold text-navy-800 underline mb-3">
          ← Back to {repType === "distributor" ? "Distributors" : "Sales Reps"} in {state}
        </button>
        <h4 className="font-display font-bold text-navy-900 mb-1">
          {individual.business_name || individual.full_name}
        </h4>
        <p className="text-xs text-navy-900/70 mb-4">
          ₦{Number(individual.revenue).toLocaleString()} total · {individual.completed_count} completed ·{" "}
          {individual.pending_count} pending
        </p>
        {ordersLoading ? (
          <p className="text-navy-900/70 text-sm">Loading orders…</p>
        ) : !orders || orders.length === 0 ? (
          <p className="text-navy-900/70 text-sm">No orders found.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {orders.map((o) => (
              <div key={o.id} className="border border-navy-900/10 rounded-md p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy-900 text-sm">{o.order_number}</p>
                  <p className="text-xs text-navy-900/45">
                    {new Date(o.created_at).toLocaleDateString()} · ₦{Number(o.total_amount).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full whitespace-nowrap ${
                      Number(o.payment_percent) >= 100 ? "bg-green-500/15 text-green-700" : "bg-navy-900/10 text-navy-900/70"
                    }`}
                  >
                    {Number(o.payment_percent) >= 100 ? "Complete" : "Pending"}
                  </span>
                  <Link to={`/orders/${o.id}`} className="text-xs font-semibold text-navy-800 underline whitespace-nowrap">
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- Level 3: individuals in a state (+ type) ----
  if (state) {
    return (
      <div>
        <button onClick={() => { setState(null); setRepType(lockType); }} className="text-xs font-semibold text-navy-800 underline mb-3">
          ← Back to states
        </button>
        <h4 className="font-display font-bold text-navy-900 mb-3">{state}</h4>

        {!lockType && (
          <div className="flex gap-2 mb-4">
            {["sales_rep", "distributor"].map((t) => (
              <button
                key={t}
                onClick={() => setRepType(t)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                  repType === t ? "bg-navy-800 text-cream-50" : "bg-navy-900/5 text-navy-900/70"
                }`}
              >
                {t === "sales_rep" ? "Sales Reps" : "Distributors"}
              </button>
            ))}
          </div>
        )}

        {repType ? (
          <>
            <SearchInput value={individualSearch} onChange={setIndividualSearch} placeholder="Search by name…" />
            {visibleIndividuals.length === 0 ? (
              <p className="text-navy-900/70 text-sm">None found.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {visibleIndividuals.map((i) => (
                  <button
                    key={i.distributor_id}
                    onClick={() => setIndividual(i)}
                    className="border border-navy-900/10 rounded-md p-3 flex items-center justify-between text-left hover:shadow-md transition-shadow"
                  >
                    <div>
                      <p className="font-semibold text-navy-900 text-sm">{i.business_name || i.full_name}</p>
                      <p className="text-xs text-navy-900/45">
                        {i.completed_count} completed · {i.pending_count} pending
                      </p>
                    </div>
                    <span className="font-semibold text-navy-900 text-sm">₦{Number(i.revenue).toLocaleString()}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="text-navy-900/70 text-sm">Pick Sales Reps or Distributors above.</p>
        )}
      </div>
    );
  }

  // ---- Level 1: states ----
  return (
    <div>
      <SearchInput value={stateSearch} onChange={setStateSearch} placeholder="Search states…" />
      {visibleStates.length === 0 ? (
        <p className="text-navy-900/70 text-sm">No revenue recorded yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {visibleStates.map((s) => (
            <button
              key={s.state}
              onClick={() => setState(s.state)}
              className="border border-navy-900/10 rounded-md p-3 flex items-center justify-between text-left hover:shadow-md transition-shadow"
            >
              <span className="font-semibold text-navy-900 text-sm">{s.state}</span>
              <span className="text-sm text-navy-900/70">₦{s.revenue.toLocaleString()} · {s.order_count} orders</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
