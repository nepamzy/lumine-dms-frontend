import api from "./client";

export async function listProducts(includeInactive) {
  const { data } = await api.get("/products", includeInactive ? { params: { includeInactive: true } } : {});
  return data.data;
}

export async function getProduct(id) {
  const { data } = await api.get(`/products/${id}`);
  return data.data;
}
export async function getProductVariants(productId) {
  const { data } = await api.get(`/products/${productId}/variants`);
  return data.data;
}
export async function getExpiringBatches(days) {
  const { data } = await api.get("/products/expiring", days ? { params: { days } } : {});
  return data.data;
}