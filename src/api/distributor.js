import api from "./client";

export async function getMyReferral() {
  const { data } = await api.get("/admin/distributors/me/referral");
  return data.data;
}
