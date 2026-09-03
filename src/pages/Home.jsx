import { Link } from "react-router-dom";
import { useRef, useState } from "react";
import FAQ from "../components/FAQ";
import AdminLoginModal from "../components/AdminLoginModal";
import Seo from "../components/Seo";
import fullcream1L from "../assets/fullcream-1L.png";
import fullcream50cl from "../assets/fullcream-50cl.png";
import fullcream35cl from "../assets/fullcream-35cl.png";
import lite1L from "../assets/lite-1L.png";
import lite50cl from "../assets/lite-50cl.png";
import lite35cl from "../assets/lite-35cl.png";
import sugarfree1L from "../assets/sugarfree-1L.png";
import sugarfree50cl from "../assets/sugarfree-50cl.png";
import sugarfree35cl from "../assets/sugarfree-35cl.png";

const FLAVORS = [
  {
    name: "Full Cream",
    color: "#0A2D6F",
    sizes: [
      { label: "35cl", image: fullcream35cl },
      { label: "50cl", image: fullcream50cl },
      { label: "1 Litre", image: fullcream1L },
    ],
  },
  {
    name: "Sugar Free",
    color: "#2E9E44",
    sizes: [
      { label: "35cl", image: sugarfree35cl },
      { label: "50cl", image: sugarfree50cl },
      { label: "1 Litre", image: sugarfree1L },
    ],
  },
  {
    name: "Lite",
    color: "#0F4DB8",
    sizes: [
      { label: "35cl", image: lite35cl },
      { label: "50cl", image: lite50cl },
      { label: "1 Litre", image: lite1L },
    ],
  },
];

