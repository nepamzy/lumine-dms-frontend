import { Link } from "react-router-dom";
import FAQ from "../components/FAQ";
import fullcreamFront from "../assets/fullcream-1L-front.png";
import liteFront from "../assets/lite-1L-front.png";
import sugarfreeFront from "../assets/sugarfree-1L-front.png";

const FLAVORS = [
  { name: "Full Cream", image: fullcreamFront, color: "#0A2D6F" },
  { name: "Sugar Free", image: sugarfreeFront, color: "#2E9E44" },
  { name: "Lite", image: liteFront, color: "#2E9E44" },
];

export default function Home() {
  return (
    <div className="bg-cream-50">
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

        <div className="bg-navy-900/[0.03] rounded-card p-8 mb-8">
          <div className="flex justify-center items-end gap-6 md:gap-12">
            {FLAVORS.map((f) => (
              <img
                key={f.name}
                src={f.image}
                alt={`Lumine ${f.name} yoghurt bottle`}
                className="h-40 md:h-56 object-contain"
              />
            ))}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {FLAVORS.map((f) => (
            <span
              key={f.name}
              className="text-cream-50 rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{ backgroundColor: f.color }}
            >
              {f.name}
            </span>
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
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gold-500/15 flex items-center justify-center text-2xl">
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

      <FAQ />
    </div>
  );
}
