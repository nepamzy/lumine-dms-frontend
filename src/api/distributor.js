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

// Read-only hierarchy visibility (item 8) — true distributors only. Never
// pair these with a mutating action; payment approval and order management
// stay exclusively admin-controlled.
export async function listHierarchyCustomers() {
  const { data } = await api.get("/admin/distributors/me/hierarchy/customers");
  return data.data;
}

export async function getHierarchyCustomerHistory(customerId) {
  const { data } = await api.get(`/admin/distributors/me/hierarchy/customers/${customerId}`);
  return data.data;
}

export async function listHierarchySalesReps() {
  const { data } = await api.get("/admin/distributors/me/hierarchy/sales-reps");
  return data.data;
}
