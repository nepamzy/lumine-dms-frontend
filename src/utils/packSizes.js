// Pack sizes per Bonchris's packaging: 50cl/35cl come 24 to a pack (half =
// 12), 1L comes 12 to a pack (half = 6). Orders are placed in half-pack
// increments only — never single bottles.
const HALF_PACK_UNITS = { "35cl": 12, "50cl": 12, "1L": 6 };

export function halfPackUnits(size) {
  return HALF_PACK_UNITS[size] || 1;
}

export function packLabelFor(quantity, size) {
  const unit = halfPackUnits(size);
  const halfPacks = quantity / unit;
  if (halfPacks % 2 === 0) {
    const packs = halfPacks / 2;
    return `${packs} Pack${packs === 1 ? "" : "s"}`;
  }
  if (halfPacks === 1) return "Half Pack";
  return `${(halfPacks / 2).toFixed(1)} Packs`;
}
