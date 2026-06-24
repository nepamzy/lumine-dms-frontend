import api from "./client";

export async function createOrder(items) {
  const { data } = await api.post("/orders", { items });
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

export async function initializePayment(orderId) {
  const { data } = await api.post("/payments/initialize", { orderId });
  return data.data; // { authorizationUrl, reference }
}

export async function verifyPayment(reference) {
  const { data } = await api.get(`/payments/verify/${reference}`);
  return data.data;
}
