import { useEffect, useState } from "react";
import { listCustomers, listDistributors, reassignCustomerDistributor } from "../../api/admin";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const refresh = () => listCustomers().then(setCustomers);

  useEffect(() => {
    setLoading(true);
    Promise.all([refresh(), listDistributors("approved").then(setDistributors)]).finally(() =>
      setLoading(false)
    );
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
            <div key={c.id} className="bg-white rounded-card shadow-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-navy-900">
                  {c.business_name || c.full_name}
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

              <div className="flex items-center gap-2">
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
