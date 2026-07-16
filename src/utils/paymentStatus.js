// Red below 70%, yellow 70–99%, green only at 100% — used consistently
// wherever we show payment progress (order detail, cart banner, reminder popup).
export function getPaymentBand(percent) {
  if (percent >= 100) return "green";
  if (percent >= 70) return "yellow";
  return "red";
}

export function getPaymentBandStyles(band) {
  switch (band) {
    case "green":
      return { bg: "bg-green-500/15", text: "text-green-500", dot: "bg-green-500", solid: "bg-green-500" };
    case "yellow":
      return { bg: "bg-gold-500/20", text: "text-gold-700", dot: "bg-gold-500", solid: "bg-gold-500" };
    default:
      return { bg: "bg-status-danger/15", text: "text-status-danger", dot: "bg-status-danger", solid: "bg-status-danger" };
  }
}

// The minimum percent a buyer must reach on their current order(s) before
// they're allowed to place a new one. Mirrors the backend's own gating so
// the UI can warn proactively instead of just showing a server error.
export function getNextOrderThreshold(buyerKind) {
  return buyerKind === "distributor" ? 85 : 100;
}
