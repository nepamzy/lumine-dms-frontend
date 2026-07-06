import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import fullcreamWatermark from "../assets/fullcream-1L.png";
const FLAVORS = [
  { name: "Fullcream", cap: "#1E3A8A", body: "#F4F1E8" },
  { name: "Lite", cap: "#2F6B2F", body: "#F1F0DE" },
  { name: "Sugar Free", cap: "#3D2B1F", body: "#C9A36A" },
];
function Bottle({ flavor, style }) {
  return (
    <div
      style={{
        position: "absolute",
        width: 80,
        height: 200,
        left: "50%",
        top: "50%",
        marginLeft: -40,
        marginTop: -100,
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          filter: "drop-shadow(0 16px 18px rgba(10,23,48,0.35))",
        }}
      >
        <div style={{ width: 26, height: 20, background: flavor.cap, borderRadius: "4px 4px 2px 2px" }} />
        <div style={{ width: 14, height: 12, background: "rgba(255,255,255,0.55)" }} />
        <div
          style={{
            width: 72,
            height: 136,
            background: `linear-gradient(135deg, ${flavor.body} 0%, rgba(255,255,255,0.85) 50%, ${flavor.body} 100%)`,
            borderRadius: "14px 14px 22px 22px",
            border: "1px solid rgba(255,255,255,0.6)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "38%",
              left: 4,
              right: 4,
              height: 42,
              background: "#0A2D6F",
              borderRadius: 6,
              border: "1.5px solid #F4B400",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <div style={{ width: 16, height: 16, borderRadius: "50%", border: "1.5px solid #F4B400" }} />
            <span
              style={{
                fontSize: 6,
                color: "#F4B400",
                letterSpacing: 1,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              {flavor.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductRing() {
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const lastX = useRef(0);
  const autoRotate = useRef(true);

  useEffect(() => {
    let raf;
    const tick = () => {
      if (autoRotate.current && !dragging) setRotation((r) => r + 0.15);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dragging]);

  const onPointerDown = (e) => {
    setDragging(true);
    autoRotate.current = false;
    lastX.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    setRotation((r) => r + (x - lastX.current) * 0.4);
    lastX.current = x;
  };
  const onPointerUp = () => {
    setDragging(false);
    setTimeout(() => (autoRotate.current = true), 1500);
  };

  return (
    <div
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onMouseLeave={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
      className="relative h-80 mt-6"
      style={{ perspective: 1000, cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
    >
      <div style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d" }}>
        {FLAVORS.map((flavor, i) => {
          const angle = (360 / FLAVORS.length) * i + rotation;
          return (
            <Bottle key={flavor.name} flavor={flavor} style={{ transform: `rotateY(${angle}deg) translateZ(190px)` }} />
          );
        })}
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-cream-50/45 tracking-wide">
        drag to spin
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div
      className="text-cream-50 relative overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0F4DB8 0%, #0A2D6F 65%, #061C47 100%)" }}
    >
      <img
        src={fullcreamWatermark}
        alt=""
        aria-hidden="true"
        className="absolute top-0 right-0 pointer-events-none select-none"
        style={{ width: 420, opacity: 0.08, filter: "grayscale(20%)" }}
      />
      <section className="max-w-3xl mx-auto text-center px-6 pt-16 pb-4 relative z-10">        <p className="text-gold-500 text-xs font-bold tracking-[3px] mb-3">
          ONE BRAND. MANY FLAVOURS.
        </p>
        <h1 className="font-display font-extrabold text-4xl md:text-5xl leading-tight mb-4">
          Endless <span className="text-gold-500">Goodness</span>, Delivered Across Nigeria.
        </h1>
        <p className="text-cream-50/70 text-sm md:text-base max-w-md mx-auto">
          Order, track, and grow with Lumine — from our warehouse to your shelf, in 6+ states and
          counting.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <Link
            to="/catalog"
            className="bg-gold-500 text-navy-900 font-bold text-sm px-6 py-3 rounded-md hover:bg-gold-700 transition-colors"
          >
            Browse Catalog
          </Link>
      <Link
            to="/register"
            className="border border-gold-500/50 text-cream-50 font-semibold text-sm px-6 py-3 rounded-md hover:bg-white/5 transition-colors"
          >
            Become a Distributor/Customer
          </Link>      
  </div>
      </section>

      <ProductRing />

      <div className="flex flex-wrap justify-center gap-2.5 px-6 pb-16">
        {FLAVORS.map((f) => (
          <div
            key={f.name}
            className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-cream-50/85"
          >
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: f.cap }} />
            {f.name}
          </div>
        ))}
      </div>
    </div>
  );
}
