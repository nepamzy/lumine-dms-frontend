// Pack sizes per Bonchris's packaging: 50cl/35cl come 24 to a pack (half =
// 12, quarter = 6), 1L comes 12 to a pack (half = 6, quarter = 3). Orders
// are placed in quarter-pack increments — never single bottles — so a
// quarter pack is the smallest amount a customer can order.
const HALF_PACK_UNITS = { "35cl": 12, "50cl": 12, "1L": 6 };
const QUARTER_PACK_UNITS = { "35cl": 6, "50cl": 6, "1L": 3 };

export function halfPackUnits(size) {
  return HALF_PACK_UNITS[size] || 1;
}

export function quarterPackUnits(size) {
  return QUARTER_PACK_UNITS[size] || 1;
}

export function packLabelFor(quantity, size) {
  const unit = quarterPackUnits(size);
  const quarters = quantity / unit; // how many quarter-packs this quantity represents
  const wholePacks = Math.floor(quarters / 4);
  const remainderQuarters = quarters % 4;

  const FRACTION_LABEL = { 1: "¼", 2: "½", 3: "¾" };
  const fraction = FRACTION_LABEL[remainderQuarters];

  if (wholePacks === 0 && fraction) return `${fraction} Pack`;
  if (!fraction) return `${wholePacks} Pack${wholePacks === 1 ? "" : "s"}`;
  return `${wholePacks}${fraction} Packs`;
}
