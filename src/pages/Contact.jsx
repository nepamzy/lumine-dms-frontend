import { useState } from "react";
import { sendContactMessage } from "../api/contact";
import Seo from "../components/Seo";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState(null); // null | "sending" | "sent" | "error"

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await sendContactMessage(form);
      setStatus("sent");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="bg-cream-50">
      <Seo
        title="Contact"
        description="Get in touch with Lumine / Bonchris Industry Nig. Ltd — questions about orders, distribution, or partnerships."
        path="/contact"
      />
      <section className="text-center px-6 pt-16 pb-10 max-w-2xl mx-auto">
        <h1 className="font-display font-bold text-3xl md:text-4xl text-navy-900 mb-3">
          Contact Us
        </h1>
        <p className="text-navy-900/60 text-sm md:text-base">
          We'd love to hear from you. Reach out anytime.
        </p>
      </section>

      <section className="max-w-2xl mx-auto px-6 pb-8 space-y-5">
        <div className="flex items-start gap-4 bg-white rounded-card shadow-card p-4">
          <span className="w-10 h-10 rounded-lg bg-navy-900/5 flex items-center justify-center text-navy-900">
            📍
          </span>
          <div>
            <h3 className="font-display font-bold text-navy-900 text-sm mb-1">Visit Us</h3>
            <p className="text-sm text-navy-900/60">
              Eq, 15 Bida Road by Abeokuta Street, Kaduna North, Kaduna
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 bg-white rounded-card shadow-card p-4">
          <span className="w-10 h-10 rounded-lg bg-navy-900/5 flex items-center justify-center text-navy-900">
            📞
          </span>
          <div>
            <h3 className="font-display font-bold text-navy-900 text-sm mb-1">Call Us</h3>
            <p className="text-sm text-navy-900/60">+234 703 110 2978</p>
            <p className="text-sm text-navy-900/60">+234 806 077 4734</p>
          </div>
        </div>

        <div className="flex items-start gap-4 bg-white rounded-card shadow-card p-4">
          <span className="w-10 h-10 rounded-lg bg-navy-900/5 flex items-center justify-center text-navy-900">
            ✉️
          </span>
          <div>
            <h3 className="font-display font-bold text-navy-900 text-sm mb-1">Email Us</h3>
            <p className="text-sm text-navy-900/60">bonchrissupport@gmail.com</p>
          </div>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-6 pb-20">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-card shadow-card p-6 border border-navy-900/10"
        >
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-semibold text-navy-900 mb-1">
                Name <span className="text-status-danger">*</span>
              </label>
              <input
                id="contact-name"
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full border border-navy-900/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-navy-800"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-semibold text-navy-900 mb-1">
                Email <span className="text-status-danger">*</span>
              </label>
              <input
                id="contact-email"
                type="email"
                name="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full border border-navy-900/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-navy-800"
              />
            </div>
            <div>
              <label htmlFor="contact-phone" className="block text-sm font-semibold text-navy-900 mb-1">
                Phone
              </label>
              <input
                id="contact-phone"
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border border-navy-900/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-navy-800"
              />
            </div>
            <div>
              <label htmlFor="contact-subject" className="block text-sm font-semibold text-navy-900 mb-1">
                Subject <span className="text-status-danger">*</span>
              </label>
              <input
                id="contact-subject"
                type="text"
                name="subject"
                required
                value={form.subject}
                onChange={handleChange}
                className="w-full border border-navy-900/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-navy-800"
              />
            </div>
          </div>

          <div className="mb-5">
            <label htmlFor="contact-message" className="block text-sm font-semibold text-navy-900 mb-1">
              Message <span className="text-status-danger">*</span>
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              rows={5}
              value={form.message}
              onChange={handleChange}
              className="w-full border border-navy-900/15 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-navy-800"
            />
          </div>

          <button
            type="submit"
            disabled={status === "sending"}
            className="bg-gold-500 text-navy-900 font-bold text-sm px-6 py-3 rounded-md hover:bg-gold-700 transition-colors disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Send Message"}
          </button>

          {status === "sent" && (
            <p className="text-status-success text-sm mt-3">
              Thanks — your message has been received. We'll get back to you soon.
            </p>
          )}
          {status === "error" && (
            <p className="text-status-danger text-sm mt-3">
              Something went wrong. Please try again or email us directly.
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
