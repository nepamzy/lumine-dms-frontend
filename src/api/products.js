import api from "./client";

export async function listProducts() {
  const { data } = await api.get("/products");
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