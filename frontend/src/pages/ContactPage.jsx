import { useState } from "react";
import { BRAND } from "../config.js";
import { loadWishlist } from "../cartStore.js";
import NavBar from "../components/NavBar.jsx";
import Footer from "../components/Footer.jsx";

export default function ContactPage() {
  const [wishlist] = useState(loadWishlist);
  const [form, setForm] = useState({ name: "", message: "" });

  const wishlistCount = wishlist.length;

  function sendWhatsApp(e) {
    e.preventDefault();
    const text = `Hi ${BRAND.name}, my name is ${form.name || "..."}.\n\n${form.message || ""}`;
    window.open(`https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="app">
      <NavBar wishlistCount={wishlistCount} />

      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="eyebrow-bar" />
          <h1>Contact</h1>
          <p className="page-hero-sub">Questions about an item, pricing, or shipping? We'd love to hear from you.</p>
        </div>
        <div className="page-hero-diamond" />
      </section>

      <main>
        <div className="contact-split">
          <div className="contact-info">
            <div className="section-label">Get in touch</div>
            <h2>We reply fastest on WhatsApp</h2>
            <p className="pd-desc">
              For the quickest response, message us directly — we're usually online through the day and happy to help
              with sourcing, pricing, or shipping questions.
            </p>
            <a href={`https://wa.me/${BRAND.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-inline">
              Chat on WhatsApp
            </a>
            <div className="contact-fact">
              <span className="g">📍</span>
              <div>
                <div className="t">Based in</div>
                <div className="v">{BRAND.deliveryArea}</div>
              </div>
            </div>
            <div className="contact-fact">
              <span className="g">🕐</span>
              <div>
                <div className="t">Typical response time</div>
                <div className="v">Within a few hours, every day</div>
              </div>
            </div>
          </div>

          <form className="contact-form" onSubmit={sendWhatsApp}>
            <div className="section-label">Send a message</div>
            <h2>Write to us</h2>
            <div className="field"><label>Your name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field"><label>Message</label>
              <textarea
                placeholder="Tell us what you're looking for…"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <button className="btn btn-primary" type="submit">Send via WhatsApp</button>
            <div className="hint">This opens WhatsApp with your message ready to send — nothing is sent until you do.</div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
