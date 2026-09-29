import { useEffect, useState } from "react";
import { listAllSalesReps, auditHierarchyLinks, reassignSalesRep, listDistributors } from "../../api/admin";

// Cross-distributor monitoring for admin — every sales rep on the
// platform, in one sortable/searchable list, regardless of which
// distributor they're under. This is purely a read (plus the reassign
// action below, also admin-only) — neither the distributor nor the sales
// rep has any way to see this page or know it was looked at. It's
// deliberately separate from each distributor's own "Sales Reps" tab in
// the Distributors list, which only shows one distributor's reps at a
// time.
export default function SalesMonitor() {
  const [reps, setReps] = useState(null);
  const [distributors, setDistributors] = useState([]);
  const [audit, setAudit] = useState(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("revenue"); // "revenue" | "customers" | "name"
  const [error, setError] = useState(null);
  const [reassigning, setReassigning] = useState(null); // rep id currently mid-action

  const refresh = () => {
    listAllSalesReps().then(setReps).catch(() => setError("Couldn't load sales reps."));
    auditHierarchyLinks().then(setAudit).catch(() => {});
    listDistributors("approved", "distributor").then(setDistributors).catch(() => {});
  };

  useEffect(refresh, []);

  if (error) return <p className="text-status-danger text-sm">{error}</p>;
  if (reps === null) return <p className="text-navy-900/70 text-sm">Loading…</p>;

  const filtered = reps.filter((r) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      r.full_name?.toLowerCase().includes(q) ||
      r.business_name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.parent_distributor_name?.toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "revenue") return Number(b.total_revenue) - Number(a.total_revenue);
    if (sortBy === "customers") return Number(b.customer_count) - Number(a.customer_count);
    return (a.full_name || "").localeCompare(b.full_name || "");
  });

  const auditCount = (audit?.orphanedCustomers?.length ?? 0) + (audit?.orphanedSalesReps?.length ?? 0);

  const handleReassign = async (repId, currentName) => {
    const select = document.getElementById(`reassign-${repId}`);
    const newDistributorId = select.value || null;
    const label = newDistributorId
      ? distributors.find((d) => d.id === newDistributorId)?.business_name || "the selected distributor"
      : "independent (no parent distributor)";
    if (!window.confirm(`Move ${currentName} to ${label}?`)) return;
    setReassigning(repId);
    try {
      await reassignSalesRep(repId, newDistributorId);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || "Couldn't reassign this sales rep.");
    } finally {
      setReassigning(null);
    }
  };

  return (
    <div>
      <h2 className="font-display font-bold text-lg text-navy-900 mb-1">Sales Monitor</h2>
      <p className="text-xs text-navy-900/45 mb-4">
        Every sales rep on the platform, across every distributor, in one place — sales performance and the option to move them to a different distributor.
      </p>

      {auditCount > 0 && (
        <div className="bg-status-danger/10 text-status-danger rounded-md px-4 py-3 mb-4 text-sm">
          <p className="font-semibold mb-1">{auditCount} link{auditCount === 1 ? "" : "s"} need attention</p>
          {audit.orphanedCustomers.map((c) => (
            <p key={c.id} className="text-xs">
              {c.full_name} is assigned to {c.distributor_name} — that distributor account is {c.distributor_status === "suspended" ? "suspended" : "removed"}.
            </p>
          ))}
          {audit.orphanedSalesReps.map((r) => (
            <p key={r.id} className="text-xs">
              {r.full_name}'s parent ({r.parent_name}) is {r.parent_status === "suspended" ? "suspended" : "no longer a true distributor"} — reassign below.
            </p>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or distributor…"
          className="flex-1 text-sm border border-navy-900/15 rounded-md px-3 py-2"
        />
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-sm border border-navy-900/15 rounded-md px-2 py-2">
          <option value="revenue">Sort: Revenue</option>
          <option value="customers">Sort: Customers</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-navy-900/70">No sales reps match.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((r) => (
            <div key={r.id} className="border border-navy-900/10 rounded-md p-3 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <p className="font-semibold text-navy-900 text-sm">{r.business_name || r.full_name}</p>
                <p className="text-xs text-navy-900/45">
                  {r.full_name} · {r.email} · under {r.parent_distributor_name || "no distributor (independent)"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-semibold text-navy-900">₦{Number(r.total_revenue).toLocaleString()}</p>
                  <p className="text-[11px] text-navy-900/45">{r.customer_count} customer{r.customer_count === "1" ? "" : "s"}</p>
                </div>
                <select id={`reassign-${r.id}`} defaultValue={r.registered_by_distributor_id || ""} className="text-xs border border-navy-900/15 rounded-md px-2 py-1.5">
                  <option value="">Independent</option>
                  {distributors.map((d) => (
                    <option key={d.id} value={d.id}>{d.business_name || d.full_name}</option>
                  ))}
                </select>
                <button
                  onClick={() => handleReassign(r.id, r.business_name || r.full_name)}
                  disabled={reassigning === r.id}
                  className="text-navy-800 font-semibold text-xs whitespace-nowrap disabled:opacity-40"
                >
                  {reassigning === r.id ? "Moving…" : "Move"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
