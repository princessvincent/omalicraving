// Shared localStorage "saved items" helper — used by Storefront and
// ProductDetail so saving an item on either page stays in sync everywhere
// else on the site. (Cart helpers were removed when the site moved from a
// pay-to-checkout flow to a WhatsApp-enquiry flow — nothing is added to a
// cart anymore, so nothing needs to persist one.)

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
