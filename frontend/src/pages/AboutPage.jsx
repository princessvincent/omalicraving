import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { BRAND } from "../config.js";
import { loadCart, loadWishlist } from "../cartStore.js";
import NavBar from "../components/NavBar.jsx";
import Footer from "../components/Footer.jsx";

export default function AboutPage() {
  const [about, setAbout] = useState(null);
  const [cart] = useState(loadCart);
  const [wishlist] = useState(loadWishlist);

  useEffect(() => {
    api.getAbout().then(setAbout).catch(() => setAbout({}));
  }, []);

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const wishlistCount = wishlist.length;

  const heading = about?.heading || `I am ${BRAND.name.split(" ")[0]}`;
  const subheading = about?.subheading || "Bringing the taste of home to Nigerians across China";
  const bio =
    about?.bio ||
    "The seller hasn't added her story yet — she can write one from the About Me tab in her admin dashboard.";

  return (
    <div className="app">
      <NavBar cartCount={cartCount} wishlistCount={wishlistCount} />

      <section className="page-hero">
        <div className="page-hero-inner">
          <div className="eyebrow-bar" />
          <h1>About Me</h1>
        </div>
        <div className="page-hero-diamond" />
      </section>

      <main>
        <div className="about-split">
          <div className="about-photo">
            {about?.photo ? <img src={about.photo} alt={heading} /> : <div className="about-photo-empty">🍲</div>}
          </div>
          <div className="about-copy">
            <div className="section-label">About Me</div>
            <h2>{heading}</h2>
            {about?.years_experience ? (
              <div className="about-years">{about.years_experience}+ years bringing Nigerian groceries to China</div>
            ) : null}
            <p className="about-sub">{subheading}</p>
            <p className="pd-desc" style={{ whiteSpace: "pre-line" }}>{bio}</p>
            <div className="hero-cta">
              <Link to="/#pantry" className="btn btn-primary btn-inline">Shop the pantry</Link>
              <a href={`https://wa.me/${BRAND.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-inline">
                Chat with us
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
