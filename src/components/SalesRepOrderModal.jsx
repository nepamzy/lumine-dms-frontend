import { useEffect, useState } from "react";
import { getOrder } from "../api/orders";
import { packLabelFor } from "../utils/packSizes";
import OrderStatusStepper from "./OrderStatusStepper";
import PaymentPanel from "./PaymentPanel";

// Full order detail — items, delivery stage, and complete payment
// history/receipts — inline on the sales rep dashboard, so a rep never has
// to leave it just to look up an order's status (item 11: single source of
// truth). Read-only for the rep: canPay is always false here, since only
// the buyer themselves pays for their own order — this is the same
// PaymentPanel every other read-only view (admin, distributor hierarchy)
// already uses in that mode.
export default function SalesRepOrderModal({ orderId, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = () => getOrder(orderId).then(setOrder);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [orderId]);

  return (
    <div className="fixed inset-0 bg-navy-900/50 z-50 flex items-start justify-center overflow-y-auto p-4">
      <div className="bg-white rounded-card w-full max-w-2xl mt-8 mb-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-900/10">
          <h3 className="font-display font-bold text-lg text-navy-900">
            {loading || !order ? "Loading…" : order.order_number}
          </h3>
          <button onClick={onClose} aria-label="Close" className="text-navy-900/40 hover:text-navy-900 text-xl leading-none">
            ×
          </button>
        </div>

        {loading || !order ? (
          <p className="px-6 py-10 text-center text-navy-900/70">Loading order…</p>
        ) : (
          <div className="px-6 py-5 flex flex-col gap-5">
            <div>
              <p className="text-sm text-navy-900/70 mb-1">
                {order.customer_name} · {new Date(order.created_at).toLocaleDateString()}
              </p>
              <OrderStatusStepper stage={order.stage} buyerKind={order.buyerKind} />
            </div>

            <div className="bg-navy-900/[0.03] rounded-card p-4">
              <h4 className="font-display font-bold text-navy-900 mb-2 text-sm">Items</h4>
              <div className="flex flex-col gap-1.5">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-navy-900/70">
                      {item.product_name} — {item.variant_size} × {packLabelFor(item.quantity, item.variant_size)}
                    </span>
                    <span className="font-semibold text-navy-900">₦{Number(item.line_total).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-navy-900/10 mt-2 pt-2 flex justify-between font-display font-bold text-navy-900">
                <span>Total</span>
                <span>₦{Number(order.total_amount).toLocaleString()}</span>
              </div>
            </div>

            <PaymentPanel
              order={order}
              canPay={false}
              onUpdated={refresh}
              showReceipts
              generatedFor="Sales rep copy"
            />
          </div>
        )}
      </div>
    </div>
  );
}
