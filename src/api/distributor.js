import api from "./client";

export async function getMyReferral() {
  const { data } = await api.get("/admin/distributors/me/referral");
  return data.data;
}

export async function listMyCustomers() {
  const { data } = await api.get("/admin/distributors/me/customers");
  return data.data;
}

export async function registerCustomerForRep(payload) {
  const { data } = await api.post("/admin/distributors/me/customers/register", payload);
  return data.data;
}

export async function listTrackRecordCustomers() {
  const { data } = await api.get("/admin/distributors/me/track-record");
  return data.data;
}

export async function getCustomerHistoryForRep(customerId) {
  const { data } = await api.get(`/admin/distributors/me/track-record/${customerId}`);
  return data.data;
}

export async function pingCustomer(customerId, orderId) {
  const { data } = await api.post(`/admin/distributors/me/track-record/${customerId}/ping`, { orderId });
  return data;
}
