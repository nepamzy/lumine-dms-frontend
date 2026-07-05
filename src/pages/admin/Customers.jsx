import { useEffect, useState } from "react";
import { listCustomers } from "../../api/admin";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCustomers()
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, []);

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
            <div key={c.id} className="bg-white rounded-card shadow-card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-navy-900">
                  {c.business_name || c.full_name}
                </p>
                <p className="text-xs text-navy-900/50">
                  {c.full_name} · {c.email} · {c.phone}
                </p>
                <p className="text-xs text-navy-900/50">
                  {c.delivery_address ? `${c.delivery_address}, ` : ""}
                  <span className="font-semibold">{c.state}</span>
                </p>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-green-500/15 text-green-500">
                {c.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}