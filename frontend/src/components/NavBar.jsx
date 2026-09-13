import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BRAND } from "../config.js";

const LINKS = [
  { label: "Home", to: "/" },
  { label: "Listings", to: "/#listings" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

/**
 * Shared top navigation used on every page (Storefront, product pages,
 * About, Contact). Wishlist ("Saved") can either open an in-page sheet
 * (pass onWishlist — Storefront does this) or, from any other page, fall
 * back to navigating home with a ?openWishlist=1 query param that
 * Storefront picks up on load.
 */
export default function NavBar({ wishlistCount = 0, onWishlist, onSearch, searchValue = "" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [term, setTerm] = useState(searchValue);

  function submitSearch(e) {
    e.preventDefault();
    if (onSearch) onSearch(term);
    else navigate(`/?q=${encodeURIComponent(term)}#listings`);
    setSearchOpen(false);
  }

  function goProducts(e) {
    setMenuOpen(false);
    if (location.pathname === "/") {
      e.preventDefault();
      document.getElementById("listings")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="navbar">
      <div className="navbar-row">
        <Link to="/" className="brand">
          <div className="brand-mark">📦</div>
          <div>
            <div className="brand-word">{BRAND.name}</div>
            <div className="brand-sub">Sourcing from China</div>
          </div>
        </Link>

        <nav className="nav-links">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className={`nav-link${location.pathname === l.to ? " active" : ""}`}
              onClick={l.label === "Listings" ? goProducts : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <button className="icon-btn" aria-label="Search listings" onClick={() => setSearchOpen((v) => !v)}>
            🔍
          </button>
          {onWishlist ? (
            <button className="icon-btn" aria-label="Open saved items" onClick={onWishlist}>
              ♡{wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
            </button>
          ) : (
            <Link to="/?openWishlist=1" className="icon-btn" aria-label="Open saved items">
              ♡{wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
            </Link>
          )}
          <Link to="/account" className="nav-account-link" aria-label="Login or create an account">
            <span aria-hidden="true">👤</span> Login
          </Link>
          <Link to="/#listings" className="btn-navcta" onClick={goProducts}>
            Browse listings
          </Link>
          <button className="nav-burger" aria-label="Open menu" onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {searchOpen && (
        <form className="nav-search-row" onSubmit={submitSearch}>
          <input
            autoFocus
            placeholder="Search listings…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-inline">Search</button>
        </form>
      )}

      {menuOpen && (
        <nav className="nav-mobile-menu">
          {LINKS.map((l) => (
            <Link key={l.label} to={l.to} onClick={l.label === "Listings" ? goProducts : () => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
