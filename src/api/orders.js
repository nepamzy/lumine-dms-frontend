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
