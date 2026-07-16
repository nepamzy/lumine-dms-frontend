import { useEffect, useState } from "react";
import { listTrash } from "../../api/admin";

const ROLE_LABELS = {
  customer: "Customer",
  admin: "Admin",
};

export default function Trash() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTrash()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  const roleLabel = (row) => {
    if (row.role === "customer") return "Customer";
    if (row.role === "distributor") return row.distributor_type === "distributor" ? "Distributor" : "Sales Rep";
    return row.role;
  };

  return (
    <div>
      <h2 className="font-display font-bold text-xl text-navy-900 mb-2">Trash</h2>
      <p className="text-sm text-navy-900/50 mb-5">
        Removed accounts stay here — nothing is destroyed. They can sign up fresh with the same
        details; if they do, the new account shows a "(User 2)" marker here on the admin side only.
      </p>

      {loading ? (
        <p className="text-navy-900/60">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-navy-900/60">Nothing in the trash.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <div key={r.id} className="bg-white rounded-card shadow-card p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-navy-900">
                  {r.distributor_business_name || r.customer_business_name || r.full_name}
                </p>
                <p className="text-xs text-navy-900/50">
                  {r.full_name} · {r.email} · {r.phone}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-navy-900/10 text-navy-900/60">
                  {roleLabel(r)}
                </span>
                <p className="text-[11px] text-navy-900/40 mt-1">
                  Removed {new Date(r.deleted_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
