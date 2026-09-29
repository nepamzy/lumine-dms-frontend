import api from "./client";

export async function createOrder(items, buyerId, buyerKind) {
  // buyerKind "distributor" is admin placing a restock order on behalf of a
  // true distributor — sent as buyerId, which the backend accepts only
  // from an admin caller. Anything else (a sales rep or true distributor
  // ordering for one of their own customers) keeps using customerId,
  // unchanged from before.
  const body = { items };
  if (buyerId && buyerKind === "distributor") body.buyerId = buyerId;
  else if (buyerId) body.customerId = buyerId;
  const { data } = await api.post("/orders", body);
  return data.data;
}

export async function listMyOrders(status) {
  const { data } = await api.get("/orders", { params: status ? { status } : {} });
  return data.data;
}

export async function getOrder(id) {
  const { data } = await api.get(`/orders/${id}`);
  return data.data;
}

export async function cancelOrder(id) {
  const { data } = await api.post(`/orders/${id}/cancel`);
  return data.data;
}

// Replaces the items on an existing pre-production order (same shape as
// createOrder's items array). Only works while the order hasn't yet
// entered production — the backend enforces this regardless.
export async function editOrderItems(id, items) {
  const { data } = await api.patch(`/orders/${id}/items`, { items });
  return data.data;
}

// Admin-only. Records units that couldn't actually be produced — reduces
// the order's items/total to match, at any order stage (not gated by the
// 48h edit cutoff above, since a shortfall is discovered during/after
// production, well past that window). Returns { order, overpaidBy } —
// overpaidBy is > 0 if the customer had already paid more than the new,
// lower total.
export async function recordOrderShortfall(id, items, note) {
  const { data } = await api.post(`/orders/${id}/shortfall`, { items, note });
  return data.data;
}

export async function logPayment(orderId, amount, note, percentOfTotal) {
  const { data } = await api.post(`/orders/${orderId}/payments`, { amount, note, percentOfTotal });
  return data.data;
}

export async function confirmTransport(orderId) {
  const { data } = await api.patch(`/orders/${orderId}/confirm-transport`);
  return data.data;
}

// `as` is optional — omit it to confirm your own box (buyer), or pass
// 'admin' | 'staff' | 'buyer' when an admin is confirming on someone else's behalf.
export async function confirmReceived(orderId, as) {
  const { data } = await api.patch(`/orders/${orderId}/confirm-received`, as ? { as } : {});
  return data.data;
}

export async function listExpiringOrders() {
  const { data } = await api.get("/orders/expiring");
  return data.data;
}

// Starts a real Paystack transaction for the given installment amount and
// returns the checkout URL to redirect to. Nothing counts as paid until
// the buyer completes checkout and it's verified.
export async function initializePayment(orderId, amount) {
  const { data } = await api.post("/payments/initialize", { orderId, amount });
  return data.data; // { authorizationUrl, reference }
}

// Called after Paystack redirects back — and reusable any time as a manual
// "Recheck with Paystack" action on a pending/failed payment row. Confirms
// with Paystack directly (never trusts the redirect alone). paymentStatus
// is "successful" | "pending" | "failed" — "pending" means Paystack hasn't
// given a conclusive answer yet, not that it failed, so callers should keep
// checking rather than treat it as a dead end.
export async function verifyPayment(reference) {
  const { data } = await api.get(`/payments/verify/${reference}`);
  return { order: data.data, paymentStatus: data.paymentStatus, flagged: data.flagged };
}
