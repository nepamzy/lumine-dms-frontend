import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { listMyOrders, listExpiringOrders } from "../api/orders";
import { getPaymentBand, getPaymentBandStyles } from "../utils/paymentStatus";
import { getExpiryBandStyles } from "../utils/expiryStatus";

// Shown once each time the site loads (not persisted/dismissed permanently
// — reappears next visit, by design) if the logged-in user has an unpaid
// order or a batch approaching expiry. Covers all four roles: admin sees
// every order's expiry; customer/distributor see payment + their own
// expiry; sales rep sees only their assigned customers' expiry (never
// payment — they don't pay).
export default function SiteVisitRemindersPopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [worstPayment, setWorstPayment] = useState(null);
  const [soonestExpiry, setSoonestExpiry] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const isSalesRep = user?.role === "distributor" && user?.distributor_type === "sales_rep";
  const canOwePayment = user && (user.role === "customer" || (user.role === "distributor" && !isSalesRep));
  const canHaveExpiry = user && (user.role === "admin" || user.role === "customer" || user.role === "distributor");

  useEffect(() => {
    if (!user) return;

    if (canOwePayment) {
      listMyOrders()
        .then((orders) => {
          const unpaid = orders
            .filter((o) => o.status !== "cancelled" && o.paymentPercent < 100)
            .sort((a, b) => a.paymentPercent - b.paymentPercent)[0];
          if (unpaid) setWorstPayment(unpaid);
        })
        .catch(() => {});
    }

    if (canHaveExpiry) {
      listExpiringOrders()
        .then((rows) => {
          const soonest = rows.sort((a, b) => a.daysRemaining - b.daysRemaining)[0];
          if (soonest) setSoonestExpiry(soonest);
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (dismissed || (!worstPayment && !soonestExpiry)) return null;

  return (
    <div className="fixed inset-0 bg-navy-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-card max-w-sm w-full p-6">
        <h3 className="font-display font-bold text-lg text-navy-900 mb-4">Heads up</h3>

        <div className="flex flex-col gap-4 mb-5">
          {worstPayment && (
            <PaymentReminderCard order={worstPayment} onGo={() => { setDismissed(true); navigate(`/orders/${worstPayment.id}`); }} />
          )}
          {soonestExpiry && <ExpiryReminderCard order={soonestExpiry} />}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setDismissed(true)}
            className="flex-1 text-navy-900/60 text-sm font-semibold py-2.5 rounded-md border border-navy-900/15"
          >
            Dismiss
          </button>
          {worstPayment && (
            <button
              onClick={() => { setDismissed(true); navigate(`/orders/${worstPayment.id}`); }}
              className="flex-1 bg-gold-500 text-navy-900 text-sm font-bold py-2.5 rounded-md"
            >
              Pay Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentReminderCard({ order }) {
  const styles = getPaymentBandStyles(getPaymentBand(order.paymentPercent));
  return (
    <div>
      <span className={`inline-block text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-2 ${styles.bg} ${styles.text}`}>
        {order.paymentPercent.toFixed(0)}% paid
      </span>
      <p className="text-sm text-navy-900/70">
        Order {order.order_number} is awaiting payment.
      </p>
    </div>
  );
}

function ExpiryReminderCard({ order }) {
  const styles = getExpiryBandStyles(order.band);
  return (
    <div>
      <span className={`inline-block text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full mb-2 ${styles.bg} ${styles.text}`}>
        {order.daysRemaining} day{order.daysRemaining === 1 ? "" : "s"} to expiry
      </span>
      <p className="text-sm text-navy-900/70">
        {order.product_names} for {order.customer_name} ({order.order_number}) is approaching its expiry date.
      </p>
    </div>
  );
}