export default function Home() {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const tapCount = useRef(0);
  const lastTapTime = useRef(0);

  // Hidden admin entry point — tap the Premium Quality badge 3 times
  // within 2 seconds. Not linked or hinted at anywhere else on the site.
  const handleBadgeTap = () => {
    const now = Date.now();
    if (now - lastTapTime.current > 2000) tapCount.current = 0;
    tapCount.current += 1;
    lastTapTime.current = now;
    if (tapCount.current >= 3) {
      tapCount.current = 0;
      setShowAdminLogin(true);
    }
  };

  return (
    <div className="bg-cream-50">
      <Seo
        title="Home"
        description="Lumine yoghurt from Bonchris Industry Nig. Ltd, Kaduna — Full Cream, Lite, and Sugar-Free, in 35cl, 50cl, and 1L packs. Order online with nationwide distributor delivery."
        path="/"
      />
      {/* Hero */}
      <section
        className="relative overflow-hidden text-cream-50"
        style={{ background: "linear-gradient(180deg, #0F4DB8 0%, #0A2D6F 60%, #061C47 100%)" }}
      >
        <div className="max-w-3xl mx-auto text-center px-6 pt-16 pb-16 relative z-10">
          <span className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide text-gold-500 mb-6">
            ★ NAFDAC CERTIFIED · PREMIUM QUALITY
          </span>
          <h1 className="font-display font-extrabold text-4xl md:text-5xl leading-tight mb-5">
            Nigeria's Finest <br />
            <span className="text-gold-500">Yoghurt</span> Brand
          </h1>
          <p className="text-cream-50/70 text-sm md:text-base max-w-lg mx-auto mb-8">
            From our state-of-the-art facility to your doorstep. Lumine delivers fresh, premium
            yoghurt in flavours your customers will love. No stabilisers. No preservatives.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/catalog"
              className="bg-gold-500 text-navy-900 font-bold text-sm px-6 py-3 rounded-md hover:bg-gold-700 transition-colors flex items-center gap-2"
            >
              Order Now →
            </Link>
            <a
              href="#products"
              className="border border-white/20 text-cream-50 font-semibold text-sm px-6 py-3 rounded-md hover:bg-white/5 transition-colors flex items-center gap-2"
            >
              View Products
            </a>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="max-w-4xl mx-auto text-center px-6 pt-16 pb-10">
        <p className="text-green-500 text-xs font-bold tracking-[3px] mb-3">OUR RANGE</p>
        <h2 className="font-display font-extrabold text-3xl md:text-4xl text-navy-900 mb-4">
          3 Delicious Flavours
        </h2>
        <p className="text-navy-900/60 text-sm md:text-base max-w-md mx-auto mb-10">
          Full Cream, Sugar Free, and Lite — something for every customer.
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          {FLAVORS.map((f) => (
            <div key={f.name} className="bg-white rounded-card shadow-card p-6">
              <span
                className="inline-block text-cream-50 rounded-full px-4 py-1.5 text-xs font-bold mb-5"
                style={{ backgroundColor: f.color }}
              >
                {f.name}
              </span>
              <div className="flex items-end justify-center gap-4">
                {f.sizes.map((s) => (
                  <div key={s.label} className="flex flex-col items-center">
                    <img
                      src={s.image}
                      alt={`Lumine ${f.name} ${s.label}`}
                      loading="lazy"
                      className={
                        s.label === "1 Litre"
                          ? "h-32 md:h-36 object-contain drop-shadow-sm"
                          : s.label === "50cl"
                          ? "h-24 md:h-28 object-contain drop-shadow-sm"
                          : "h-16 md:h-20 object-contain drop-shadow-sm"
                      }
                    />
                    <span className="text-xs font-semibold text-navy-900/60 mt-2">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust badges */}
      <section className="max-w-4xl mx-auto px-6 py-16 grid gap-12 md:grid-cols-3 text-center">
        <div>
          <div className="w-14 h-14 mx-auto mb-4 rounded-full border-2 border-navy-900 flex items-center justify-center text-2xl">
            🛡️
          </div>
          <h3 className="font-display font-bold text-navy-900 mb-1">NAFDAC Certified</h3>
          <p className="text-sm text-navy-900/55">Fully approved and certified for your safety</p>
        </div>
        <div>
          <div
            onClick={handleBadgeTap}
            className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gold-500/15 flex items-center justify-center text-2xl cursor-default select-none"
          >
            🏅
          </div>
          <h3 className="font-display font-bold text-navy-900 mb-1">Premium Quality</h3>
          <p className="text-sm text-navy-900/55">Made from trusted, quality dairy ingredients</p>
        </div>
        <div>
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-navy-900/5 flex items-center justify-center text-2xl">
            🚚
          </div>
          <h3 className="font-display font-bold text-navy-900 mb-1">Nationwide Delivery</h3>
          <p className="text-sm text-navy-900/55">Fresh delivery across all 36 Nigerian states</p>
        </div>
      </section>

      {/* Join Lumine — 3-way CTA */}
      <section className="bg-navy-900/[0.03] py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display font-extrabold text-2xl md:text-3xl text-navy-900 mb-2">
            Join Lumine
          </h2>
          <p className="text-navy-900/55 text-sm mb-10 max-w-md mx-auto">
            However you want to work with us, there's a place for you.
          </p>
          <div className="grid gap-5 sm:grid-cols-3">
            <Link
              to="/register?role=distributor"
              className="bg-white rounded-card shadow-card p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="font-display font-bold text-navy-900 mb-1">Become a Distributor</h3>
              <p className="text-sm text-navy-900/55">
                Buy at discount, resell in your territory, and refer other distributors.
              </p>
            </Link>
            <Link
              to="/register?role=sales_rep"
              className="bg-white rounded-card shadow-card p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="font-display font-bold text-navy-900 mb-1">Become a Sales Rep</h3>
              <p className="text-sm text-navy-900/55">
                Bring in customers, place orders on their behalf, and grow your book.
              </p>
            </Link>
            <Link
              to="/register?role=customer"
              className="bg-white rounded-card shadow-card p-6 hover:shadow-md transition-shadow"
            >
              <h3 className="font-display font-bold text-navy-900 mb-1">Become a Customer</h3>
              <p className="text-sm text-navy-900/55">
                Order fresh Lumine yoghurt for your business, delivered to your door.
              </p>
            </Link>
          </div>
        </div>
      </section>

      <FAQ />

      {showAdminLogin && <AdminLoginModal onClose={() => setShowAdminLogin(false)} />}
    </div>
  );
}
