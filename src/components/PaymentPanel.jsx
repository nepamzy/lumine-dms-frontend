import { useState } from "react";
import { getPaymentBand, getPaymentBandStyles } from "../utils/paymentStatus";
import { initializePayment, logPayment, verifyPayment } from "../api/orders";
import { downloadPaymentReceipt, downloadOrderReceipt } from "../utils/receipt";
import { grossUpForPaystackFee } from "../utils/paystackFee";

const STATUS_LABELS = {
  pending: "Awaiting confirmation",
  successful: "Confirmed",
  failed: "Failed",
};
const STATUS_STYLES = {
  pending: "text-gold-700",
  successful: "text-green-700",
  failed: "text-status-danger",
};

// Full payment picture for one order: color-coded status, running history
// log (including in-progress/failed attempts for transparency), and — for
// the buyer only — a form to start a real Paystack payment. Nothing here
// ever marks itself "paid" on its own; every successful row was confirmed
// directly with Paystack.
export default function PaymentPanel({ order, canPay, onUpdated, showReceipts = false, generatedFor = "Customer copy", isAdmin = false }) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [manualMode, setManualMode] = useState("amount"); // "amount" | "percent"
  const [manualValue, setManualValue] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState(null);

  // Which payment row (by id) is currently being re-checked against
  // Paystack, and what the last recheck said — lets a buyer or admin force
  // a fresh check on a "Failed" or "Awaiting confirmation" row instead of
  // trusting whatever the site happened to record the first time.
  const [rechecking, setRechecking] = useState(null);
  const [recheckNote, setRecheckNote] = useState({});

  const percent = order.payment.percent;
  const band = getPaymentBand(percent);
  const styles = getPaymentBandStyles(band);
  const remaining = Math.max(0, Number(order.total_amount) - order.payment.totalPaid);

  // Only the FIRST successful payment on an order needs to clear a minimum
  // floor (60% for a customer, 85% for a distributor) — once that's in,
  // later top-ups can be any amount, so this hint only shows before any
  // payment has landed. Sales reps have their own full-payment-only rule,
  // not a floor, so they're excluded here.
  const firstPaymentMinPercent =
    order.buyerKind === "distributor" ? 85 : order.buyerKind === "customer" ? 60 : null;
  const firstPaymentMinAmount = firstPaymentMinPercent ? (firstPaymentMinPercent / 100) * Number(order.total_amount) : 0;
  const showFirstPaymentHint = firstPaymentMinPercent && order.payment.totalPaid === 0;

  // This order's buyer chain belongs to a distributor — payment splits
  // 100% to their Paystack subaccount, and (see payment.service.js) the
  // charge is grossed up so the buyer, not the distributor, covers
  // Paystack's fee. Mirrored here purely for display, so the buyer sees
  // the real total before redirecting to Paystack.
  const isSplitPayment = !!order.registered_under_distributor_id;
  const enteredAmount = Number(amount);
  const estimatedCharge = enteredAmount > 0 ? grossUpForPaystackFee(enteredAmount) : 0;
  const estimatedFee = estimatedCharge - enteredAmount;

  const handlePay = async (e) => {
    e.preventDefault();
    setError(null);
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setSubmitting(true);
    try {
      const { authorizationUrl } = await initializePayment(order.id, value);
      window.location.href = authorizationUrl; // full redirect to Paystack's hosted checkout
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't start payment");
      setSubmitting(false);
    }
  };

  // Re-asks Paystack directly whether this specific payment actually went
  // through — the same check the backend does automatically, just
  // triggered on demand. Useful exactly for the case where money reached
  // Paystack but the site's one-shot check missed it and marked it Failed.
  const handleRecheck = async (payment) => {
    if (!payment.paystack_reference) return;
    setRechecking(payment.id);
    setRecheckNote((prev) => ({ ...prev, [payment.id]: null }));
    try {
      const { paymentStatus } = await verifyPayment(payment.paystack_reference);
      await onUpdated?.();
      if (paymentStatus === "successful") {
        setRecheckNote((prev) => ({ ...prev, [payment.id]: "Confirmed — this payment has now been marked successful." }));
      } else if (paymentStatus === "pending") {
        setRecheckNote((prev) => ({ ...prev, [payment.id]: "Paystack hasn't given a final answer yet — try again shortly." }));
      } else {
        setRecheckNote((prev) => ({ ...prev, [payment.id]: "Paystack confirms this one didn't go through." }));
      }
    } catch (err) {
      setRecheckNote((prev) => ({ ...prev, [payment.id]: "Couldn't reach Paystack right now — try again in a moment." }));
    } finally {
      setRechecking(null);
    }
  };

  const handleManualLog = async (e) => {
    e.preventDefault();
    setManualError(null);
    const value = Number(manualValue);
    if (!value || value <= 0) {
      setManualError(`Enter a valid ${manualMode === "percent" ? "percentage" : "amount"}`);
      return;
    }
    setManualSubmitting(true);
    try {
      await logPayment(
        order.id,
        manualMode === "amount" ? value : undefined,
        manualNote || undefined,
        manualMode === "percent" ? value : undefined
      );
      setManualValue("");
      setManualNote("");
      await onUpdated?.();
    } catch (err) {
      setManualError(err.response?.data?.message || "Couldn't authorize this payment");
    } finally {
      setManualSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-card shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-navy-900">Payment</h3>
        <div className="flex items-center gap-2">
          {showReceipts && (
            <button
              onClick={() => downloadOrderReceipt(order, { generatedFor })}
              className="text-[11px] font-semibold text-navy-800 underline"
            >
              Download Invoice
            </button>
          )}
          <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${styles.bg} ${styles.text}`}>
            {percent.toFixed(0)}% paid
          </span>
        </div>
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
          <p className="text-xs font-semibold text-navy-900/70 mb-2">Payment history</p>
          <div className="flex flex-col gap-2">
            {order.payment.payments.map((p) => (
              <div key={p.id} className="flex flex-col gap-0.5 border-b border-navy-900/5 pb-1.5">
                <div className="flex justify-between items-center text-xs text-navy-900/70">
                  <span>
                    {new Date(p.recorded_at).toLocaleDateString()} — {p.recorded_by_name}
                    {" · "}
                    <span className={`font-semibold ${STATUS_STYLES[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-navy-900">₦{Number(p.amount).toLocaleString()}</span>
                    {showReceipts && p.status === "successful" && (
                      <button
                        onClick={() => downloadPaymentReceipt(order, p, { generatedFor })}
                        className="text-[10px] font-semibold text-navy-800 underline"
                      >
                        Receipt
                      </button>
                    )}
                    {(p.status === "failed" || p.status === "pending") && p.paystack_reference && (
                      <button
                        onClick={() => handleRecheck(p)}
                        disabled={rechecking === p.id}
                        className="text-[10px] font-semibold text-navy-800 underline disabled:opacity-50"
                      >
                        {rechecking === p.id ? "Checking…" : "Recheck with Paystack"}
                      </button>
                    )}
                  </span>
                </div>
                {recheckNote[p.id] && (
                  <p className="text-[10px] text-navy-900/70 text-right">{recheckNote[p.id]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && percent < 100 && (
        <form onSubmit={handleManualLog} className="flex flex-col gap-2 pt-3 border-t border-navy-900/10 mt-3">
          <p className="text-xs font-semibold text-navy-900/70">
            Admin: authorize payment directly (bypasses Paystack — marks it successful immediately)
          </p>
          <div className="flex gap-2">
            <select
              value={manualMode}
              onChange={(e) => setManualMode(e.target.value)}
              className="input text-sm w-32"
            >
              <option value="amount">Amount (₦)</option>
              <option value="percent">Percent (%)</option>
            </select>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder={manualMode === "percent" ? "e.g. 40" : "e.g. 15000"}
              value={manualValue}
              onChange={(e) => setManualValue(e.target.value)}
              className="input text-sm flex-1"
            />
          </div>
          <input
            type="text"
            placeholder="Note (optional)"
            value={manualNote}
            onChange={(e) => setManualNote(e.target.value)}
            className="input text-sm"
          />
          {manualError && <p className="text-status-danger text-xs">{manualError}</p>}
          <button
            type="submit"
            disabled={manualSubmitting}
            className="bg-navy-800 text-cream-50 font-bold text-sm py-2.5 rounded-md disabled:opacity-50"
          >
            {manualSubmitting ? "Authorizing…" : "Authorize Payment"}
          </button>
        </form>
      )}

      {canPay && percent < 100 && (
        <form onSubmit={handlePay} className="flex flex-col gap-2 pt-3 border-t border-navy-900/10">
          {showFirstPaymentHint && (
            <p className="text-xs text-navy-900/70">
              Your first payment must be at least {firstPaymentMinPercent}% of the order total (₦{firstPaymentMinAmount.toLocaleString()}) unless it completes the order. After that, top-ups can be any amount.
            </p>
          )}
          <input
            type="number"
            min="1"
            step="0.01"
            placeholder="Amount to pay"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input text-sm"
          />

          {enteredAmount > 0 && (
            isSplitPayment ? (
              <div className="bg-navy-900/[0.03] rounded-md px-3 py-2.5 text-xs text-navy-900/80 flex flex-col gap-1">
                <div className="flex justify-between">
                  <span>Amount toward your order</span>
                  <span className="font-semibold">₦{enteredAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paystack processing fee (est.)</span>
                  <span className="font-semibold">₦{estimatedFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-navy-900/10 pt-1 mt-0.5 text-navy-900">
                  <span className="font-semibold">You'll be charged</span>
                  <span className="font-bold">₦{estimatedCharge.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-navy-900/50 mt-0.5">
                  This estimate is final Paystack-side. The exact fee depends on how you pay.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-navy-900/50 bg-navy-900/[0.03] rounded-md px-3 py-2">
                If you pay by bank transfer, Paystack adds its own small processing fee
                (typically ~1.5% + ₦100) on top of ₦{enteredAmount.toLocaleString()} — charged
                directly by Paystack, not Lumine. Other payment methods don't add anything extra.
              </p>
            )
          )}

          {error && <p className="text-status-danger text-xs">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-gold-500 text-navy-900 font-bold text-sm py-2.5 rounded-md hover:bg-gold-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "Starting payment…" : "Pay with Paystack"}
          </button>
          <p className="text-[11px] text-navy-900/40 text-center">
            You'll be redirected to Paystack's secure checkout. Payment only counts once confirmed.
          </p>
        </form>
      )}
    </div>
  );
}
