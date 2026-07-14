import api from "./client";

export async function createProduct(payload) {
  const { data } = await api.post("/products", payload);
  return data.data;
}

export async function updateProduct(id, payload) {
  const { data } = await api.patch(`/products/${id}`, payload);
  return data.data;
}

export async function addBatch(productId, payload) {
  const { data } = await api.post(`/products/${productId}/batches`, payload);
  return data.data;
}

export async function listAllOrders(status) {
  const { data } = await api.get("/orders", { params: status ? { status } : {} });
  return data.data;
}

export async function updateOrderStatus(orderId, status) {
  const { data } = await api.patch(`/orders/${orderId}/status`, { status });
  return data.data;
}

export async function assignDistributor(orderId, distributorId) {
  const { data } = await api.patch(`/orders/${orderId}/assign-distributor`, { distributorId });
  return data.data;
}

export async function listDistributors(status) {
  const { data } = await api.get("/admin/distributors", { params: status ? { status } : {} });
  return data.data;
}

export async function approveDistributor(id, territoryId) {
  const { data } = await api.patch(`/admin/distributors/${id}/approve`, { territoryId });
  return data.data;
}

export async function rejectDistributor(id) {
  const { data } = await api.patch(`/admin/distributors/${id}/reject`);
  return data.data;
}

export async function listTerritories() {
  const { data } = await api.get("/admin/distributors/territories/all");
  return data.data;
}

export async function salesReport(params) {
  const { data } = await api.get("/reports/sales", { params });
  return data.data;
}

export async function inventoryReport(params) {
  const { data } = await api.get("/reports/inventory", { params });
  return data.data;
}
export async function listCustomers() {
  const { data } = await api.get("/admin/customers");
  return data.data;
}

export async function reassignCustomerDistributor(customerId, distributorId) {
  const { data } = await api.patch(`/admin/customers/${customerId}/distributor`, { distributorId });
  return data.data;
}

export async function getCustomerHistory(customerId) {
  const { data } = await api.get(`/admin/customers/${customerId}/history`);
  return data.data;
}

export async function getDistributorHistory(distributorId) {
  const { data } = await api.get(`/admin/distributors/${distributorId}/history`);
  return data.data;
}
