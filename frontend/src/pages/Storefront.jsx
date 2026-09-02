import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { BRAND } from "../config.js";
import { useToast } from "../useToast.js";
import { loadCart, saveCart, loadWishlist, saveWishlist } from "../cartStore.js";
import NavBar from "../components/NavBar.jsx";
import Footer from "../components/Footer.jsx";

export default function Storefront() {
  const { message, show, toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState(loadCart);
  const [wishlist, setWishlist] = useState(loadWishlist);
  const [currencySymbol, setCurrencySymbol] = useState("₦");

  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const [account, setAccount] = useState(null); // her account details, if she's signed in — null for guests
  const skipCartPush = useRef(true); // true until the initial account/cart sync below has settled
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [checkoutError, setCheckoutError] = useState("");
  const [payingWith, setPayingWith] = useState(null); // null | "paystack" | "stripe"
  const [lastOrder, setLastOrder] = useState(null);

  useEffect(() => {
    api
      .getProducts()
      .then(setProducts)
      .catch(() => setLoadError("Could not load products. Please refresh."));
  }, []);

  // A product's own page links back here with ?openCart=1 / ?openWishlist=1
  // (e.g. after "Add to cart" there) so the customer lands with the sheet
  // already open instead of having to tap the icon again.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("openCart")) {
      setCartOpen(true);
      window.history.replaceState({}, "", window.location.pathname + window.location.hash);
    } else if (params.get("openWishlist")) {
      setWishlistOpen(true);
      window.history.replaceState({}, "", window.location.pathname + window.location.hash);
    }
    if (params.get("q")) {
      setSearch(params.get("q"));
    }
  }, []);

  // Scroll to the product grid once, the first time products have loaded, if
  // the nav's "Products" link (or a shared /#pantry link) brought us here.
  useEffect(() => {
    if (window.location.hash === "#pantry" && products.length > 0) {
      document.getElementById("pantry")?.scrollIntoView({ behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products.length]);

  // Handle the customer coming back from Stripe's hosted checkout page.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stripeRef = params.get("stripe_ref");
    const stripeCancelled = params.get("stripe_cancel");
    if (stripeRef) {
      api
        .confirmOrderStripe(stripeRef)
        .then((data) => {
          setLastOrder(data.order);
          setCart({});
          setForm({ name: "", email: "", phone: "", address: "" });
          setSuccessOpen(true);
        })
        .catch((e) =>
          toast(`Payment received but confirmation failed: ${e.message}. Contact us with reference ${stripeRef}.`)
        )
        .finally(() => window.history.replaceState({}, "", window.location.pathname));
    } else if (stripeCancelled) {
      toast("Payment cancelled");
      window.history.replaceState({}, "", window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cart already survives "add to cart today, come back tomorrow" on the
  // SAME browser via localStorage (below). This is the extra step: if she's
  // signed in, her cart also follows her to a different device — whichever
  // side already has items wins (so logging in never silently empties a
  // cart on either end), and every change after that stays synced up.
  useEffect(() => {
    if (!api.hasToken()) {
      skipCartPush.current = false;
      return;
    }
    api
      .session()
      .then((data) => {
        setAccount(data);
        setForm((prev) => ({
          name: prev.name || data.name || "",
          email: prev.email || data.email || "",
          phone: prev.phone || data.phone || "",
          address: prev.address || data.address || "",
        }));
        return api.getAccountCart();
      })
      .then((cartData) => {
        const serverItems = cartData?.items || {};
        if (Object.keys(serverItems).length > 0) {
          setCart(serverItems); // her saved cart (e.g. from another device) wins
        } else if (Object.keys(cart).length > 0) {
          api.updateAccountCart(cart).catch(() => {}); // first sync of this browser's guest cart
        }
      })
      .catch(() => api.clearToken())
      .finally(() => {
        skipCartPush.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveCart(cart);
    if (account && !skipCartPush.current) {
      api.updateAccountCart(cart).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);
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
  const money = (n) => `${currencySymbol}${Number(n).toLocaleString()}`;

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find((p) => String(p.id) === String(id));
    return sum + (p ? p.price * qty : 0);
  }, 0);

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
        toast("Removed from wishlist");
        return prev.filter((x) => x !== key);
      }
      toast("Added to wishlist");
      return [...prev, key];
    });
  }

  function changeQty(id, delta) {
    setCart((prev) => {
      const next = { ...prev };
      const cur = next[id] || 0;
      const nextQty = Math.max(0, cur + delta);
      if (nextQty === 0) delete next[id];
      else next[id] = nextQty;
      if (delta > 0 && cur === 0) toast("Added to cart");
      return next;
    });
  }

  function removeFromCart(id) {
    setCart((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    toast("Removed from cart");
  }

  function openCheckout() {
    setCartOpen(false);
    setCheckoutError("");
    setCheckoutOpen(true);
  }

  function validateCheckoutForm() {
    const { name, email, phone, address } = form;
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      setCheckoutError("Please fill in every field.");
      return false;
    }
    return true;
  }

  async function submitCheckout() {
    if (!validateCheckoutForm()) return;
    setPayingWith("paystack");
    setCheckoutError("");
    try {
      const items = Object.entries(cart).map(([id, qty]) => ({ id: Number(id), qty }));
      const data = await api.initCheckout({ items, ...form });
      setCurrencySymbol(data.currencySymbol || currencySymbol);
      setPayingWith(null);

      if (!data.publicKey) {
        setCheckoutError("Payments aren't configured yet — add PAYSTACK_PUBLIC_KEY to the backend .env.");
        return;
      }
      if (!window.PaystackPop) {
        setCheckoutError("Payment script did not load. Check your internet connection and try again.");
        return;
      }

      const handler = window.PaystackPop.setup({
        key: data.publicKey,
        email: data.email,
        amount: data.amountKobo,
        currency: data.currency,
        ref: data.reference,
        callback: (response) => confirmOrder(response.reference),
        onClose: () => {},
      });
      setCheckoutOpen(false);
      handler.openIframe();
    } catch (e) {
      setPayingWith(null);
      setCheckoutError(e.message);
    }
  }

  async function submitCheckoutStripe() {
    if (!validateCheckoutForm()) return;
    setPayingWith("stripe");
    setCheckoutError("");
    try {
      const items = Object.entries(cart).map(([id, qty]) => ({ id: Number(id), qty }));
      const data = await api.initCheckoutStripe({ items, ...form });
      if (!data.sessionUrl) {
        setPayingWith(null);
        setCheckoutError("Stripe isn't configured yet — add STRIPE_SECRET_KEY to the backend .env.");
        return;
      }
      window.location.href = data.sessionUrl; // hand off to Stripe's own hosted payment page
    } catch (e) {
      setPayingWith(null);
      setCheckoutError(e.message);
    }
  }

  async function confirmOrder(reference) {
    try {
      const data = await api.confirmOrder(reference);
      setLastOrder(data.order);
      setCart({});
      setForm({ name: "", email: "", phone: "", address: "" });
      setSuccessOpen(true);
    } catch (e) {
      toast(`Payment received but confirmation failed: ${e.message}. Contact us with reference ${reference}.`);
    }
  }

  function closeAll() {
    setCartOpen(false);
    setWishlistOpen(false);
    setCheckoutOpen(false);
    setSuccessOpen(false);
  }

  return (
    <div className="app">
      <div className={`toast${show ? " show" : ""}`}>{message}</div>

      <NavBar
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        onCart={() => setCartOpen(true)}
        onWishlist={() => setWishlistOpen(true)}
        onSearch={(term) => {
          setSearch(term);
          document.getElementById("pantry")?.scrollIntoView({ behavior: "smooth" });
        }}
        searchValue={search}
      />

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <div className="eyebrow-bar" />
            <div className="hero-eyebrow">Authentic Nigerian groceries</div>
            <h1>
              {BRAND.tagline.split(", ")[0]}, <em>{BRAND.tagline.split(", ")[1]}</em>.
            </h1>
            <p>
              Garri, stockfish, egusi, crayfish — every ingredient your soup pot has been missing, sourced
              fresh and delivered to your door, wherever you are in China.
            </p>
            <div className="hero-cta">
              <a href="#pantry" className="btn btn-primary btn-inline">Order now</a>
              <a href={`https://wa.me/${BRAND.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-inline">
                Chat with us
              </a>
            </div>
            <div className="hero-stars">
              <span className="stars">★★★★★</span> Trusted by home cooks across China
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-circle">🥘</div>
            <div className="hero-seal">🇳🇬<br />100%<br />Authentic</div>
            <div className="hero-chevrons">›<br />›<br />›</div>
          </div>
        </div>
      </section>

      <div className="trust-strip">
        <div className="trust-item"><div className="g">🌾</div><div className="t">Real Nigerian brands</div></div>
        <div className="trust-item"><div className="g">📦</div><div className="t">Packed with care</div></div>
        <div className="trust-item"><div className="g">💳</div><div className="t">Pay by card, safely</div></div>
      </div>

      <div id="pantry" className="section-intro">
        <div className="section-intro-copy">
          <div className="section-label">Our pantry</div>
          <h2>Everything you need to cook like home.</h2>
          <p>Pick your favourites — we'll take it from there.</p>
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
            {products.length === 0 ? "Loading the pantry…" : "No products in this category yet."}
          </div>
        )}
        <div className="grid">
          {visibleProducts.map((p) => {
            const qty = cart[p.id] || 0;
            return (
              <div className="card" key={p.id}>
                <Link to={`/product/${p.slug}`} className="card-link">
                  <div className="card-img">
                    {p.image ? <img src={p.image} alt="" /> : "🥘"}
                    {qty > 0 && <div className="card-tag">{qty} in cart</div>}
                  </div>
                </Link>
                <button
                  className={`wish-btn${isWishlisted(p.id) ? " active" : ""}`}
                  aria-label={isWishlisted(p.id) ? "Remove from wishlist" : "Add to wishlist"}
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
                    {qty === 0 ? (
                      <button className="add-btn" onClick={() => changeQty(p.id, 1)}>+</button>
                    ) : (
                      <div className="qty-pill">
                        <button onClick={() => changeQty(p.id, -1)}>−</button>
                        <span>{qty}</span>
                        <button onClick={() => changeQty(p.id, 1)}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />

      {cartCount > 0 && (
        <div className="cart-bar" onClick={() => setCartOpen(true)}>
          <div className="cl"><span className="count">{cartCount}</span> View cart</div>
          <div className="cr">{money(cartTotal)}</div>
        </div>
      )}

      <div className={`sheet-scrim${cartOpen || wishlistOpen || checkoutOpen || successOpen ? " show" : ""}`} onClick={closeAll} />

      {/* ---- cart sheet ---- */}
      <div className={`sheet${cartOpen ? " show" : ""}`}>
        <div className="sheet-handle" />
        <div className="sheet-head"><h3>Your cart</h3><button className="sheet-close" onClick={() => setCartOpen(false)}>✕</button></div>
        <div className="sheet-body">
          {cartCount === 0 ? (
            <div className="empty"><div className="glyph">🛒</div>Your cart is empty.</div>
          ) : (
            Object.entries(cart).map(([id, qty]) => {
              const p = products.find((p) => String(p.id) === String(id));
              if (!p) return null;
              return (
                <div className="cart-line" key={id}>
                  <div className="cl-img">{p.image ? <img src={p.image} alt="" /> : "🥘"}</div>
                  <div className="cl-info">
                    <div className="cl-name">{p.name}</div>
                    <div className="cl-price">{money(p.price)} each</div>
                    <button className="cl-remove" onClick={() => removeFromCart(id)}>🗑 Remove from cart</button>
                  </div>
                  <div className="cl-right">
                    <div className="cl-sub">{money(p.price * qty)}</div>
                    <div className="cl-ctrl">
                      <button onClick={() => changeQty(id, -1)}>−</button><span>{qty}</span><button onClick={() => changeQty(id, 1)}>+</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="sheet-foot">
          <div className="sum-row"><span>Subtotal</span><span>{money(cartTotal)}</span></div>
          <div className="sum-row"><span>Delivery</span><span>at checkout</span></div>
          <div className="sum-row total"><span>Total</span><span>{money(cartTotal)}</span></div>
          <button className="btn btn-primary" style={{ marginTop: 12 }} disabled={cartCount === 0} onClick={openCheckout}>
            Checkout
          </button>
        </div>
      </div>

      {/* ---- wishlist sheet ---- */}
      <div className={`sheet${wishlistOpen ? " show" : ""}`}>
        <div className="sheet-handle" />
        <div className="sheet-head"><h3>Your wishlist</h3><button className="sheet-close" onClick={() => setWishlistOpen(false)}>✕</button></div>
        <div className="sheet-body">
          {wishlistCount === 0 ? (
            <div className="empty"><div className="glyph">♡</div>Nothing saved yet. Tap the heart on any item to save it for later.</div>
          ) : (
            wishlistProducts.map((p) => (
              <div className="cart-line" key={p.id}>
                <div className="cl-img">{p.image ? <img src={p.image} alt="" /> : "🥘"}</div>
                <div className="cl-info">
                  <div className="cl-name">{p.name}</div>
                  <div className="cl-price">{money(p.price)}</div>
                </div>
                <button className="icon-sm" title="Remove from wishlist" onClick={() => toggleWishlist(p.id)}>♥</button>
                <button
                  className="pill-btn"
                  style={{ padding: "8px 12px", fontSize: 11.5 }}
                  onClick={() => {
                    changeQty(p.id, 1);
                  }}
                >
                  + Cart
                </button>
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

      {/* ---- checkout sheet ---- */}
      <div className={`sheet${checkoutOpen ? " show" : ""}`}>
        <div className="sheet-handle" />
        <div className="sheet-head"><h3>Your details</h3><button className="sheet-close" onClick={() => setCheckoutOpen(false)}>✕</button></div>
        <div className="sheet-body">
          <div className="field"><label>Full name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field"><label>Email</label>
            <input type="email" placeholder="for your payment receipt" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field"><label>Phone / WhatsApp</label>
            <input placeholder="+86 or +234 number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="field"><label>Delivery address</label>
            <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="error-text">{checkoutError}</div>
          <div className="hint">We receive this info by email the moment your payment goes through.</div>
        </div>
        <div className="sheet-foot" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button className="btn btn-accent" disabled={!!payingWith} onClick={submitCheckout}>
            {payingWith === "paystack" ? <span className="spinner" /> : null}
            {payingWith === "paystack" ? "Preparing…" : "Pay with Paystack"}
          </button>
          <button className="btn btn-primary" disabled={!!payingWith} onClick={submitCheckoutStripe}>
            {payingWith === "stripe" ? <span className="spinner" /> : null}
            {payingWith === "stripe" ? "Redirecting…" : "Pay with Stripe (international cards)"}
          </button>
          <div className="hint" style={{ textAlign: "center" }}>Choose whichever works with your card — both are secure.</div>
        </div>
      </div>

      {/* ---- success sheet ---- */}
      <div className={`sheet${successOpen ? " show" : ""}`}>
        <div className="sheet-handle" />
        <div className="sheet-head"><h3>Order placed</h3><button className="sheet-close" onClick={() => setSuccessOpen(false)}>✕</button></div>
        <div className="sheet-body">
          <div className="success-wrap">
            <div className="success-glyph">✓</div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 19, fontWeight: 600 }}>Payment successful</div>
            {lastOrder && (
              <>
                <div style={{ color: "var(--ink-faint)", fontSize: 12.5, marginTop: 4 }}>Order {lastOrder.reference}</div>
                <div className="receipt">
                  {lastOrder.items.map((l, i) => (
                    <div className="receipt-row" key={i}><span>{l.name} ×{l.qty}</span><b>{money(l.price * l.qty)}</b></div>
                  ))}
                  <div className="receipt-row" style={{ borderTop: "1px dashed var(--line)", paddingTop: 8, marginTop: 4 }}>
                    <span>Total paid</span><b>{money(lastOrder.total)}</b>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="sheet-foot">
          <button className="btn btn-primary" onClick={() => setSuccessOpen(false)}>Continue shopping</button>
        </div>
      </div>
    </div>
  );
}
