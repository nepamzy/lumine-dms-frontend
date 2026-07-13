import { useState } from "react";
import Bottle3D from "./Bottle3D";

// Carousel of interactive 3D bottles — one flavor rendered at a time via
// Bottle3D (drag or auto-rotate), with arrows + dots to switch flavors.
export default function BottleCarousel({ flavors }) {
  const [active, setActive] = useState(0);
  const current = flavors[active];

  const go = (dir) => {
    setActive((i) => (i + dir + flavors.length) % flavors.length);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-xs mx-auto" style={{ height: "340px" }}>
        <button
          onClick={() => go(-1)}
          aria-label="Previous flavor"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-card text-navy-900 flex items-center justify-center hover:bg-navy-900/5 transition-colors"
        >
          ‹
        </button>

        {/* key forces a clean remount per flavor so Three.js doesn't try to
            reuse a scene built for a different bottle's textures */}
        <Bottle3D key={current.name} frontImage={current.front} backImage={current.back} />

        <button
          onClick={() => go(1)}
          aria-label="Next flavor"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-card text-navy-900 flex items-center justify-center hover:bg-navy-900/5 transition-colors"
        >
          ›
        </button>
      </div>

      <span
        className="text-cream-50 rounded-full px-5 py-2.5 text-sm font-semibold mb-4"
        style={{ backgroundColor: current.color }}
      >
        {current.name}
      </span>

      <div className="flex items-center gap-2">
        {flavors.map((f, i) => (
          <button
            key={f.name}
            onClick={() => setActive(i)}
            aria-label={`Show ${f.name}`}
            className="w-2.5 h-2.5 rounded-full transition-colors"
            style={{ backgroundColor: i === active ? "#0A2D6F" : "#0A2D6F22" }}
          />
        ))}
      </div>

      <p className="text-xs text-navy-900/40 mt-3">Drag to rotate</p>
    </div>
  );
}
