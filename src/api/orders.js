import api from "./client";

export async function createOrder(items, customerId) {
  const { data } = await api.post("/orders", { items, ...(customerId ? { customerId } : {}) });
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

export async function logPayment(orderId, amount, note) {
  const { data } = await api.post(`/orders/${orderId}/payments`, { amount, note });
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

// Called after Paystack redirects back — confirms with Paystack directly
// (never trusts the redirect alone) and returns the fresh order.
export async function verifyPayment(reference) {
  const { data } = await api.get(`/payments/verify/${reference}`);
  return data.data;
}
