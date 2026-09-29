import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getOrder, confirmTransport, confirmReceived, verifyPayment, cancelOrder, editOrderItems, recordOrderShortfall } from "../api/orders";
import { deleteOrder } from "../api/admin";
import { quarterPackUnits, packLabelFor } from "../utils/packSizes";
import OrderStatusStepper from "../components/OrderStatusStepper";
import PaymentPanel from "../components/PaymentPanel";

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draftItems, setDraftItems] = useState([]); // [{ variantId, size, productName, quantity }]
  const [editError, setEditError] = useState(null);
  const [shortfalling, setShortfalling] = useState(false);
  const [shortfallDraft, setShortfallDraft] = useState([]); // [{ variantId, size, productName, quantity }] — "quantity" here means units SHORT
  const [shortfallNote, setShortfallNote] = useState("");
  const [shortfallError, setShortfallError] = useState(null);
  const [shortfallResult, setShortfallResult] = useState(null); // { overpaidBy } after a successful save, shown once

  const refresh = () => getOrder(id).then((fresh) => { setOrder(fresh); return fresh; });

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [id]);

  // Coming back from Paystack's checkout — confirm with our backend, which
  // re-checks with Paystack directly rather than trusting the redirect.
  // A single check right after landing back here isn't enough: some
  // payment methods (bank transfer, USSD, a slow connection) can take a
  // little while to show as confirmed on Paystack's side even though the
  // money already moved, so instead of accepting one answer we keep
  // re-checking for up to ~40 seconds before giving up on this page (the
  // backend keeps re-checking in the background either way, and the
  // "Recheck with Paystack" button below can be used any time after that).
  useEffect(() => {
    const ref = searchParams.get("paystack_ref");
    if (!ref) return;

    let cancelled = false;
    const POLL_INTERVAL_MS = 4000;
    const POLL_MAX_ATTEMPTS = 10;

    setVerifying(true);
    setVerifyMessage("Confirming your payment with Paystack…");

    const poll = (attempt) => {
      verifyPayment(ref)
        .then(({ order: updated, paymentStatus }) => {
          if (cancelled) return;
          setOrder(updated);

          if (paymentStatus === "successful" || paymentStatus === "failed") {
            setSearchParams({}, { replace: true });
            setVerifying(false);
            setVerifyMessage(null);
            return;
          }

          if (attempt >= POLL_MAX_ATTEMPTS) {
            // Still not conclusive after ~40s — stop polling this page, but
            // this is NOT a failure. Leave the URL param off and let the
            // backend's reconciliation job (or the Recheck button) finish
            // the job whenever Paystack gives a final answer.
            setSearchParams({}, { replace: true });
            setVerifying(false);
            setVerifyMessage(
              "Still confirming with Paystack — this can take a few minutes for some payment methods. We'll keep checking automatically, or you can use \"Recheck with Paystack\" on this payment shortly."
            );
            setTimeout(() => setVerifyMessage(null), 10000);
            return;
          }

          setTimeout(() => poll(attempt + 1), POLL_INTERVAL_MS);
        })
        .catch(() => {
          if (cancelled) return;
          if (attempt >= POLL_MAX_ATTEMPTS) {
            setVerifying(false);
            setVerifyMessage("Couldn't reach our server to confirm this payment — please use \"Recheck with Paystack\" below.");
            return;
          }
          setTimeout(() => poll(attempt + 1), POLL_INTERVAL_MS);
        });
    };

    poll(1);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p className="max-w-2xl mx-auto px-6 py-16 text-navy-900/70">Loading…</p>;
  if (!order) return <p className="max-w-2xl mx-auto px-6 py-16 text-navy-900/70">Order not found.</p>;

  const isAdmin = user?.role === "admin";
  const isBuyer = order.customer_id === user?.id;
  const isPlacer = order.placed_by_user_id === user?.id;
  const isAssignedStaff =
    order.buyerKind === "customer" && user?.role === "distributor" && order.distributor_id === user?.distributor_id;

  // Cancel + edit share the same cutoff: only while still pending/paid AND
  // before the order has entered production (48hrs after it was placed).
  const canModify =
    ["pending", "paid"].includes(order.status) && !order.stage.production && (isBuyer || isPlacer || isAdmin);
  const editWindowHoursLeft = canModify
    ? Math.max(1, Math.ceil(48 - (Date.now() - new Date(order.created_at).getTime()) / 3_600_000))
    : 0;

  const startEdit = () => {
    const grouped = {};
    for (const item of order.items) {
      const key = item.variant_id;
      if (!grouped[key]) {
        grouped[key] = {
          variantId: item.variant_id,
          size: item.variant_size,
          productName: item.product_name,
          quantity: 0,
        };
      }
      grouped[key].quantity += item.quantity;
    }
    setDraftItems(Object.values(grouped));
    setEditError(null);
    setEditing(true);
  };

  const adjustDraftQty = (variantId, delta) => {
    setDraftItems((prev) =>
      prev.map((it) => {
        if (it.variantId !== variantId) return it;
        const step = quarterPackUnits(it.size);
        return { ...it, quantity: Math.max(0, it.quantity + delta * step) };
      })
    );
  };

  const saveEdit = async () => {
    setEditError(null);
    const items = draftItems
      .filter((it) => it.quantity > 0)
      .map((it) => ({ variantId: it.variantId, quantity: it.quantity }));
    if (items.length === 0) {
      setEditError("An order needs at least one item — cancel the order instead if you want it removed entirely.");
      return;
    }
    setBusy(true);
    try {
      await editOrderItems(order.id, items);
      await refresh();
      setEditing(false);
    } catch (err) {
      setEditError(err.response?.data?.message || "Couldn't save changes.");
      // The 48h production cutoff is enforced server-side at save time, not
      // just when the edit button first appeared — if it lapsed while this
      // person was mid-edit, drop out of edit mode as soon as the refreshed
      // order confirms that, so the "entered production" message takes over
      // instead of leaving a now-locked form sitting there inviting a retry
      // that'll just fail again.
      const fresh = await refresh();
      if (fresh.stage.production) setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  const startShortfall = () => {
    const grouped = {};
    for (const item of order.items) {
      const key = item.variant_id;
      if (!grouped[key]) {
        grouped[key] = {
          variantId: item.variant_id,
          size: item.variant_size,
          productName: item.product_name,
          onOrder: 0, // how many are currently on the order — the ceiling for "short"
          quantity: 0, // how many of those are short
        };
      }
      grouped[key].onOrder += item.quantity;
    }
    setShortfallDraft(Object.values(grouped));
    setShortfallNote("");
    setShortfallError(null);
    setShortfallResult(null);
    setShortfalling(true);
  };

  const adjustShortfallQty = (variantId, delta) => {
    setShortfallDraft((prev) =>
      prev.map((it) => {
        if (it.variantId !== variantId) return it;
        const step = quarterPackUnits(it.size);
        return { ...it, quantity: Math.min(it.onOrder, Math.max(0, it.quantity + delta * step)) };
      })
    );
  };

  const saveShortfall = async () => {
    setShortfallError(null);
    const items = shortfallDraft
      .filter((it) => it.quantity > 0)
      .map((it) => ({ variantId: it.variantId, quantity: it.quantity }));
    if (items.length === 0) {
      setShortfallError("Mark at least one item as short — or discard if production actually came through in full.");
      return;
    }
    setBusy(true);
    try {
      const result = await recordOrderShortfall(order.id, items, shortfallNote || undefined);
      await refresh();
      setShortfalling(false);
      setShortfallResult({ overpaidBy: result.overpaidBy });
    } catch (err) {
      setShortfallError(err.response?.data?.message || "Couldn't record the shortfall.");
    } finally {
      setBusy(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm("Cancel this order? This can't be undone.")) return;
    await runAction(() => cancelOrder(order.id));
  };

  const handleDeleteOrder = async () => {
    if (!window.confirm(`Permanently remove order ${order.order_number}? This can't be undone.`)) return;
    setBusy(true);
    try {
      await deleteOrder(order.id);
      navigate(ordersBackPath);
    } finally {
      setBusy(false);
    }
  };

  const runAction = async (fn) => {
    setBusy(true);
    try {
      await fn();
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const ordersBackPath = user?.role === "admin" ? "/admin" : user?.role === "distributor" ? "/distributor" : "/account";

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <Link to={ordersBackPath} className="text-sm text-navy-800 font-semibold mb-4 inline-block">
        ← Back to orders
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-navy-900">{order.order_number}</h1>
          <p className="text-navy-900/70 text-sm">
            Placed {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
        <p className="font-display font-bold text-xl text-navy-900">
          ₦{Number(order.total_amount).toLocaleString()}
        </p>
      </div>

      <div className="bg-white rounded-card shadow-card p-5 mb-5">
        <OrderStatusStepper stage={order.stage} buyerKind={order.buyerKind} />
      </div>

      {(verifying || verifyMessage) && (
        <div className="bg-gold-500/15 text-gold-700 rounded-md px-4 py-3 mb-5 text-sm font-semibold">
          {verifyMessage || "Confirming your payment with Paystack…"}
        </div>
      )}

      {/* Admin controls */}
      {isAdmin && (
        <div className="bg-navy-900/[0.03] rounded-card p-4 mb-5 flex flex-wrap gap-2">
          {!order.stage.transport && (
            <button
              disabled={busy}
              onClick={() => runAction(() => confirmTransport(order.id))}
              className="bg-navy-800 text-cream-50 text-xs font-bold px-3 py-2 rounded-md disabled:opacity-50"
            >
              Confirm On Transport
            </button>
          )}
          {!order.stage.received.admin && (
            <button
              disabled={busy}
              onClick={() => runAction(() => confirmReceived(order.id, "admin"))}
              className="bg-navy-800 text-cream-50 text-xs font-bold px-3 py-2 rounded-md disabled:opacity-50"
            >
              Confirm Received (Admin)
            </button>
          )}
          {order.buyerKind === "customer" && !order.stage.received.staff && (
            <button
              disabled={busy}
              onClick={() => runAction(() => confirmReceived(order.id, "staff"))}
              className="bg-navy-800/80 text-cream-50 text-xs font-bold px-3 py-2 rounded-md disabled:opacity-50"
            >
              Confirm Received (on behalf of Sales Rep)
            </button>
          )}
          {!order.stage.received.buyer && (
            <button
              disabled={busy}
              onClick={() => runAction(() => confirmReceived(order.id, "buyer"))}
              className="bg-navy-800/80 text-cream-50 text-xs font-bold px-3 py-2 rounded-md disabled:opacity-50"
            >
              Confirm Received (on behalf of {order.buyerKind === "distributor" ? "Distributor" : "Customer"})
            </button>
          )}
          <button
            disabled={busy}
            onClick={handleDeleteOrder}
            className="bg-status-danger text-cream-50 text-xs font-bold px-3 py-2 rounded-md disabled:opacity-50 ml-auto"
          >
            Delete Order
          </button>
        </div>
      )}

      {/* Sales rep's own confirmation */}
      {isAssignedStaff && !order.stage.received.staff && (
        <div className="bg-navy-900/[0.03] rounded-card p-4 mb-5">
          <button
            disabled={busy}
            onClick={() => runAction(() => confirmReceived(order.id, "staff"))}
            className="bg-gold-500 text-navy-900 text-sm font-bold px-4 py-2.5 rounded-md disabled:opacity-50"
          >
            Confirm Received
          </button>
        </div>
      )}

      {/* Buyer's own confirmation */}
      {isBuyer && !order.stage.received.buyer && order.stage.transport && (
        <div className="bg-navy-900/[0.03] rounded-card p-4 mb-5">
          <button
            disabled={busy}
            onClick={() => runAction(() => confirmReceived(order.id))}
            className="bg-gold-500 text-navy-900 text-sm font-bold px-4 py-2.5 rounded-md disabled:opacity-50"
          >
            Confirm I Received This Order
          </button>
        </div>
      )}

      {order.paymentDue && (
        <div
          className={`rounded-md px-4 py-3 mb-5 text-sm font-semibold ${
            order.paymentDue.overdue ? "bg-status-danger/10 text-status-danger" : "bg-gold-500/15 text-gold-700"
          }`}
        >
          {order.paymentDue.overdue
            ? `Payment is overdue — please complete the remaining balance as soon as possible.`
            : `${order.paymentDue.daysRemaining} day${order.paymentDue.daysRemaining === 1 ? "" : "s"} left to complete your payment (in up to two installments).`}
        </div>
      )}
      <PaymentPanel
        order={order}
        canPay={isBuyer}
        onUpdated={refresh}
        showReceipts={isBuyer || isAdmin || isAssignedStaff}
        generatedFor={isAdmin ? "Admin copy" : isAssignedStaff ? "Sales rep copy" : "Customer copy"}
        isAdmin={isAdmin}
      />

      {canModify && !editing && (
        <div className="mt-5">
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={startEdit}
              className="bg-navy-800 text-cream-50 text-xs font-bold px-4 py-2.5 rounded-md disabled:opacity-50"
            >
              Edit Order
            </button>
            <button
              disabled={busy}
              onClick={handleCancelOrder}
              className="bg-status-danger text-cream-50 text-xs font-bold px-4 py-2.5 rounded-md disabled:opacity-50"
            >
              Cancel Order
            </button>
          </div>
          <p className="text-[11px] text-navy-900/40 mt-2">
            {editWindowHoursLeft <= 1
              ? "Less than an hour left to edit or cancel — this order enters production soon."
              : `${editWindowHoursLeft} hour${editWindowHoursLeft === 1 ? "" : "s"} left to edit or cancel before this order enters production.`}
          </p>
        </div>
      )}
      {!canModify && !isAdmin && ["pending", "paid"].includes(order.status) && order.stage.production && (
        <p className="text-xs text-navy-900/40 mt-5">
          This order has entered production and can no longer be edited or cancelled.
        </p>
      )}

      <div className="bg-white rounded-card shadow-card p-5 mt-5">
        <h3 className="font-display font-bold text-navy-900 mb-3">Items</h3>

        {!editing ? (
          <div className="flex flex-col gap-2">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-navy-900/70">
                  {item.product_name} — {item.variant_size} × {packLabelFor(item.quantity, item.variant_size)}
                </span>
                <span className="font-semibold text-navy-900">
                  ₦{Number(item.line_total).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {draftItems.map((it) => (
              <div key={it.variantId} className="flex items-center justify-between gap-3">
                <span className="text-sm text-navy-900/70">
                  {it.productName} — {it.size}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustDraftQty(it.variantId, -1)}
                    className="w-7 h-7 rounded-md border border-navy-900/15 text-navy-900 font-bold"
                  >
                    −
                  </button>
                  <span className="text-sm font-semibold text-navy-900 w-28 text-center">
                    {it.quantity > 0 ? packLabelFor(it.quantity, it.size) : "Removed"}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjustDraftQty(it.variantId, 1)}
                    className="w-7 h-7 rounded-md border border-navy-900/15 text-navy-900 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
            {editError && <p className="text-status-danger text-xs">{editError}</p>}
            <div className="flex gap-2 mt-2">
              <button
                disabled={busy}
                onClick={saveEdit}
                className="bg-gold-500 text-navy-900 text-xs font-bold px-4 py-2.5 rounded-md disabled:opacity-50"
              >
                Save Changes
              </button>
              <button
                disabled={busy}
                onClick={() => setEditing(false)}
                className="text-xs text-navy-900/70 underline"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>

      {order.shortfalls?.length > 0 && (
        <div className="bg-white rounded-card shadow-card p-5 mt-5">
          <h3 className="font-display font-bold text-navy-900 mb-1">Production Shortfall</h3>
          <p className="text-xs text-navy-900/45 mb-3">
            Some of what was ordered couldn't be produced — the total above has already been adjusted down to match.
          </p>
          <div className="flex flex-col gap-2">
            {order.shortfalls.map((s) => (
              <div key={s.id} className="flex justify-between text-sm">
                <span className="text-navy-900/70">
                  {s.product_name} — {s.variant_size} × {packLabelFor(s.quantity, s.variant_size)}
                  {s.note && <span className="text-navy-900/40"> · {s.note}</span>}
                </span>
                <span className="font-semibold text-status-danger">−₦{Number(s.amount).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && ["pending", "paid"].includes(order.status) && (
        <div className="bg-white rounded-card shadow-card p-5 mt-5">
          <h3 className="font-display font-bold text-navy-900 mb-1">Record Production Shortfall</h3>
          <p className="text-xs text-navy-900/45 mb-3">
            If production couldn't fully meet this order, mark what's short here — the total (and what's left to pay) updates automatically. Works at any stage, including after the edit window above has closed.
          </p>

          {shortfallResult && (
            <div className="bg-gold-500/15 text-gold-700 rounded-md px-3 py-2 mb-3 text-xs font-semibold">
              Shortfall recorded — total adjusted.
              {shortfallResult.overpaidBy > 0 &&
                ` The customer has now paid ₦${shortfallResult.overpaidBy.toLocaleString()} more than the new total — arrange a refund or credit manually.`}
            </div>
          )}

          {!shortfalling ? (
            <button
              disabled={busy}
              onClick={startShortfall}
              className="bg-status-danger/90 text-cream-50 text-xs font-bold px-4 py-2.5 rounded-md disabled:opacity-50"
            >
              Record Shortfall
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              {shortfallDraft.map((it) => (
                <div key={it.variantId} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-navy-900/70">
                    {it.productName} — {it.size} <span className="text-navy-900/40">({packLabelFor(it.onOrder, it.size)} on order)</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustShortfallQty(it.variantId, -1)}
                      className="w-7 h-7 rounded-md border border-navy-900/15 text-navy-900 font-bold"
                    >
                      −
                    </button>
                    <span className="text-sm font-semibold text-navy-900 w-32 text-center">
                      {it.quantity > 0 ? `${packLabelFor(it.quantity, it.size)} short` : "None short"}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustShortfallQty(it.variantId, 1)}
                      className="w-7 h-7 rounded-md border border-navy-900/15 text-navy-900 font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
              <input
                value={shortfallNote}
                onChange={(e) => setShortfallNote(e.target.value)}
                placeholder="Optional note (e.g. reason for the shortfall)"
                className="text-sm border border-navy-900/15 rounded-md px-3 py-2"
              />
              {shortfallError && <p className="text-status-danger text-xs">{shortfallError}</p>}
              <div className="flex gap-2 mt-1">
                <button
                  disabled={busy}
                  onClick={saveShortfall}
                  className="bg-status-danger/90 text-cream-50 text-xs font-bold px-4 py-2.5 rounded-md disabled:opacity-50"
                >
                  Save Shortfall
                </button>
                <button
                  disabled={busy}
                  onClick={() => setShortfalling(false)}
                  className="text-xs text-navy-900/70 underline"
                >
                  Discard
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
