import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BRAND } from "../config.js";

const LINKS = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/#pantry" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

/**
 * Shared top navigation used on every page (Storefront, product pages,
 * About, Contact). Cart/wishlist can either open an in-page sheet (pass
 * onCart/onWishlist — Storefront does this) or, from any other page,
 * fall back to navigating home with a ?openCart=1 / ?openWishlist=1 query
 * param that Storefront picks up on load.
 */
export default function NavBar({ cartCount = 0, wishlistCount = 0, onCart, onWishlist, onSearch, searchValue = "" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [term, setTerm] = useState(searchValue);

  function submitSearch(e) {
    e.preventDefault();
    if (onSearch) onSearch(term);
    else navigate(`/?q=${encodeURIComponent(term)}#pantry`);
    setSearchOpen(false);
  }

  function goProducts(e) {
    setMenuOpen(false);
    if (location.pathname === "/") {
      e.preventDefault();
      document.getElementById("pantry")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="navbar">
      <div className="navbar-row">
        <Link to="/" className="brand">
          <div className="brand-mark">🍲</div>
          <div>
            <div className="brand-word">{BRAND.name}</div>
            <div className="brand-sub">Nigerian groceries in China</div>
          </div>
        </Link>

        <nav className="nav-links">
          {LINKS.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className={`nav-link${location.pathname === l.to ? " active" : ""}`}
              onClick={l.label === "Products" ? goProducts : undefined}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <button className="icon-btn" aria-label="Search products" onClick={() => setSearchOpen((v) => !v)}>
            🔍
          </button>
          {onWishlist ? (
            <button className="icon-btn" aria-label="Open wishlist" onClick={onWishlist}>
              ♡{wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
            </button>
          ) : (
            <Link to="/?openWishlist=1" className="icon-btn" aria-label="Open wishlist">
              ♡{wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
            </Link>
          )}
          {onCart ? (
            <button className="icon-btn" aria-label="Open cart" onClick={onCart}>
              🛒{cartCount > 0 && <span className="badge">{cartCount}</span>}
            </button>
          ) : (
            <Link to="/?openCart=1" className="icon-btn" aria-label="Open cart">
              🛒{cartCount > 0 && <span className="badge">{cartCount}</span>}
            </Link>
          )}
          <Link to="/account" className="nav-account-link" aria-label="Login or create an account">
            <span aria-hidden="true">👤</span> Login
          </Link>
          <Link to="/#pantry" className="btn-navcta" onClick={goProducts}>
            Shop now
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
            placeholder="Search garri, egusi, stockfish…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-inline">Search</button>
        </form>
      )}

      {menuOpen && (
        <nav className="nav-mobile-menu">
          {LINKS.map((l) => (
            <Link key={l.label} to={l.to} onClick={l.label === "Products" ? goProducts : () => setMenuOpen(false)}>
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
