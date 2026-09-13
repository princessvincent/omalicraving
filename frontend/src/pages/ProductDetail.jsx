import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";
import { BRAND } from "../config.js";
import { useToast } from "../useToast.js";
import { loadWishlist, saveWishlist } from "../cartStore.js";
import NavBar from "../components/NavBar.jsx";
import Footer from "../components/Footer.jsx";

const emptyReview = { name: "", rating: 0, comment: "" };
const CURRENCY_SYMBOL = "₦";

export default function ProductDetail() {
  const { slug } = useParams();
  const { message, show, toast } = useToast();

  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const [wishlist, setWishlist] = useState(loadWishlist);

  const [reviewForm, setReviewForm] = useState(emptyReview);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewDone, setReviewDone] = useState(false);

  const money = (n) => `${CURRENCY_SYMBOL}${Number(n).toLocaleString()}`;

  useEffect(() => {
    setProduct(null);
    setNotFound(false);
    setActiveImg(0);
    setReviewForm(emptyReview);
    setReviewDone(false);
    setReviewError("");
    api
      .getProduct(slug)
      .then(setProduct)
      .catch(() => setNotFound(true));
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => saveWishlist(wishlist), [wishlist]);

  const wishlistCount = wishlist.length;
  const isWishlisted = product ? wishlist.includes(String(product.id)) : false;

  const images = product ? [product.image, ...product.extra_images.map((i) => i.image)].filter(Boolean) : [];

  function toggleWishlist() {
    if (!product) return;
    const key = String(product.id);
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

  // Builds a WhatsApp deep link with a pre-filled enquiry message naming
  // this specific product and its price.
  function inquiryLink() {
    if (!product) return `https://wa.me/${BRAND.whatsappNumber}`;
    const text = `Hi! I'm interested in "${product.name}" (${money(product.price)}). Is it available?`;
    return `https://wa.me/${BRAND.whatsappNumber}?text=${encodeURIComponent(text)}`;
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!reviewForm.name.trim()) {
      setReviewError("Add your name.");
      return;
    }
    if (!reviewForm.rating) {
      setReviewError("Pick a star rating.");
      return;
    }
    setReviewSubmitting(true);
    setReviewError("");
    try {
      await api.submitReview(product.slug, {
        customer_name: reviewForm.name.trim(),
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      });
      setReviewDone(true);
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewSubmitting(false);
    }
  }

  const Topbar = <NavBar wishlistCount={wishlistCount} />;

  if (notFound) {
    return (
      <div className="app">
        {Topbar}
        <main>
          <div className="empty">
            <div className="glyph">📦</div>
            This listing isn't available anymore.
            <div style={{ marginTop: 14 }}>
              <Link to="/" className="btn btn-primary btn-inline" style={{ display: "inline-flex" }}>
                Back to listings
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="app">
        {Topbar}
        <main>
          <div className="empty">Loading…</div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <div className={`toast${show ? " show" : ""}`}>{message}</div>
      {Topbar}

      <main>
        <div className="pd-back">
          <Link to="/">← Back to listings</Link>
        </div>

        <div className="pd-layout">
          <div className="pd-gallery">
            <div className="pd-main-img">
              {images.length > 0 ? <img src={images[activeImg]} alt={product.name} /> : "📦"}
            </div>
            {images.length > 1 && (
              <div className="pd-thumbs">
                {images.map((src, i) => (
                  <button
                    key={i}
                    className={`pd-thumb${i === activeImg ? " active" : ""}`}
                    onClick={() => setActiveImg(i)}
                    aria-label={`Show photo ${i + 1}`}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pd-info">
            <div className="pd-cat">{product.category}</div>
            <h1 className="pd-title">{product.name}</h1>
            <div className="pd-rating">
              {product.rating_count > 0 ? (
                <>
                  <span className="stars">{"★".repeat(Math.round(product.rating_avg))}{"☆".repeat(5 - Math.round(product.rating_avg))}</span>
                  <span>{product.rating_avg} · {product.rating_count} review{product.rating_count === 1 ? "" : "s"}</span>
                </>
              ) : (
                <a href="#reviews">No reviews yet — be the first</a>
              )}
            </div>
            <div className="pd-price">{money(product.price)}</div>
            <p className="pd-desc">{product.description || "No description added yet."}</p>

            <div className="pd-actions">
              <a className="btn btn-primary" href={inquiryLink()} target="_blank" rel="noopener noreferrer">
                💬 I want this — ask on WhatsApp
              </a>
            </div>
            <button className={`pd-wish${isWishlisted ? " active" : ""}`} onClick={toggleWishlist}>
              {isWishlisted ? "♥ Saved" : "♡ Save this item"}
            </button>
          </div>
        </div>

        <section className="pd-reviews" id="reviews">
          <h2>Reviews</h2>
          <div className="pd-reviews-sum">
            {product.rating_count > 0
              ? `${product.rating_avg} average · ${product.rating_count} review${product.rating_count === 1 ? "" : "s"}`
              : "No reviews yet for this product."}
          </div>

          {product.reviews.map((r) => (
            <div className="review-card" key={r.id}>
              <div className="rc-top">
                <div>
                  <div className="rc-name">{r.customer_name}</div>
                  <div className="rc-date">{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
                <div className="rc-stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
              </div>
              {r.comment && <div className="rc-comment">{r.comment}</div>}
            </div>
          ))}

          <div className="review-form">
            <h3>Write a review</h3>
            {reviewDone ? (
              <div className="review-thanks">Thanks! Your review will show once we've checked it.</div>
            ) : (
              <form onSubmit={submitReview}>
                <div className="star-pick">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={n <= reviewForm.rating ? "on" : ""}
                      aria-label={`${n} star${n === 1 ? "" : "s"}`}
                      onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                    >
                      {n <= reviewForm.rating ? "★" : "☆"}
                    </button>
                  ))}
                </div>
                <div className="field"><label>Your name</label>
                  <input value={reviewForm.name} onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })} />
                </div>
                <div className="field"><label>Comment (optional)</label>
                  <textarea value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} />
                </div>
                <div className="error-text">{reviewError}</div>
                <button className="btn btn-primary btn-inline" type="submit" disabled={reviewSubmitting}>
                  {reviewSubmitting ? <span className="spinner" /> : null}
                  {reviewSubmitting ? "Sending…" : "Submit review"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
