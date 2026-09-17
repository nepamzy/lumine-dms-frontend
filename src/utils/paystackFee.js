// Mirrors the backend's grossUpForPaystackFee (payment.service.js) —
// same Paystack Nigeria fee schedule (1.5% + N100, N100 waived under
// N2,500, capped at N2,000) — kept in sync manually since this is
// display-only math, purely so the buyer sees an accurate estimate before
// paying. The backend's own calculation is what's actually charged.
const PAYSTACK_FEE_PERCENT = 0.015;
const PAYSTACK_FLAT_FEE = 100;
const PAYSTACK_FLAT_FEE_WAIVER_THRESHOLD = 2500;
const PAYSTACK_FEE_CAP = 2000;

export function grossUpForPaystackFee(netAmount) {
  const cappedCharge = netAmount + PAYSTACK_FEE_CAP;
  const feeAtCappedCharge = PAYSTACK_FEE_PERCENT * cappedCharge + PAYSTACK_FLAT_FEE;
  if (feeAtCappedCharge >= PAYSTACK_FEE_CAP) {
    return Math.ceil(cappedCharge);
  }
  const chargeWithFlat = (netAmount + PAYSTACK_FLAT_FEE) / (1 - PAYSTACK_FEE_PERCENT);
  if (chargeWithFlat >= PAYSTACK_FLAT_FEE_WAIVER_THRESHOLD) {
    return Math.ceil(chargeWithFlat);
  }
  const chargeNoFlat = netAmount / (1 - PAYSTACK_FEE_PERCENT);
  return Math.ceil(chargeNoFlat);
}
