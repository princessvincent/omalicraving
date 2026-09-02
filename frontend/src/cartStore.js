// Shared localStorage cart/wishlist helpers — used by both Storefront and
// ProductDetail so "Add to cart" on a single product's own page stays in
// sync with the cart the customer sees everywhere else on the site.

export function loadCart() {
  try {
    return JSON.parse(localStorage.getItem("cravings_cart") || "{}");
  } catch {
    return {};
  }
}
export function saveCart(cart) {
  try {
    localStorage.setItem("cravings_cart", JSON.stringify(cart));
  } catch {
    /* ignore */
  }
}

export function loadWishlist() {
  try {
    const raw = JSON.parse(localStorage.getItem("cravings_wishlist") || "[]");
    return Array.isArray(raw) ? raw.map(String) : [];
  } catch {
    return [];
  }
}
export function saveWishlist(list) {
  try {
    localStorage.setItem("cravings_wishlist", JSON.stringify(list));
  } catch {
    /* ignore */
  }
}
