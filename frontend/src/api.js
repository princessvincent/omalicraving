// Where the Laravel backend lives.
//
// Normally this is whatever VITE_API_BASE_URL says (http://localhost:8000
// while you develop). The one exception is sharing your local site over a
// tunnel such as ngrok: the page is then open on someone else's computer,
// where "localhost" means THEIR machine, so calling it could never work.
// In that case we fall back to the empty string — every request becomes a
// same-origin one (/api/..., /storage/...) which the Vite dev server proxies
// through to Laravel (see vite.config.js). In production the frontend is
// built straight into Laravel's public/build-frontend and served by the
// same app, so every request is same-origin anyway — this only matters
// while running the frontend as its own `npm run dev` process.
// VITE_API_BASE_URL pointing at an actual backend domain is left alone.
const CONFIGURED_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";
const POINTS_AT_LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(CONFIGURED_BASE);
const SERVED_LOCALLY =
  typeof location === "undefined" || ["localhost", "127.0.0.1"].includes(location.hostname);
const API_BASE = (POINTS_AT_LOCALHOST && !SERVED_LOCALLY ? "" : CONFIGURED_BASE).replace(/\/+$/, "");

// Every call goes through here rather than calling fetch() directly, so the
// ngrok header below is set once instead of on twenty separate requests.
// `ngrok-skip-browser-warning` stops ngrok's free-tier "you are about to
// visit..." interstitial from being returned in place of real JSON. It is
// simply ignored when you are not tunnelling.
function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: { "ngrok-skip-browser-warning": "true", ...(options.headers || {}) },
  });
}

// One token, shared by every signed-in visitor — a customer and the seller
// alike. What they can each do is decided server-side by `is_staff` on the
// account behind the token, not by which key it's stored under.
const TOKEN_KEY = "cravings_token";

function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Token ${token}` } : {};
}

async function handle(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) {
    let message = (data && data.error) || `Request failed (${res.status})`;
    // In local development the backend attaches the real cause of a 500
    // (see shop/exceptions.py) — show it so bugs aren't a guessing game.
    if (data && data.debug) message += ` — ${data.debug}`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  // ---- public ----
  getProducts: () => apiFetch(`${API_BASE}/api/products/`).then(handle),
  getProduct: (slug) => apiFetch(`${API_BASE}/api/products/${encodeURIComponent(slug)}/`).then(handle),
  getCategories: () => apiFetch(`${API_BASE}/api/categories/`).then(handle),
  getAbout: () => apiFetch(`${API_BASE}/api/about/`).then(handle),

  submitReview: (slug, payload) =>
    apiFetch(`${API_BASE}/api/products/${encodeURIComponent(slug)}/reviews/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle),

  initCheckout: (payload) =>
    apiFetch(`${API_BASE}/api/orders/init/`, {
      method: "POST",
      // Guests need nothing here — this just lets a logged-in buyer's order
      // link to her account (and her address auto-save) when she has a token.
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    }).then(handle),

  confirmOrder: (reference) =>
    apiFetch(`${API_BASE}/api/orders/${encodeURIComponent(reference)}/confirm/`, {
      method: "POST",
    }).then(handle),

  initCheckoutStripe: (payload) =>
    apiFetch(`${API_BASE}/api/orders/init-stripe/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    }).then(handle),

  confirmOrderStripe: (reference) =>
    apiFetch(`${API_BASE}/api/orders/${encodeURIComponent(reference)}/confirm-stripe/`, {
      method: "POST",
    }).then(handle),

  // ---- account (customer + seller share this one login) ----
  saveToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  hasToken: () => !!localStorage.getItem(TOKEN_KEY),

  register: (payload) =>
    apiFetch(`${API_BASE}/api/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle),

  login: (payload) =>
    apiFetch(`${API_BASE}/api/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then(handle),

  logout: () => apiFetch(`${API_BASE}/api/auth/logout/`, { method: "POST", headers: authHeaders() }).then(handle),

  session: () => apiFetch(`${API_BASE}/api/auth/session/`, { headers: authHeaders() }).then(handle),

  getProfile: () => apiFetch(`${API_BASE}/api/auth/profile/`, { headers: authHeaders() }).then(handle),

  updateProfile: (payload) =>
    apiFetch(`${API_BASE}/api/auth/profile/`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    }).then(handle),

  getAccountCart: () => apiFetch(`${API_BASE}/api/auth/cart/`, { headers: authHeaders() }).then(handle),

  updateAccountCart: (items) =>
    apiFetch(`${API_BASE}/api/auth/cart/`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ items }),
    }).then(handle),

  // ---- admin ----
  adminListProducts: () => apiFetch(`${API_BASE}/api/admin/products/`, { headers: authHeaders() }).then(handle),

  adminCreateProduct: (formData) =>
    apiFetch(`${API_BASE}/api/admin/products/`, { method: "POST", headers: authHeaders(), body: formData }).then(handle),

  adminUpdateProduct: (id, formData) =>
    apiFetch(`${API_BASE}/api/admin/products/${id}/`, { method: "PATCH", headers: authHeaders(), body: formData }).then(handle),

  adminDeleteProduct: (id) =>
    apiFetch(`${API_BASE}/api/admin/products/${id}/`, { method: "DELETE", headers: authHeaders() }).then((res) => {
      if (!res.ok) throw new Error("Could not delete product");
      return true;
    }),

  adminListOrders: () => apiFetch(`${API_BASE}/api/admin/orders/`, { headers: authHeaders() }).then(handle),

  adminListCategories: () => apiFetch(`${API_BASE}/api/admin/categories/`, { headers: authHeaders() }).then(handle),

  adminCreateCategory: (name) =>
    apiFetch(`${API_BASE}/api/admin/categories/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ name }),
    }).then(handle),

  adminDeleteCategory: (id) =>
    apiFetch(`${API_BASE}/api/admin/categories/${id}/`, { method: "DELETE", headers: authHeaders() }).then((res) => {
      if (!res.ok) throw new Error("Could not delete category");
      return true;
    }),

  adminUploadProductImage: (productId, file) => {
    const fd = new FormData();
    fd.append("image", file);
    return apiFetch(`${API_BASE}/api/admin/products/${productId}/images/`, {
      method: "POST",
      headers: authHeaders(),
      body: fd,
    }).then(handle);
  },

  adminDeleteProductImage: (imageId) =>
    apiFetch(`${API_BASE}/api/admin/product-images/${imageId}/`, { method: "DELETE", headers: authHeaders() }).then((res) => {
      if (!res.ok) throw new Error("Could not delete photo");
      return true;
    }),

  adminListReviews: () => apiFetch(`${API_BASE}/api/admin/reviews/`, { headers: authHeaders() }).then(handle),

  adminApproveReview: (id) =>
    apiFetch(`${API_BASE}/api/admin/reviews/${id}/approve/`, { method: "POST", headers: authHeaders() }).then(handle),

  adminDeleteReview: (id) =>
    apiFetch(`${API_BASE}/api/admin/reviews/${id}/`, { method: "DELETE", headers: authHeaders() }).then((res) => {
      if (!res.ok) throw new Error("Could not delete review");
      return true;
    }),

  adminGetAbout: () => apiFetch(`${API_BASE}/api/admin/about/`, { headers: authHeaders() }).then(handle),

  adminUpdateAbout: (formData) =>
    apiFetch(`${API_BASE}/api/admin/about/`, { method: "PATCH", headers: authHeaders(), body: formData }).then(handle),
};

export { API_BASE };
