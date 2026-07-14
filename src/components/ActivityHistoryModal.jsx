const PAYMENT_STYLES = {
  successful: "bg-green-500/15 text-green-500",
  initiated: "bg-gold-500/20 text-gold-700",
  failed: "bg-red-500/15 text-red-500",
  refunded: "bg-navy-900/10 text-navy-900/60",
};

function PaymentBadge({ status }) {
  const label = status || "no payment";
  const style = PAYMENT_STYLES[status] || "bg-navy-900/10 text-navy-900/50";
  return (
    <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full whitespace-nowrap ${style}`}>
      {label === "successful" ? "Paid ✓" : label === "initiated" ? "Payment pending" : label === "failed" ? "Payment failed" : label}
    </span>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-navy-900/[0.03] rounded-md px-4 py-3 text-center">
      <p className="font-display font-extrabold text-xl text-navy-900">{value}</p>
      <p className="text-[11px] text-navy-900/50 mt-0.5">{label}</p>
    </div>
  );
}

// Shared detail view for both a customer's and a distributor's full activity
// history — every order, whether payment actually went through, and
// delivery status. `type` controls a couple of label differences only;
// the shape of `data` ({ profile, orders, summary }) is otherwise the same.
export default function ActivityHistoryModal({ type, data, loading, onClose }) {
  const isDistributor = type === "distributor";

  return (
    <div className="fixed inset-0 bg-navy-900/50 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-card w-full max-w-2xl mt-8 mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-900/10">
          <h3 className="font-display font-bold text-lg text-navy-900">
            {loading ? "Loading…" : data?.profile?.business_name || data?.profile?.full_name}
          </h3>
          <button onClick={onClose} className="text-navy-900/40 hover:text-navy-900 text-xl leading-none">
            ×
          </button>
        </div>

        {loading || !data ? (
          <p className="px-6 py-10 text-center text-navy-900/50">Loading activity history…</p>
        ) : (
          <div className="px-6 py-5">
            {/* Profile summary */}
            <div className="text-sm text-navy-900/70 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              <p><span className="text-navy-900/45">Contact:</span> {data.profile.full_name}</p>
              <p><span className="text-navy-900/45">Email:</span> {data.profile.email}</p>
              <p><span className="text-navy-900/45">Phone:</span> {data.profile.phone}</p>
              <p>
                <span className="text-navy-900/45">Location:</span>{" "}
                {data.profile.local_government ? `${data.profile.local_government}, ` : ""}
                {data.profile.state}
              </p>
              {isDistributor ? (
                <>
                  <p><span className="text-navy-900/45">Referral code:</span> {data.profile.referral_code}</p>
                  <p><span className="text-navy-900/45">Approval:</span> {data.profile.approval_status}</p>
                </>
              ) : (
                data.profile.assigned_distributor_name && (
                  <p className="sm:col-span-2">
                    <span className="text-navy-900/45">Assigned distributor:</span>{" "}
                    {data.profile.assigned_distributor_name} ({data.profile.assigned_distributor_full_name})
                  </p>
                )
              )}
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              <StatCard label="Total orders" value={data.summary.totalOrders} />
              <StatCard
                label={isDistributor ? "Revenue" : "Total spent"}
                value={`₦${(isDistributor ? data.summary.totalRevenue : data.summary.totalSpent).toLocaleString()}`}
              />
              <StatCard label="Pending payment" value={data.summary.pendingPayments} />
              <StatCard label="Failed payment" value={data.summary.failedPayments} />
            </div>

            {/* Orders list */}
            <h4 className="font-display font-bold text-navy-900 mb-3">Order history</h4>
            {data.orders.length === 0 ? (
              <p className="text-sm text-navy-900/50">No orders yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {data.orders.map((o) => (
                  <div key={o.id} className="border border-navy-900/10 rounded-md p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-navy-900 text-sm">{o.order_number}</p>
                        <p className="text-xs text-navy-900/45">
                          {new Date(o.created_at).toLocaleDateString()} ·{" "}
                          {isDistributor ? o.customer_business_name || o.customer_full_name : o.distributor_business_name}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-navy-900/10 text-navy-900/60 whitespace-nowrap">
                          {o.status}
                        </span>
                        <PaymentBadge status={o.payment_status} />
                      </div>
                    </div>

                    <ul className="text-xs text-navy-900/60 mb-2">
                      {o.items.map((item, idx) => (
                        <li key={idx}>
                          {item.quantity} × {item.productName} — ₦{Number(item.lineTotal).toLocaleString()}
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-center justify-between text-xs text-navy-900/45">
                      <span>
                        {o.delivery_status ? `Delivery: ${o.delivery_status}` : "Not yet out for delivery"}
                      </span>
                      <span className="font-semibold text-navy-900">
                        ₦{Number(o.total_amount).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
