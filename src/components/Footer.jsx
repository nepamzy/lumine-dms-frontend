import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-navy-800 text-cream-50/80">
      <div className="max-w-6xl mx-auto px-6 py-14 grid gap-10 md:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-md bg-green-500 flex items-center justify-center font-display font-extrabold text-cream-50 text-sm">
              L
            </span>
            <span className="font-display font-bold text-cream-50 text-lg">Lumine</span>
          </div>
          <p className="text-sm text-cream-50/60 leading-relaxed">
            Premium yoghurt, delivered fresh across Nigeria. Quality you can trust.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-display font-bold text-cream-50 mb-4">Quick Links</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <Link to="/about" className="hover:text-gold-500 transition-colors">
                About Us
              </Link>
            </li>
            <li>
              <Link to="/catalog" className="hover:text-gold-500 transition-colors">
                Products
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-gold-500 transition-colors">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/#faqs" className="hover:text-gold-500 transition-colors">
                FAQs
              </Link>
            </li>
          </ul>
        </div>

        {/* For Business */}
        <div>
          <h3 className="font-display font-bold text-cream-50 mb-4">For Business</h3>
          <ul className="space-y-3 text-sm">
            <li>
              <Link to="/register?role=customer" className="hover:text-gold-500 transition-colors">
                Become a Customer
              </Link>
            </li>
            <li>
              <Link to="/register?role=distributor" className="hover:text-gold-500 transition-colors">
                Distributor Opportunities
              </Link>
            </li>
            <li>
              <Link to="/register?role=sales_rep" className="hover:text-gold-500 transition-colors">
                Sales Rep Opportunities
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-gold-500 transition-colors">
                Customer Login
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-gold-500 transition-colors">
                Distributor Login
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-display font-bold text-cream-50 mb-4">Contact</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <span aria-hidden="true">📍</span>
              <span>Eq, 15 Bida Road by Abeokuta Street, Kaduna North, Kaduna</span>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true">📞</span>
              <a href="tel:+2347031102978" className="hover:text-gold-500 transition-colors">
                +234 703 110 2978
              </a>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true">📞</span>
              <a href="tel:+2348060774734" className="hover:text-gold-500 transition-colors">
                +234 806 077 4734
              </a>
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true">✉️</span>
              <a
                href="mailto:bonchrissupport@gmail.com"
                className="hover:text-gold-500 transition-colors"
              >
                bonchrissupport@gmail.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-cream-50/60">
        © {new Date().getFullYear()} Lumine — a Bonchris Industry Nig. Ltd brand. All rights reserved.
      </div>
    </footer>
  );
}
