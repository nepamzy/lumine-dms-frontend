import Seo from "../components/Seo";

const VALUES = [
  {
    icon: "♥",
    title: "Quality First",
    desc: "Every product meets the highest standards of freshness and safety.",
  },
  {
    icon: "◎",
    title: "Customer Focus",
    desc: "We listen, we adapt, and we deliver what our partners need.",
  },
  {
    icon: "◉",
    title: "Transparency",
    desc: "Open pricing, real-time tracking, complete visibility.",
  },
  {
    icon: "🏅",
    title: "Reliability",
    desc: "Consistent supply chain you can build your business on.",
  },
];

export default function About() {
  return (
    <div className="bg-cream-50">
      <Seo
        title="About"
        description="Learn about Lumine and Bonchris Industry Nig. Ltd — quality yoghurt, transparent pricing, and a reliable distribution network across Nigeria."
        path="/about"
      />
      {/* Hero */}
      <section
        className="relative overflow-hidden text-cream-50"
        style={{ background: "linear-gradient(180deg, #0F4DB8 0%, #0A2D6F 60%, #061C47 100%)" }}
      >
        <div className="max-w-2xl mx-auto text-center px-6 pt-16 pb-16 relative z-10">
          <h1 className="font-display font-extrabold text-4xl md:text-5xl mb-5">
            About Lumine
          </h1>
          <p className="text-cream-50/70 text-sm md:text-base max-w-lg mx-auto">
            Born from a passion for quality dairy, Lumine is on a mission to nourish Nigeria
            with fresh, premium yoghurt, delivered with care from our facilities to your table.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="max-w-2xl mx-auto px-6 pt-16 pb-10 text-center">
        <h2 className="font-display font-extrabold text-3xl md:text-4xl text-navy-900 mb-6">
          Our Story
        </h2>
        <p className="text-navy-900/70 text-sm md:text-base leading-relaxed">
          Lumine started with a simple belief: every Nigerian deserves access to fresh,
          high-quality yoghurt. Founded in Kaduna, we've grown from a small production unit
          to a nationwide distribution network serving supermarkets, restaurants, hotels, and
          homes across all 36 states and the FCT.
        </p>
        <p className="text-navy-900/70 text-sm md:text-base leading-relaxed mt-4">
          Our state-of-the-art production facility combines traditional craftsmanship with
          modern technology to create yoghurt that's consistently creamy, delicious, and
          packed with nutrients. Every batch is quality-tested before it reaches our network
          of trusted distributors.
        </p>
      </section>

      {/* Stat block */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <div className="bg-navy-900/[0.03] rounded-card p-10 text-center">
          <p className="font-display font-extrabold text-4xl text-navy-900 mb-2">
            10<span className="text-gold-500">+</span>
          </p>
          <p className="text-navy-900/70 text-sm md:text-base">Years of Excellence</p>
        </div>
      </section>

      {/* Our Values */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="font-display font-extrabold text-3xl md:text-4xl text-navy-900 text-center mb-10">
          Our Values
        </h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {VALUES.map((v) => (
            <div
              key={v.title}
              className="bg-white rounded-card shadow-card border border-navy-900/10 p-6"
            >
              <div className="w-10 h-10 rounded-lg bg-navy-900/5 flex items-center justify-center text-navy-900 text-xl mb-4">
                {v.icon}
              </div>
              <h3 className="font-display font-bold text-navy-900 mb-1">{v.title}</h3>
              <p className="text-sm text-navy-900/70">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
