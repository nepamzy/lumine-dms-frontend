import api from "./client";

export async function getMapLocations() {
  const { data } = await api.get("/admin/map/locations");
  return data.data;
}
