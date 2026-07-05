import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart, resolveTierPrice } from "../context/CartContext";
import { createOrder, initializePayment } from "../api/orders";

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handlePay = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const order = await createOrder(
        items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }))
      );
      const { authorizationUrl } = await initializePayment(order.id);
      clearCart();
      window.location.href = authorizationUrl; // hand off to Paystack's hosted checkout
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "We couldn't start your order. Please review your cart and try again."
      );
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-16">
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-1">Review & Pay</h1>
      <p className="text-navy-900/60 text-sm mb-8">
        You'll be redirected to Paystack to complete payment securely.
      </p>
      <div className="bg-white rounded-card shadow-card p-5 mb-6">
        {items.map((item) => {
          const unitPrice = resolveTierPrice(item.priceTiers, item.quantity);
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
        onClick={handlePay}
        disabled={submitting}
        className="w-full bg-gold-500 text-navy-900 font-bold py-3.5 rounded-md hover:bg-gold-700 transition-colors disabled:opacity-50"
      >
        {submitting ? "Starting payment…" : "Pay with Paystack"}
      </button>
    </div>
  );
}