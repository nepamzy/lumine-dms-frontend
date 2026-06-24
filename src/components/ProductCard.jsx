import { useRef, useState } from "react";

const FLAVOR_COLORS = {
  fullcream: "#1E3A8A",
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
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -6, y: px * 6 }); // max 6deg, per design system
  };

  const resetTilt = () => setTilt({ x: 0, y: 0 });

  const outOfStock = Number(product.total_stock) <= 0;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetTilt}
      style={{
        transform: `perspective(600px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: "transform 0.15s ease-out",
      }}
      className="bg-white rounded-card shadow-card p-5 flex flex-col"
    >
      <div
        className="h-32 rounded-lg mb-4 flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${flavorColor(product.name)}22, ${flavorColor(
            product.name
          )}11)`,
        }}
      >
        <div
          className="w-10 h-20 rounded-t-md rounded-b-lg"
          style={{
            background: `linear-gradient(135deg, #fff 0%, ${flavorColor(product.name)}33 100%)`,
            border: `2px solid ${flavorColor(product.name)}`,
          }}
        />
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

      {!outOfStock && product.nearest_expiry && (
        <span className="text-[10px] font-bold uppercase tracking-wide text-green-500 mb-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
          Freshly Batched
        </span>
      )}

      <h3 className="font-display font-bold text-navy-900 mb-1">{product.name}</h3>
      <p className="text-sm text-navy-900/60 mb-3">SKU: {product.sku}</p>

      <div className="mt-auto flex items-center justify-between">
        <span className="font-display font-bold text-navy-800">
          ₦{Number(product.unit_price).toLocaleString()}
        </span>
        <button
          onClick={() => onAdd(product)}
          disabled={outOfStock}
          className="bg-navy-800 text-cream-50 text-xs font-bold px-4 py-2 rounded-md hover:bg-gold-500 hover:text-navy-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {outOfStock ? "Out of stock" : "Add to order"}
        </button>
      </div>
    </div>
  );
}
