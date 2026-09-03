import { useState } from "react";

const FAQS = [
  {
    q: "What is Lumine?",
    a: "Lumine is a premium yoghurt brand operating across Nigeria, delivering fresh, quality dairy products to supermarkets, restaurants, hotels, pharmacies, and retailers nationwide.",
  },
  {
    q: "How do I become a Lumine customer?",
    a: "Visit our 'Become a Customer' page and fill out the registration form. Our team will review your application and activate your account within 24-48 hours. Once approved, you can log into the Customer Portal to browse products and place orders.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept debit card payments, bank transfers, and USSD payments. All payments go directly to Lumine — our distributors do not handle cash. Payment is confirmed automatically for card and USSD, while bank transfers are verified within a few hours.",
  },
  {
    q: "How does delivery work?",
    a: "Once your payment is confirmed, our warehouse prepares your order. A distributor in your area will be notified to pick up and deliver your products. You can track every stage of your order in real-time through the Customer Portal.",
  },
  {
    q: "What is the Lumine Loyalty Programme?",
    a: "Our loyalty programme rewards you for every purchase. You earn points based on your order value, which can be redeemed for discounts on future orders. Check the Loyalty section in your Customer Portal for your points balance and active promotions.",
  },
  {
    q: "How do I become a distributor?",
    a: "Visit our 'Distributor Opportunities' page and submit your application. We're looking for reliable logistics partners across all Nigerian states. Benefits include competitive commissions, a growing customer base, and full logistics support.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faqs" className="max-w-3xl mx-auto px-6 py-16">
      <p className="text-green-700 text-xs font-bold tracking-[3px] mb-3 text-center">FAQS</p>
      <h2 className="font-display font-extrabold text-3xl md:text-4xl text-navy-900 mb-10 text-center">
        Frequently Asked Questions
      </h2>

      <div className="divide-y divide-navy-900/10 border-t border-b border-navy-900/10">
        {FAQS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.q}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-4 py-5 text-left"
                aria-expanded={isOpen}
              >
                <span className="font-display font-bold text-navy-900 text-sm md:text-base">
                  {item.q}
                </span>
                <span
                  className={`shrink-0 text-navy-900 text-xl leading-none transition-transform ${
                    isOpen ? "rotate-45" : ""
                  }`}
                  aria-hidden="true"
                >
                  +
                </span>
              </button>
              {isOpen && (
                <p className="text-sm text-navy-900/70 leading-relaxed pb-5 pr-8">{item.a}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
