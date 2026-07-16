import { useEffect, useState } from "react";
import { listDistributors, approveDistributor, rejectDistributor, listTerritories, getDistributorHistory } from "../../api/admin";
import ActivityHistoryModal from "../../components/ActivityHistoryModal";

// Shared list UI for both the admin "Distributors" tab and "Sales Reps"
// tab — same format for both, as requested: approved shown by default,
// pending/rejected/suspended collapsed behind an expandable section.
export default function DistributorTypeList({ distributorType, label }) {
  const [approved, setApproved] = useState([]);
  const [others, setOthers] = useState([]);
  const [showOthers, setShowOthers] = useState(false);
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyFor, setHistoryFor] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const refresh = () =>
    Promise.all([
      listDistributors("approved", distributorType).then(setApproved),
      Promise.all(
        ["pending", "rejected", "suspended"].map((s) => listDistributors(s, distributorType))
      ).then((results) => setOthers(results.flat())),
    ]);

  useEffect(() => {
    setLoading(true);
    Promise.all([refresh(), listTerritories().then(setTerritories)]).finally(() => setLoading(false));
  }, [distributorType]);

  const handleApprove = async (id, territoryId) => {
    await approveDistributor(id, territoryId || undefined);
    refresh();
  };

  const handleReject = async (id) => {
    await rejectDistributor(id);
    refresh();
  };

  const openHistory = async (id) => {
    setHistoryFor(id);
    setHistoryLoading(true);
    try {
      setHistoryData(await getDistributorHistory(id));
    } finally {
      setHistoryLoading(false);
    }
  };

  const STATUS_STYLES = {
    pending: "bg-gold-500/20 text-gold-700",
    rejected: "bg-status-danger/15 text-status-danger",
    suspended: "bg-navy-900/10 text-navy-900/60",
  };

  const Row = ({ d, showActions }) => (
    <div
      onClick={() => openHistory(d.id)}
      className="bg-white rounded-card shadow-card p-4 flex items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div>
        <p className="font-semibold text-navy-900">{d.business_name || d.full_name}</p>
        <p className="text-xs text-navy-900/50">
          {d.full_name} · {d.email} · {d.state}
          {d.local_government ? ` · ${d.local_government}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {d.approval_status !== "approved" && (
          <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full whitespace-nowrap ${STATUS_STYLES[d.approval_status]}`}>
            {d.approval_status}
          </span>
        )}
        {showActions && d.approval_status === "pending" && (
          <>
            <select id={`territory-${d.id}`} className="text-xs border border-navy-900/15 rounded-md px-2 py-1.5">
              <option value="">No territory yet</option>
              {territories.filter((t) => t.state === d.state).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              onClick={() => handleApprove(d.id, document.getElementById(`territory-${d.id}`).value)}
              className="bg-green-500 text-white font-bold text-xs px-3 py-2 rounded-md"
            >
              Approve
            </button>
            <button onClick={() => handleReject(d.id)} className="text-status-danger font-semibold text-xs">
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-navy-900 mb-5">{label}</h2>

      {loading ? (
        <p className="text-navy-900/60">Loading…</p>
      ) : (
        <>
          {approved.length === 0 ? (
            <p className="text-navy-900/60 mb-4">No approved {label.toLowerCase()} yet.</p>
          ) : (
            <div className="flex flex-col gap-3 mb-4">
              {approved.map((d) => <Row key={d.id} d={d} showActions={false} />)}
            </div>
          )}

          <button
            onClick={() => setShowOthers((s) => !s)}
            className="text-sm font-semibold text-navy-800 flex items-center gap-1.5 mb-3"
          >
            <span className={`transition-transform inline-block ${showOthers ? "rotate-180" : ""}`}>▼</span>
            {showOthers ? "Hide" : "Show"} pending / rejected / suspended ({others.length})
          </button>

          {showOthers && (
            <div className="flex flex-col gap-3">
              {others.length === 0 ? (
                <p className="text-navy-900/50 text-sm">Nothing else here.</p>
              ) : (
                others.map((d) => <Row key={d.id} d={d} showActions={true} />)
              )}
            </div>
          )}
        </>
      )}

      {historyFor && (
        <ActivityHistoryModal
          type="distributor"
          data={historyData}
          loading={historyLoading}
          onClose={() => { setHistoryFor(null); setHistoryData(null); }}
        />
      )}
    </div>
  );
}
