import api from "./client";

export async function getMyRoute() {
  const { data } = await api.get("/deliveries/my-route");
  return data.data;
}

export async function updateGps(orderId, lat, lng) {
  const { data } = await api.patch(`/deliveries/${orderId}/gps`, { lat, lng });
  return data.data;
}

export async function markDelivered(orderId) {
  const { data } = await api.patch(`/deliveries/${orderId}/delivered`);
  return data.data;
}

export async function markFailed(orderId, reason) {
  const { data } = await api.patch(`/deliveries/${orderId}/failed`, { reason });
  return data.data;
}
