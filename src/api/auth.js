import api, { setAccessToken } from "./client";

export async function register(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data.data;
}

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  setAccessToken(data.data.accessToken);
  return data.data.user;
}

export async function refreshSession() {
  const { data } = await api.post("/auth/refresh");
  setAccessToken(data.data.accessToken);
  return data.data.accessToken;
}

export async function logout() {
  await api.post("/auth/logout");
  setAccessToken(null);
}
export async function updateProfile(updates) {
  const { data } = await api.patch("/auth/me", updates);
  return data.data;
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await api.post("/auth/change-password", { currentPassword, newPassword });
  return data.data;
}

export async function acknowledgePaymentNotice() {
  const { data } = await api.post("/auth/acknowledge-payment-notice");
  return data;
}

export async function updateLocation(latitude, longitude) {
  const { data } = await api.patch("/auth/me/location", { latitude, longitude });
  return data.data;
}

export async function registerLocationStrike() {
  const { data } = await api.post("/auth/me/location-strike");
  return data.data;
}