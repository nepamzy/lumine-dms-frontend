// Red = closest to expiring (urgent), yellow = worth watching, green =
// plenty of time left. Mirrors the backend's getExpiryInfo bands exactly.
export function getExpiryBandStyles(band) {
  switch (band) {
    case "green":
      return { bg: "bg-green-500/15", text: "text-green-500", dot: "bg-green-500" };
    case "yellow":
      return { bg: "bg-gold-500/20", text: "text-gold-700", dot: "bg-gold-500" };
    default:
      return { bg: "bg-status-danger/15", text: "text-status-danger", dot: "bg-status-danger" };
  }
}
