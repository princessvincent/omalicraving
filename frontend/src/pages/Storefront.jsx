import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { BRAND } from "../config.js";
import { useToast } from "../useToast.js";
import { loadWishlist, saveWishlist } from "../cartStore.js";
import NavBar from "../components/NavBar.jsx";
import Footer from "../components/Footer.jsx";

const CURRENCY_SYMBOL = "₦";

export default function Storefront() {
  const { message, show, toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [search, setSearch] = useState("");
  const [wishlist, setWishlist] = useState(loadWishlist);
  const [wishlistOpen, setWishlistOpen] = useState(false);

  useEffect(() => {
    api
      .getProducts()
      .then(setProducts)
      .catch(() => setLoadError("Could not load products. Please refresh."));
  }, []);

  // A product's own page links back here with ?openWishlist=1 (e.g. after
  // "Save" there) so the customer lands with the sheet already open instead
  // of having to tap the icon again.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("openWishlist")) {
      setWishlistOpen(true);
      window.history.replaceState({}, "", window.location.pathname + window.location.hash);
    }
    if (params.get("q")) {
      setSearch(params.get("q"));
    }
  }, []);

  // Scroll to the listings grid once, the first time products have loaded,
  // if the nav's "Listings" link (or a shared /#listings link) brought us
  // here.
  useEffect(() => {
    if (window.location.hash === "#listings" && products.length > 0) {
      document.getElementById("listings")?.scrollIntoView({ behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  useEffect(() => saveWishlist(wishlist), [wishlist]);

  const categories = useMemo(() => ["All", ...new Set(products.map((p) => p.category))], [products]);
  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const inCat = activeCat === "All" || p.category === activeCat;
      const inSearch =
        !term || p.name.toLowerCase().includes(term) || (p.description || "").toLowerCase().includes(term) || p.category.toLowerCase().includes(term);
      return inCat && inSearch;
    });
  }, [products, activeCat, search]);
  const money = (n) => `${CURRENCY_SYMBOL}${Number(n).toLocaleString()}`;

  const wishlistProducts = useMemo(
    () => wishlist.map((id) => products.find((p) => String(p.id) === String(id))).filter(Boolean),
    [wishlist, products]
  );
  const wishlistCount = wishlistProducts.length;
  const isWishlisted = (id) => wishlist.includes(String(id));

  function toggleWishlist(id) {
    const key = String(id);
    setWishlist((prev) => {
      const already = prev.includes(key);
      if (already) {
        toast("Removed from saved items");
        return prev.filter((x) => x !== key);
      }
      toast("Saved");
      return [...prev, key];
    });
  }

  // Builds a WhatsApp deep link with a pre-filled enquiry message for a
  // specific product, so tapping "I want this" drops the buyer straight
  // into a chat that already names the item and price.
  function inquiryLink(p) {
    const text = `Hi! I'm interested in "${p.name}" (${money(p.price)}). Is it available?`;
    return `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(text)}`;
  }

  function closeAll() {
    setWishlistOpen(false);
  }

  return (
    <div className="app">
      <div className={`toast${show ? " show" : ""}`}>{message}</div>

      <NavBar
        wishlistCount={wishlistCount}
        onWishlist={() => setWishlistOpen(true)}
        onSearch={(term) => {
          setSearch(term);
          document.getElementById("listings")?.scrollIntoView({ behavior: "smooth" });
        }}
        searchValue={search}
      />

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow-bar" />
            <div className="hero-eyebrow">Direct sourcing, no middlemen</div>
            <h1>
              See something you like? <em>Just ask.</em>
            </h1>
            <p>
              Browse real listings sourced from China — clothing, shoes, electronics and more. Tap "I want this" on
              anything you like and chat with us directly on WhatsApp to sort out pricing, quantity and shipping.
            </p>
            <div className="hero-cta">
              <a href="#listings" className="btn btn-primary btn-inline">Browse listings</a>
              <a href={`https://wa.me/${BRAND.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-inline">
                Chat with us
              </a>
            </div>
            <div className="hero-stars">
              <span className="stars">★★★★★</span> Trusted by buyers sourcing from China
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-circle">📦</div>
            <div className="hero-seal">🇨🇳<br />Direct<br />Sourcing</div>
            <div className="hero-chevrons">›<br />›<br />›</div>
          </div>
        </div>
      </section>

      <div className="trust-strip">
        <div className="trust-item"><div className="g">🔍</div><div className="t">Real listings, real photos</div></div>
        <div className="trust-item"><div className="g">💬</div><div className="t">Fast WhatsApp replies</div></div>
        <div className="trust-item"><div className="g">🤝</div><div className="t">No fees, no middlemen</div></div>
      </div>

      <div id="listings" className="section-intro">
        <div className="section-intro-copy">
          <div className="section-label">Our listings</div>
          <h2>Everything currently available to source.</h2>
          <p>Tap "I want this" on anything you like — we'll sort the rest over WhatsApp.</p>
        </div>
      </div>

      <div className="cats">
        {categories.map((c) => (
          <div key={c} className={`chip${activeCat === c ? " active" : ""}`} onClick={() => setActiveCat(c)}>
            {c}
          </div>
        ))}
      </div>

      <main>
        {loadError && <div className="empty">{loadError}</div>}
        {!loadError && visibleProducts.length === 0 && (
          <div className="empty">
            <div className="glyph">🗃️</div>
            {products.length === 0 ? "Loading listings…" : "No listings in this category yet."}
          </div>
        )}
        <div className="grid">
          {visibleProducts.map((p) => (
            <div className="card" key={p.id}>
              <Link to={`/product/${p.slug}`} className="card-link">
                <div className="card-img">
                  {p.image ? <img src={p.image} alt="" /> : "📦"}
                </div>
              </Link>
              <button
                className={`wish-btn${isWishlisted(p.id) ? " active" : ""}`}
                aria-label={isWishlisted(p.id) ? "Remove from saved items" : "Save this item"}
                onClick={() => toggleWishlist(p.id)}
              >
                {isWishlisted(p.id) ? "♥" : "♡"}
              </button>
              <div className="card-body">
                <Link to={`/product/${p.slug}`} className="card-link">
                  <div className="card-name">{p.name}</div>
                  <div className="card-desc">{p.description}</div>
                </Link>
                <div className="card-foot">
                  <div className="price">{money(p.price)}</div>
                  <a className="iwant-btn" href={inquiryLink(p)} target="_blank" rel="noopener noreferrer">
                    💬 I want this
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />

      <div className={`sheet-scrim${wishlistOpen ? " show" : ""}`} onClick={closeAll} />

      {/* ---- saved items sheet ---- */}
      <div className={`sheet${wishlistOpen ? " show" : ""}`}>
        <div className="sheet-handle" />
        <div className="sheet-head"><h3>Saved items</h3><button className="sheet-close" onClick={() => setWishlistOpen(false)}>✕</button></div>
        <div className="sheet-body">
          {wishlistCount === 0 ? (
            <div className="empty"><div className="glyph">♡</div>Nothing saved yet. Tap the heart on any listing to save it for later.</div>
          ) : (
            wishlistProducts.map((p) => (
              <div className="cart-line" key={p.id}>
                <div className="cl-img">{p.image ? <img src={p.image} alt="" /> : "📦"}</div>
                <div className="cl-info">
                  <div className="cl-name">{p.name}</div>
                  <div className="cl-price">{money(p.price)}</div>
                </div>
                <button className="icon-sm" title="Remove from saved items" onClick={() => toggleWishlist(p.id)}>♥</button>
                <a
                  className="pill-btn"
                  style={{ padding: "8px 12px", fontSize: 11.5 }}
                  href={inquiryLink(p)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  💬 I want this
                </a>
              </div>
            ))
          )}
        </div>
        {wishlistCount > 0 && (
          <div className="sheet-foot">
            <button className="btn btn-ghost" onClick={() => setWishlistOpen(false)}>Keep browsing</button>
          </div>
        )}
      </div>
    </div>
  );
}
