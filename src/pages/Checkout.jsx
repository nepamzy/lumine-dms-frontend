import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart, resolveUnitPrice } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { createOrder } from "../api/orders";
import { acknowledgePaymentNotice } from "../api/auth";

export default function Checkout() {
  const { items, total, clearCart, forCustomer, isDistributor } = useCart();
  const { user, refreshUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [ackChecked, setAckChecked] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [showDeliveryNotice, setShowDeliveryNotice] = useState(false);
  const navigate = useNavigate();

  const needsAcknowledgment = user?.role === "customer" && !user?.acknowledged_payment_notice;
  const isSalesRep = user?.role === "distributor" && user?.distributor_type === "sales_rep";
  const isSalesRepSelfOrder = isSalesRep && !forCustomer;

  const handleAcknowledge = async () => {
    setAcknowledging(true);
    try {
      await acknowledgePaymentNotice();
      await refreshUser();
    } finally {
      setAcknowledging(false);
    }
  };

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder(
        items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
        forCustomer?.id
      );
      clearCart();
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "We couldn't place your order. Please review your cart and try again."
      );
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  if (needsAcknowledgment) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16">
        <div className="bg-white rounded-card shadow-card p-6">
          <h1 className="font-display font-bold text-xl text-navy-900 mb-4">Before you order</h1>
          <p className="text-sm text-navy-900/70 leading-relaxed mb-5">
            All payment for your Lumine orders happens right here on this platform. We don't
            accept payment in cash, by hand, or through any channel outside your order page —
            if it didn't go through the "Log Payment" button on your order, it isn't recorded
            as paid and won't count toward your order. This protects you: every payment you
            make is tracked, timestamped, and visible to you at any time.
          </p>
          <label className="flex items-start gap-2.5 text-sm text-navy-900/80 mb-5 cursor-pointer">
            <input
              type="checkbox"
              checked={ackChecked}
              onChange={(e) => setAckChecked(e.target.checked)}
              className="mt-0.5"
            />
            I understand that all payment happens on this platform, and no payment made
            outside it will be considered valid.
          </label>
          <button
            disabled={!ackChecked || acknowledging}
            onClick={handleAcknowledge}
            className="w-full bg-gold-500 text-navy-900 font-bold py-3 rounded-md hover:bg-gold-700 transition-colors disabled:opacity-50"
          >
            {acknowledging ? "Continuing…" : "Continue to Checkout"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-1">Review & Place Order</h1>
      <p className="text-navy-900/60 text-sm mb-8">
        You'll pay after placing your order — from your order page, any time.
      </p>
      {forCustomer && (
        <div className="bg-gold-500/15 text-gold-700 rounded-md px-4 py-3 mb-6 text-sm font-semibold">
          Placing this order on behalf of {forCustomer.name}. They'll handle payment from their own order page.
        </div>
      )}
      {isSalesRepSelfOrder && (
        <div className="bg-navy-900/5 text-navy-900/70 rounded-md px-4 py-3 mb-6 text-sm">
          This is your own personal order (not on behalf of a customer). Sales rep orders must be paid{" "}
          <span className="font-semibold">100% upfront</span> — no partial or installment payments.
        </div>
      )}
      <div className="bg-white rounded-card shadow-card p-5 mb-6">
        {items.map((item) => {
          const unitPrice = resolveUnitPrice(item, isDistributor);
          return (
            <div key={item.variantId} className="flex justify-between text-sm py-1.5">
              <span className="text-navy-900/80">
                {item.productName} — {item.size} × {item.quantity}
              </span>
              <span className="font-semibold text-navy-900">
                ₦{(unitPrice * item.quantity).toLocaleString()}
              </span>
            </div>
          );
        })}
        <div className="border-t border-navy-900/10 mt-3 pt-3 flex justify-between font-display font-bold text-navy-900">
          <span>Total</span>
          <span>₦{total.toLocaleString()}</span>
        </div>
      </div>
      {error && <p className="text-status-danger text-sm mb-4">{error}</p>}
      <button
        onClick={() => setShowDeliveryNotice(true)}
        disabled={submitting}
        className="w-full bg-gold-500 text-navy-900 font-bold py-3.5 rounded-md hover:bg-gold-700 transition-colors disabled:opacity-50"
      >
        {submitting ? "Placing order…" : "Place Order"}
      </button>

      {showDeliveryNotice && (
        <div className="fixed inset-0 bg-navy-900/70 z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-card max-w-sm w-full p-6 text-center">
            <h2 className="font-display font-bold text-lg text-navy-900 mb-2">Before you confirm</h2>
            <p className="text-sm text-navy-900/60 mb-6">
              You'll receive your product within <span className="font-semibold text-navy-900">5 working days</span> of
              placing this order.
              {!isSalesRepSelfOrder && !forCustomer && (
                <> If under 65% is paid by the time it arrives, you'll have 2 weeks to complete payment.</>
              )}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeliveryNotice(false)}
                disabled={submitting}
                className="flex-1 border border-navy-900/15 text-navy-900 font-semibold text-sm py-2.5 rounded-md disabled:opacity-50"
              >
                Go back
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={submitting}
                className="flex-1 bg-gold-500 text-navy-900 font-bold text-sm py-2.5 rounded-md hover:bg-gold-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Placing…" : "Confirm & Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
