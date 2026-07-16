import { useEffect, useState } from "react";
import { listCustomers, listDistributors, reassignCustomerDistributor, getCustomerHistory, removeCustomer } from "../../api/admin";
import ActivityHistoryModal from "../../components/ActivityHistoryModal";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [historyFor, setHistoryFor] = useState(null); // customer id currently open in modal
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const refresh = () => listCustomers().then(setCustomers);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      refresh(),
      listDistributors("approved").then((rows) =>
        setDistributors(rows.filter((d) => d.distributor_type !== "distributor"))
      ),
    ]).finally(() => setLoading(false));
  }, []);

  const handleReassign = async (customerId, distributorId) => {
    setSavingId(customerId);
    try {
      await reassignCustomerDistributor(customerId, distributorId || null);
      await refresh();
    } finally {
      setSavingId(null);
    }
  };

  const handleRemove = async (customerId, name) => {
    if (!window.confirm(`Remove ${name}? They can sign up fresh again, but this account's history moves to Trash.`)) return;
    setRemovingId(customerId);
    try {
      await removeCustomer(customerId);
      await refresh();
    } finally {
      setRemovingId(null);
    }
  };

  const openHistory = async (customerId) => {
    setHistoryFor(customerId);
    setHistoryLoading(true);
    try {
      const data = await getCustomerHistory(customerId);
      setHistoryData(data);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistory = () => {
    setHistoryFor(null);
    setHistoryData(null);
  };

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-navy-900 mb-5">Customers</h2>

      {loading ? (
        <p className="text-navy-900/60">Loading…</p>
      ) : customers.length === 0 ? (
        <p className="text-navy-900/60">No customers yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {customers.map((c) => (
            <div
              key={c.id}
              onClick={() => openHistory(c.id)}
              className="bg-white rounded-card shadow-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div>
                <p className="font-semibold text-navy-900">
                  {c.business_name || c.full_name}
                  {c.prior_accounts_count > 0 && (
                    <span className="text-navy-900/40 font-normal"> (User {Number(c.prior_accounts_count) + 1})</span>
                  )}
                </p>
                <p className="text-xs text-navy-900/50">
                  {c.full_name} · {c.email} · {c.phone}
                </p>
                <p className="text-xs text-navy-900/50">
                  {c.delivery_address ? `${c.delivery_address}, ` : ""}
                  <span className="font-semibold">
                    {c.local_government ? `${c.local_government}, ` : ""}
                    {c.state}
                  </span>
                </p>
                {c.referred_by_distributor_id && (
                  <p className="text-[11px] text-navy-900/40 mt-0.5">
                    Originally referred by a distributor
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <span className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-green-500/15 text-green-500 whitespace-nowrap">
                  {c.status}
                </span>
                <select
                  value={c.assigned_distributor_id || ""}
                  disabled={savingId === c.id}
                  onChange={(e) => handleReassign(c.id, e.target.value)}
                  className="text-xs border border-navy-900/15 rounded-md px-2 py-1.5 disabled:opacity-50"
                >
                  <option value="">Unassigned</option>
                  {distributors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.business_name || d.full_name}
                    </option>
                  ))}
                </select>
                <button
                  disabled={removingId === c.id}
                  onClick={() => handleRemove(c.id, c.business_name || c.full_name)}
                  className="text-status-danger font-semibold text-xs disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {historyFor && (
        <ActivityHistoryModal
          type="customer"
          data={historyData}
          loading={historyLoading}
          onClose={closeHistory}
        />
      )}
    </div>
  );
}
