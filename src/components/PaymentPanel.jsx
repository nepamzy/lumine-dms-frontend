import { useState } from "react";
import { getPaymentBand, getPaymentBandStyles } from "../utils/paymentStatus";
import { logPayment } from "../api/orders";

// Full payment picture for one order: color-coded status, running history
// log, and (for the buyer only) a form to log a new payment. Distributors
// see a note about the 70%-per-payment floor; customers can pay any amount.
export default function PaymentPanel({ order, canPay, onUpdated }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const percent = order.payment.percent;
  const band = getPaymentBand(percent);
  const styles = getPaymentBandStyles(band);
  const remaining = Math.max(0, Number(order.total_amount) - order.payment.totalPaid);
  const minDistributorPayment = order.buyerKind === "distributor" ? 0.7 * Number(order.total_amount) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      await logPayment(order.id, value, note || undefined);
      setAmount("");
      setNote("");
      onUpdated?.();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't log that payment");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-card shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-navy-900">Payment</h3>
        <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${styles.bg} ${styles.text}`}>
          {percent.toFixed(0)}% paid
        </span>
      </div>

      <div className="flex justify-between text-sm text-navy-900/70 mb-1">
        <span>Paid so far</span>
        <span className="font-semibold text-navy-900">₦{order.payment.totalPaid.toLocaleString()}</span>
      </div>
      <div className="flex justify-between text-sm text-navy-900/70 mb-4">
        <span>Remaining</span>
        <span className="font-semibold text-navy-900">₦{remaining.toLocaleString()}</span>
      </div>

      <div className="w-full h-2 bg-navy-900/10 rounded-full mb-5 overflow-hidden">
        <div
          className={`h-full rounded-full ${styles.solid}`}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>

      {order.payment.payments.length > 0 && (
        <div className="mb-5">
          <p className="text-xs font-semibold text-navy-900/60 mb-2">Payment history</p>
          <div className="flex flex-col gap-2">
            {order.payment.payments.map((p) => (
              <div key={p.id} className="flex justify-between text-xs text-navy-900/60 border-b border-navy-900/5 pb-1.5">
                <span>
                  {new Date(p.recorded_at).toLocaleDateString()} — {p.recorded_by_name}
                  {p.note ? ` (${p.note})` : ""}
                </span>
                <span className="font-semibold text-navy-900">₦{Number(p.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {canPay && percent < 100 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-3 border-t border-navy-900/10">
          {order.buyerKind === "distributor" && percent < 70 && (
            <p className="text-xs text-navy-900/50">
              Payments must be at least 70% of the order total (₦{minDistributorPayment.toLocaleString()}) unless it's your final top-up.
            </p>
          )}
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input flex-1 text-sm"
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="input flex-1 text-sm"
            />
          </div>
          {error && <p className="text-status-danger text-xs">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-gold-500 text-navy-900 font-bold text-sm py-2.5 rounded-md hover:bg-gold-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "Logging…" : "Log Payment"}
          </button>
        </form>
      )}
    </div>
  );
}
