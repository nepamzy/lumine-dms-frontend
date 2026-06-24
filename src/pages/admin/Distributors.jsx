import { useEffect, useState } from "react";
import { listDistributors, approveDistributor, rejectDistributor, listTerritories } from "../../api/admin";

export default function Distributors() {
  const [distributors, setDistributors] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  const refresh = () => listDistributors(filter).then(setDistributors);

  useEffect(() => {
    setLoading(true);
    Promise.all([refresh(), listTerritories().then(setTerritories)]).finally(() => setLoading(false));
  }, [filter]);

  const handleApprove = async (id, territoryId) => {
    await approveDistributor(id, territoryId || undefined);
    refresh();
  };

  const handleReject = async (id) => {
    await rejectDistributor(id);
    refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-xl text-navy-900">Distributors</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input w-auto">
          <option value="pending">Pending approval</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading ? (
        <p className="text-navy-900/60">Loading…</p>
      ) : distributors.length === 0 ? (
        <p className="text-navy-900/60">Nothing here right now.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {distributors.map((d) => (
            <div key={d.id} className="bg-white rounded-card shadow-card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-navy-900">{d.business_name || d.full_name}</p>
                <p className="text-xs text-navy-900/50">
                  {d.full_name} · {d.email} · {d.state}
                </p>
              </div>

              {filter === "pending" && (
                <div className="flex items-center gap-2">
                  <select id={`territory-${d.id}`} className="text-xs border border-navy-900/15 rounded-md px-2 py-1.5">
                    <option value="">No territory yet</option>
                    {territories
                      .filter((t) => t.state === d.state)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() =>
                      handleApprove(d.id, document.getElementById(`territory-${d.id}`).value)
                    }
                    className="bg-green-500 text-white font-bold text-xs px-3 py-2 rounded-md"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(d.id)}
                    className="text-status-danger font-semibold text-xs"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
