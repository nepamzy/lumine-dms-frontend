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

// Distributor-only — onboards a new sales rep directly, auto-approved.
export async function registerSalesRepForDistributor(payload) {
  const { data } = await api.post("/admin/distributors/me/sales-reps/register", payload);
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

// Payout account setup (true distributors only) — list banks for the
// picker, resolve an account number to its holder's name (free, no side
// effects), then confirm to actually create the Paystack subaccount.
export async function listPayoutBanks() {
  const { data } = await api.get("/admin/distributors/me/banks");
  return data.data;
}

export async function resolveBankAccount(bankCode, accountNumber) {
  const { data } = await api.post("/admin/distributors/me/bank/resolve", { bankCode, accountNumber });
  return data.data;
}

export async function confirmPayoutAccount(bankCode, accountNumber) {
  const { data } = await api.post("/admin/distributors/me/subaccount", { bankCode, accountNumber });
  return data.data;
}

export async function getPayoutAccountStatus() {
  const { data } = await api.get("/admin/distributors/me/payout-account");
  return data.data;
}
