import { useEffect, useState } from "react";
import { getProductVariants } from "../api/products";
import { resolveUnitPrice } from "../context/CartContext";
import { quarterPackUnits, packLabelFor } from "../utils/packSizes";
import { useAuth } from "../context/AuthContext";
import fullcream35cl from "../assets/fullcream-35cl.png";
import fullcream50cl from "../assets/fullcream-50cl.png";
import fullcream1L from "../assets/fullcream-1L.png";
import sugarfree35cl from "../assets/sugarfree-35cl.png";
import sugarfree50cl from "../assets/sugarfree-50cl.png";
import sugarfree1L from "../assets/sugarfree-1L.png";
import lite35cl from "../assets/lite-35cl.png";
import lite50cl from "../assets/lite-50cl.png";
import lite1L from "../assets/lite-1L.png";

const PRODUCT_IMAGES = {
  fullcream: { "35cl": fullcream35cl, "50cl": fullcream50cl, "1L": fullcream1L },
  lite: { "35cl": lite35cl, "50cl": lite50cl, "1L": lite1L },
  "sugar-free": { "35cl": sugarfree35cl, "50cl": sugarfree50cl, "1L": sugarfree1L },
};

function getProductImage(name = "", size) {
  const normalized = name.toLowerCase().replace(/-/g, " ").trim();
  const key = Object.keys(PRODUCT_IMAGES).find((k) =>
    normalized.includes(k.replace(/-/g, " "))
  );
  return key ? PRODUCT_IMAGES[key][size] : null;
}
const FLAVOR_COLORS = {
  fullcream: "#1E3A8A",
  lite: "#2F6B2F",
  "sugar free": "#2F6B2F",
  strawberry: "#D6336C",
  banana: "#E0A800",
  fura: "#3D2B1F",
  plain: "#E8E8E8",
  chocolate: "#3D2410",
};

function flavorColor(name = "") {
  const key = Object.keys(FLAVOR_COLORS).find((k) => name.toLowerCase().includes(k));
  return key ? FLAVOR_COLORS[key] : "#0A2D6F";
}

export default function ProductCard({ product, onAdd }) {
  const { user } = useAuth();
  const isDistributor = user?.role === "distributor" && user?.distributor_type === "distributor";
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quarterPackCount, setQuarterPackCount] = useState(1); // number of quarter-packs — the smallest orderable unit

  useEffect(() => {
    getProductVariants(product.id)
      .then((data) => {
        setVariants(data);
        if (data.length > 0) setSelectedSize(data[0].size);
      })
      .finally(() => setLoading(false));
  }, [product.id]);

  const activeVariant = variants.find((v) => v.size === selectedSize);
  const unitsPerQuarterPack = quarterPackUnits(selectedSize);
  const quantity = quarterPackCount * unitsPerQuarterPack;
  const basePrice = activeVariant ? Number(activeVariant.packPrice) / (unitsPerQuarterPack * 4) : 0;
  const unitPrice = activeVariant ? resolveUnitPrice({ ...activeVariant, quantity }, isDistributor) : 0;
  const lineTotal = unitPrice * quantity;
  const baseLineTotal = basePrice * quantity;
  const isDiscounted = isDistributor && unitPrice < basePrice;

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    setQuarterPackCount(1); // reset to a quarter-pack whenever size changes, pack sizes differ per size
  };

  const packLabel = packLabelFor(quantity, selectedSize);

  const handleAdd = () => {
    if (!activeVariant) return;
    onAdd(activeVariant, product.name, quantity);
  };

  return (
    <div className="bg-white rounded-card shadow-card p-5 flex flex-col">
      <div
        className="h-40 rounded-lg mb-4 flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${flavorColor(product.name)}22, ${flavorColor(
            product.name
          )}11)`,
        }}
      >
        {selectedSize && getProductImage(product.name, selectedSize) ? (
          <img
            src={getProductImage(product.name, selectedSize)}
            alt={`${product.name} ${selectedSize}`}
            className="h-full object-contain"
            loading="lazy"
          />
        ) : (
          <div
            className="w-10 h-20 rounded-t-md rounded-b-lg"
            style={{
              background: `linear-gradient(135deg, #fff 0%, ${flavorColor(product.name)}33 100%)`,
              border: `2px solid ${flavorColor(product.name)}`,
            }}
          />
        )}
      </div>
      <span
        className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full w-fit mb-2"
        style={{
          background: `${flavorColor(product.name)}1A`,
          color: flavorColor(product.name),
        }}
      >
        {product.category || "Yoghurt"}
      </span>

      <h3 className="font-display font-bold text-navy-900 mb-1">{product.name}</h3>

      {loading && <p className="text-xs text-navy-900/50 mb-3">Loading sizes…</p>}

      {!loading && variants.length === 0 && (
        <p className="text-xs text-status-danger mb-3">No sizes available yet.</p>
      )}

      {!loading && variants.length > 0 && (
        <>
          {/* Size selector */}
          <div className="flex gap-1 mb-3">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => handleSizeSelect(v.size)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors ${
                  selectedSize === v.size
                    ? "bg-navy-800 text-cream-50 border-navy-800"
                    : "bg-white text-navy-900/70 border-navy-900/15 hover:border-navy-800"
                }`}
              >
                {v.size}
              </button>
            ))}
          </div>

          {/* Quarter-pack quantity stepper — orders are placed in
              quarter-pack increments, never single bottles */}
          <div className="flex items-center gap-2 mb-1">
            <button
              type="button"
              onClick={() => setQuarterPackCount((n) => Math.max(1, n - 1))}
              className="w-7 h-7 rounded-md border border-navy-900/15 text-navy-900 font-bold"
            >
              −
            </button>
            <span className="text-sm font-semibold text-navy-900 w-24 text-center">{packLabel}</span>
            <button
              type="button"
              onClick={() => setQuarterPackCount((n) => n + 1)}
              className="w-7 h-7 rounded-md border border-navy-900/15 text-navy-900 font-bold"
            >
              +
            </button>
          </div>
          <p className="text-[11px] text-navy-900/45 mb-3">{quantity} bottles</p>

          {/* Price display — always shows the TOTAL for the selected pack
              quantity, matching exactly what Cart/Checkout will charge */}
          <div className="mt-auto flex items-center justify-between">
            <div className="flex flex-col">
              {isDiscounted && (
                <span className="text-xs text-status-danger line-through">
                  ₦{baseLineTotal.toLocaleString()}
                </span>
              )}
              <span className="font-display font-bold text-navy-800">
                ₦{lineTotal.toLocaleString()}
              </span>
              <span className="text-[10px] text-navy-900/40">₦{unitPrice.toLocaleString()} / bottle</span>
            </div>
            <button
              onClick={handleAdd}
              className="bg-navy-800 text-cream-50 text-xs font-bold px-4 py-2 rounded-md hover:bg-gold-500 hover:text-navy-900 transition-colors"
            >
              Add to order
            </button>
          </div>
        </>
      )}
    </div>
  );
}