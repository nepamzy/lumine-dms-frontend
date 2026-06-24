import api from "./client";

export async function listProducts() {
  const { data } = await api.get("/products");
  return data.data;
}

export async function getProduct(id) {
  const { data } = await api.get(`/products/${id}`);
  return data.data;
}
