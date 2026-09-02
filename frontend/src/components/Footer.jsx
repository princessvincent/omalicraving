import { Link } from "react-router-dom";
import { BRAND } from "../config.js";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="fb">
              <div className="brand-mark">🍲</div>
              <div className="brand-word" style={{ fontSize: 16 }}>{BRAND.name}</div>
            </div>
            <p>
              {BRAND.name} brings the taste of Nigeria to Nigerians — and the Nigeria-curious — across China.
              Real ingredients, real flavour, no compromises.
            </p>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Explore</div>
            <Link to="/">Home</Link>
            <Link to="/#pantry">Products</Link>
            <Link to="/about">About us</Link>
            <Link to="/contact">Contact</Link>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Get in touch</div>
            <a href={`https://wa.me/${BRAND.whatsappNumber}`} target="_blank" rel="noopener noreferrer">WhatsApp us</a>
            <span>{BRAND.deliveryArea}</span>
            <Link to="/account">My account</Link>
          </div>
        </div>
        <div className="footer-fine">© {new Date().getFullYear() || "2026"} {BRAND.name}. Delivering to {BRAND.deliveryArea}.</div>
      </div>
    </footer>
  );
}
