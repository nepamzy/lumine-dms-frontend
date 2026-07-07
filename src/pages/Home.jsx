import { useState } from "react";
import { Link } from "react-router-dom";
import Bottle3D from "../components/Bottle3D";

import fullcreamWatermark from "../assets/fullcream-1L.png";
import fullcreamFront from "../assets/fullcream-1L-front.png";
import fullcreamBack from "../assets/fullcream-1L-back.png";
import liteFront from "../assets/lite-1L-front.png";
import liteBack from "../assets/lite-1L-back.png";
import sugarfreeFront from "../assets/sugarfree-1L-front.png";
import sugarfreeBack from "../assets/sugarfree-1L-back.png";

const FLAVORS = [
  { name: "Fullcream", front: fullcreamFront, back: fullcreamBack },
  { name: "Lite", front: liteFront, back: liteBack },
  { name: "Sugar Free", front: sugarfreeFront, back: sugarfreeBack },
];

export default function Home() {
  const [activeFlavor, setActiveFlavor] = useState(0);
  const flavor = FLAVORS[activeFlavor];

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
        style={{ width: 420, opacity: 0.18 }}
      />
      <section className="max-w-3xl mx-auto text-center px-6 pt-16 pb-4 relative z-10">
        <p className="text-gold-500 text-xs font-bold tracking-[3px] mb-3">
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

      <div className="relative z-10 h-96 max-w-md mx-auto">
        <Bottle3D frontImage={flavor.front} backImage={flavor.back} />
      </div>
      <p className="text-center text-[11px] text-cream-50/45 tracking-wide -mt-2 mb-4">
        drag to spin
      </p>

      <div className="flex flex-wrap justify-center gap-2.5 px-6 pb-16 relative z-10">
        {FLAVORS.map((f, i) => (
          <button
            key={f.name}
            onClick={() => setActiveFlavor(i)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors ${
              activeFlavor === i
                ? "bg-gold-500 text-navy-900 font-bold"
                : "bg-white/5 border border-white/10 text-cream-50/85 hover:bg-white/10"
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>
    </div>
  );
}