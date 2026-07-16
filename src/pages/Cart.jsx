  import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart, resolveTierPrice } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { listMyOrders } from "../api/orders";
import { getPaymentBand, getPaymentBandStyles } from "../utils/paymentStatus";
import { halfPackUnits, packLabelFor } from "../utils/packSizes";

export default function Cart() {
  const { items, updateQuantity, removeItem, total, forCustomer } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [worstOrder, setWorstOrder] = useState(null);

  useEffect(() => {
    if (!user || (user.role === "distributor" && user.distributor_type === "sales_rep")) return;
    listMyOrders()
      .then((orders) => {
        const unpaid = orders
          .filter((o) => o.status !== "cancelled" && o.paymentPercent < 100)
          .sort((a, b) => a.paymentPercent - b.paymentPercent)[0];
        setWorstOrder(unpaid || null);
      })
      .catch(() => {});
  }, [user?.id]);

  const reminderBand = worstOrder ? getPaymentBand(worstOrder.paymentPercent) : null;
  const reminderStyles = reminderBand ? getPaymentBandStyles(reminderBand) : null;

  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <h1 className="font-display font-bold text-xl text-navy-900 mb-2">Your cart is empty</h1>
        <p className="text-navy-900/60 text-sm mb-6">Add a few flavours from the catalog to get started.</p>
        <Link to="/catalog" className="bg-navy-800 text-cream-50 font-bold text-sm px-6 py-3 rounded-md">
          Browse Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="font-display font-bold text-2xl text-navy-900 mb-6">Your Order</h1>

      {forCustomer && (
        <div className="bg-gold-500/15 text-gold-700 rounded-md px-4 py-3 mb-6 text-sm font-semibold">
          Ordering on behalf of {forCustomer.name}
        </div>
      )}

      {worstOrder && (
        <Link
          to={`/orders/${worstOrder.id}`}
          className={`block rounded-md px-4 py-3 mb-6 text-sm font-semibold ${reminderStyles.bg} ${reminderStyles.text}`}
        >
          Order {worstOrder.order_number} is only {worstOrder.paymentPercent.toFixed(0)}% paid — tap to complete payment.
        </Link>
      )}

      <div className="flex flex-col gap-3 mb-6">
        {items.map((item) => {
          const unitPrice = resolveTierPrice(item.priceTiers, item.quantity);
          const basePrice = Number(item.priceTiers[0]?.price || 0);
          const isDiscounted = unitPrice < basePrice;

          return (
            <div key={item.variantId} className="bg-white rounded-card shadow-card p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-navy-900">
                  {item.productName} — {item.size}
                </p>
                <div className="flex items-center gap-2 text-sm text-navy-900/60">
                  {isDiscounted && (
                    <span className="line-through text-status-danger">
                      ₦{basePrice.toLocaleString()}
                    </span>
                  )}
                  <span>₦{unitPrice.toLocaleString()} each</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.variantId, Math.max(halfPackUnits(item.size), item.quantity - halfPackUnits(item.size)))}
                    className="w-7 h-7 rounded-md border border-navy-900/15 text-navy-900 font-bold text-sm"
                  >
                    −
                  </button>
                  <span className="text-xs font-semibold text-navy-900 w-20 text-center">
                    {packLabelFor(item.quantity, item.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.variantId, item.quantity + halfPackUnits(item.size))}
                    className="w-7 h-7 rounded-md border border-navy-900/15 text-navy-900 font-bold text-sm"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.variantId)}
                  className="text-status-danger text-xs font-semibold"
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="bg-navy-800 text-cream-50 rounded-card p-5 flex items-center justify-between mb-6">
        <span className="font-semibold">Total</span>
        <span className="font-display font-bold text-xl text-gold-500">
          ₦{total.toLocaleString()}
        </span>
      </div>
      <button
        onClick={() => navigate("/checkout")}
        className="w-full bg-gold-500 text-navy-900 font-bold py-3.5 rounded-md hover:bg-gold-700 transition-colors"
      >
        Proceed to Checkout
      </button>
    </div>
  );
}