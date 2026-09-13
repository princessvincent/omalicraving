import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { BRAND } from "../config.js";
import { loadWishlist } from "../cartStore.js";
import NavBar from "../components/NavBar.jsx";
import Footer from "../components/Footer.jsx";

export default function AboutPage() {
  const [about, setAbout] = useState(null);
  const [wishlist] = useState(loadWishlist);

  useEffect(() => {
    api.getAbout().then(setAbout).catch(() => setAbout({}));
  }, []);

  const wishlistCount = wishlist.length;

  const heading = about?.heading || `About ${BRAND.name}`;
  const subheading = about?.subheading || "Helping you source goods directly from China";
  const bio =
    about?.bio ||
    "The seller hasn't added her story yet — she can write one from the About Me tab in her admin dashboard.";

  return (
    <div className="app">
      <NavBar wishlistCount={wishlistCount} />

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
            {about?.photo ? <img src={about.photo} alt={heading} /> : <div className="about-photo-empty">📦</div>}
          </div>
          <div className="about-copy">
            <div className="section-label">About Me</div>
            <h2>{heading}</h2>
            {about?.years_experience ? (
              <div className="about-years">{about.years_experience}+ years sourcing goods from China</div>
            ) : null}
            <p className="about-sub">{subheading}</p>
            <p className="pd-desc" style={{ whiteSpace: "pre-line" }}>{bio}</p>
            <div className="hero-cta">
              <Link to="/#listings" className="btn btn-primary btn-inline">Browse listings</Link>
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
