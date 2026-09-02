import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { BRAND } from "../config.js";
import { useToast } from "../useToast.js";

const emptyForm = { name: "", category: "", price: "", description: "" };
const emptyAbout = { heading: "", subheading: "", bio: "", years_experience: "" };

export default function Admin() {
  const { message, show, toast } = useToast();
  const navigate = useNavigate();
  // There's no login form on this page anymore — signing in happens on the
  // shared /account page. This just checks who (if anyone) is already
  // signed in, and whether that account is actually staff.
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const isStaff = !!user?.is_staff;

  const [view, setView] = useState("catalogue");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [currencySymbol] = useState("₦");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [galleryImages, setGalleryImages] = useState([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  // For a brand-new product (no id yet to attach photos to): files picked
  // here are held locally and uploaded automatically right after "Save
  // product" creates the product — no separate "come back and edit" step.
  const [pendingGalleryFiles, setPendingGalleryFiles] = useState([]);

  const [newCategory, setNewCategory] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

  const [aboutForm, setAboutForm] = useState(emptyAbout);
  const [aboutPhotoFile, setAboutPhotoFile] = useState(null);
  const [aboutPhotoPreview, setAboutPhotoPreview] = useState(null);
  const [savingAbout, setSavingAbout] = useState(false);
  const [aboutError, setAboutError] = useState("");

  const money = (n) => `${currencySymbol}${Number(n).toLocaleString()}`;

  useEffect(() => {
    if (!api.hasToken()) {
      setCheckingSession(false);
      return;
    }
    api
      .session()
      .then(setUser)
      .catch(() => {
        api.clearToken();
        setUser(null);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (isStaff) {
      loadProducts();
      loadOrders();
      loadCategories();
      loadReviews();
      loadAbout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStaff]);

  function loadProducts() {
    api.adminListProducts().then(setProducts).catch(() => toast("Could not load products"));
  }
  function loadOrders() {
    api.adminListOrders().then(setOrders).catch(() => toast("Could not load orders"));
  }
  function loadCategories() {
    api.adminListCategories().then(setCategories).catch(() => toast("Could not load categories"));
  }
  function loadReviews() {
    api.adminListReviews().then(setReviews).catch(() => toast("Could not load reviews"));
  }
  function loadAbout() {
    api
      .adminGetAbout()
      .then((data) => {
        setAboutForm({
          heading: data.heading || "",
          subheading: data.subheading || "",
          bio: data.bio || "",
          years_experience: data.years_experience ?? "",
        });
        setAboutPhotoPreview(data.photo || null);
      })
      .catch(() => toast("Could not load About Me content"));
  }

  function onAboutPhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAboutPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAboutPhotoPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function saveAbout() {
    setSavingAbout(true);
    setAboutError("");
    const fd = new FormData();
    fd.append("heading", aboutForm.heading.trim());
    fd.append("subheading", aboutForm.subheading.trim());
    fd.append("bio", aboutForm.bio.trim());
    if (aboutForm.years_experience !== "") fd.append("years_experience", aboutForm.years_experience);
    if (aboutPhotoFile) fd.append("photo", aboutPhotoFile);
    try {
      await api.adminUpdateAbout(fd);
      setAboutPhotoFile(null);
      toast("About Me page updated");
      loadAbout();
    } catch (err) {
      setAboutError(err.message);
    } finally {
      setSavingAbout(false);
    }
  }

  const pendingReviewCount = reviews.filter((r) => !r.approved).length;

  async function approveReview(id) {
    try {
      await api.adminApproveReview(id);
      toast("Review approved");
      loadReviews();
    } catch {
      toast("Could not approve review");
    }
  }

  async function deleteReview(id, wasApproved) {
    if (!confirm(wasApproved ? "Remove this review from the site?" : "Reject this review? It will not be shown.")) return;
    try {
      await api.adminDeleteReview(id);
      toast(wasApproved ? "Review removed" : "Review rejected");
      loadReviews();
    } catch {
      toast("Could not remove review");
    }
  }

  async function addCategory(e) {
    e.preventDefault();
    if (!newCategory.trim()) {
      setCategoryError("Give the category a name.");
      return;
    }
    setSavingCategory(true);
    setCategoryError("");
    try {
      await api.adminCreateCategory(newCategory.trim());
      setNewCategory("");
      loadCategories();
      toast("Category added");
    } catch (err) {
      setCategoryError(err.message);
    } finally {
      setSavingCategory(false);
    }
  }

  async function deleteCategory(id) {
    if (!confirm("Remove this category? Products already using it keep their category, it just won't be offered for new products.")) return;
    try {
      await api.adminDeleteCategory(id);
      toast("Category removed");
      loadCategories();
    } catch {
      toast("Could not delete category");
    }
  }

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    api.clearToken();
    setUser(null);
    // Leave the dashboard entirely — landing on the sign-in page beats
    // being left on /admin staring at the "Sign in required" lock screen.
    navigate("/account", { replace: true });
  }

  function openAdd() {
    if (categories.length === 0) {
      toast("Add a category first, then add your product");
      setView("categories");
      return;
    }
    setEditingId(null);
    setForm({ ...emptyForm, category: categories[0].name });
    setImageFile(null);
    setImagePreview(null);
    setGalleryImages([]);
    pendingGalleryFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setPendingGalleryFiles([]);
    setFormError("");
    setSheetOpen(true);
  }

  function openEdit(p) {
    setEditingId(p.id);
    setForm({ name: p.name, category: p.category, price: p.price, description: p.description || "" });
    setImageFile(null);
    setImagePreview(p.image || null);
    setGalleryImages(p.extra_images || []);
    pendingGalleryFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setPendingGalleryFiles([]);
    setFormError("");
    setSheetOpen(true);
  }

  function onGalleryFilesChosen(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;

    if (!editingId) {
      // New product: nothing to attach these to yet — hold them locally and
      // upload them right after "Save product" creates the product below.
      const withPreviews = files.map((f) => ({ file: f, previewUrl: URL.createObjectURL(f) }));
      setPendingGalleryFiles((prev) => [...prev, ...withPreviews]);
      return;
    }

    setUploadingPhoto(true);
    Promise.all(files.map((f) => api.adminUploadProductImage(editingId, f)))
      .then((uploaded) => {
        setGalleryImages((prev) => [...prev, ...uploaded]);
        loadProducts();
        toast(files.length > 1 ? "Photos added" : "Photo added");
      })
      .catch(() => toast("Could not upload photo"))
      .finally(() => setUploadingPhoto(false));
  }

  function removePendingGalleryFile(index) {
    setPendingGalleryFiles((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  }

  async function deleteGalleryImage(imageId) {
    try {
      await api.adminDeleteProductImage(imageId);
      setGalleryImages((prev) => prev.filter((img) => img.id !== imageId));
      loadProducts();
    } catch {
      toast("Could not remove photo");
    }
  }

  function onImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function saveProduct() {
    if (!form.name.trim() || !form.price) {
      setFormError("Add a name and price.");
      return;
    }
    setSaving(true);
    setFormError("");
    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("category", form.category.trim() || "General");
    fd.append("price", form.price);
    fd.append("description", form.description.trim());
    if (imageFile) fd.append("image", imageFile);

    try {
      if (editingId) {
        await api.adminUpdateProduct(editingId, fd);
      } else {
        const created = await api.adminCreateProduct(fd);
        if (pendingGalleryFiles.length > 0) {
          await Promise.all(pendingGalleryFiles.map((f) => api.adminUploadProductImage(created.id, f.file))).catch(
            () => toast("Product saved, but some extra photos didn't upload — add them from Edit.")
          );
          pendingGalleryFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
          setPendingGalleryFiles([]);
        }
      }
      setSheetOpen(false);
      loadProducts();
      toast("Product saved");
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisible(p) {
    const fd = new FormData();
    fd.append("active", p.active ? "false" : "true");
    try {
      await api.adminUpdateProduct(p.id, fd);
      loadProducts();
    } catch {
      toast("Could not update product");
    }
  }

  async function deleteProduct(id) {
    if (!confirm("Remove this product?")) return;
    try {
      await api.adminDeleteProduct(id);
      toast("Product removed");
      loadProducts();
    } catch {
      toast("Could not delete product");
    }
  }

  // Almost always just `categories`, but if an existing product's category
  // was typed before this list existed (or its category was since deleted),
  // fold it in too so editing that product never silently blanks it out.
  const categoryOptions =
    form.category && !categories.some((c) => c.name === form.category)
      ? [{ id: "current", name: form.category }, ...categories]
      : categories;

  if (checkingSession) {
    return <div className="app" />;
  }

  // Not signed in at all — send her to the one shared login page rather
  // than showing a login form here. Calling /admin directly with no
  // session lands here, never on the dashboard.
  if (!user) {
    return (
      <div className="app admin-shell">
        <div className="topbar admin-topbar">
          <div className="topbar-row">
            <a href="/" className="brand">
              <div className="brand-mark">🍲</div>
              <div>
                <div className="brand-word">{BRAND.name}</div>
                <div className="brand-sub">Admin</div>
              </div>
            </a>
          </div>
        </div>
        <main>
          <div className="admin-lock">
            <div className="glyph">🔒</div>
            <h3 style={{ margin: 0 }}>Sign in required</h3>
            <p>This dashboard is only for the shop admin. Sign in to continue.</p>
            <Link to="/account" className="btn btn-primary btn-inline" style={{ display: "inline-flex" }}>
              Go to sign in
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Signed in, but as an ordinary customer account, not staff — the
  // dashboard itself stays hidden. (Every admin/* API call is ALSO gated
  // server-side by IsAdminStaff, so this is a UX courtesy, not the real
  // security boundary — but it's still the right thing to show here.)
  if (!isStaff) {
    return (
      <div className="app admin-shell">
        <div className="topbar admin-topbar">
          <div className="topbar-row">
            <a href="/" className="brand">
              <div className="brand-mark">🍲</div>
              <div>
                <div className="brand-word">{BRAND.name}</div>
                <div className="brand-sub">Admin</div>
              </div>
            </a>
            <button className="act-btn danger" onClick={handleLogout}>
              <span className="ic">⎋</span> Log out
            </button>
          </div>
        </div>
        <main>
          <div className="admin-lock">
            <div className="glyph">🚫</div>
            <h3 style={{ margin: 0 }}>Not authorized</h3>
            <p>
              You're signed in as {user.email}, but this account doesn't have admin access. This page is only for
              the shop admin.
            </p>
            <Link to="/" className="btn btn-ghost btn-inline" style={{ display: "inline-flex" }}>
              Back to the pantry
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app admin-shell">
      <div className={`toast${show ? " show" : ""}`}>{message}</div>

      {/* Mobile-only top bar (a permanent sidebar doesn't fit on a phone) */}
      <div className="topbar admin-topbar">
        <div className="topbar-row">
          <a href="/" className="brand">
            <div className="brand-mark">🍲</div>
            <div>
              <div className="brand-word">{BRAND.name}</div>
              <div className="brand-sub">Admin</div>
            </div>
          </a>
          <button className="act-btn danger" onClick={handleLogout}>
            <span className="ic">⎋</span> Log out
          </button>
        </div>
        <div className="tabs-link">
          <button className={`tlink${view === "catalogue" ? " active" : ""}`} onClick={() => setView("catalogue")}>Catalogue</button>
          <button className={`tlink${view === "categories" ? " active" : ""}`} onClick={() => setView("categories")}>Categories</button>
          <button className={`tlink${view === "orders" ? " active" : ""}`} onClick={() => setView("orders")}>Orders</button>
          <button className={`tlink${view === "reviews" ? " active" : ""}`} onClick={() => setView("reviews")}>
            Reviews{pendingReviewCount > 0 ? ` (${pendingReviewCount})` : ""}
          </button>
          <button className={`tlink${view === "about" ? " active" : ""}`} onClick={() => setView("about")}>About Me</button>
        </div>
      </div>

      <div className="admin-frame">
        {/* Tablet/desktop sidebar — a real, always-visible nav with plain
            English labels, not just icons to guess at. */}
        <aside className="admin-sidebar">
          <a href="/" className="brand">
            <div className="brand-mark">🍲</div>
            <div>
              <div className="brand-word">{BRAND.name}</div>
              <div className="brand-sub">Admin</div>
            </div>
          </a>
          <nav className="admin-nav">
            <button className={`admin-nav-btn${view === "catalogue" ? " active" : ""}`} onClick={() => setView("catalogue")}>
              <span className="admin-nav-ic">📦</span> Catalogue
            </button>
            <button className={`admin-nav-btn${view === "categories" ? " active" : ""}`} onClick={() => setView("categories")}>
              <span className="admin-nav-ic">🏷️</span> Categories
            </button>
            <button className={`admin-nav-btn${view === "orders" ? " active" : ""}`} onClick={() => setView("orders")}>
              <span className="admin-nav-ic">🧾</span> Orders
            </button>
            <button className={`admin-nav-btn${view === "reviews" ? " active" : ""}`} onClick={() => setView("reviews")}>
              <span className="admin-nav-ic">⭐</span> Reviews
              {pendingReviewCount > 0 && <span className="nav-badge">{pendingReviewCount}</span>}
            </button>
            <button className={`admin-nav-btn${view === "about" ? " active" : ""}`} onClick={() => setView("about")}>
              <span className="admin-nav-ic">👩🏾‍🍳</span> About Me
            </button>
          </nav>
          <button className="admin-nav-btn admin-logout" onClick={handleLogout}>
            <span className="admin-nav-ic">⎋</span> Log out
          </button>
        </aside>

        <div className="admin-content">
          <main>
            {view === "catalogue" && (
              <>
                <div className="stat-row">
                  <div className="stat"><div className="v">{products.filter((p) => p.active).length}</div><div className="l">Products live</div></div>
                  <div className="stat"><div className="v">{orders.length}</div><div className="l">Orders total</div></div>
                </div>
                <div className="admin-head"><h2>Catalogue</h2><button className="pill-btn" onClick={openAdd}>+ Add product</button></div>
                {products.length === 0 ? (
                  <div className="empty"><div className="glyph">📦</div>No products yet — add your first one.</div>
                ) : (
                  products.map((p) => (
                    <div className="admin-row" key={p.id}>
                      <div className="admin-thumb">{p.image ? <img src={p.image} alt="" /> : "🥘"}</div>
                      <div className="admin-info">
                        <div className="n">{p.name}</div>
                        <div className="m">
                          {p.category} · {money(p.price)}
                          {!p.active && <span style={{ color: "var(--bad)" }}> · hidden</span>}
                        </div>
                      </div>
                      <div className="admin-acts">
                        <button className="act-btn" onClick={() => toggleVisible(p)}>
                          <span className="ic">{p.active ? "👁" : "🚫"}</span> {p.active ? "Hide" : "Show"}
                        </button>
                        <button className="act-btn" onClick={() => openEdit(p)}>
                          <span className="ic">✎</span> Edit
                        </button>
                        <button className="act-btn danger" onClick={() => deleteProduct(p.id)}>
                          <span className="ic">🗑</span> Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {view === "categories" && (
              <>
                <div className="admin-head"><h2>Categories</h2></div>
                <form className="admin-row" style={{ gap: 10 }} onSubmit={addCategory}>
                  <div className="field" style={{ margin: 0, flex: 1 }}>
                    <input
                      placeholder="e.g. Oils & Spices"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    />
                  </div>
                  <button className="pill-btn" type="submit" disabled={savingCategory}>
                    {savingCategory ? <span className="spinner" /> : null}
                    {savingCategory ? "Adding…" : "+ Add category"}
                  </button>
                </form>
                <div className="error-text">{categoryError}</div>
                <div className="hint" style={{ margin: "0 0 14px" }}>
                  Add every category your products fall under here first — you'll pick from this list when adding a product.
                </div>
                {categories.length === 0 ? (
                  <div className="empty"><div className="glyph">🏷️</div>No categories yet — add your first one above.</div>
                ) : (
                  categories.map((c) => (
                    <div className="admin-row" key={c.id}>
                      <div className="admin-info">
                        <div className="n">{c.name}</div>
                      </div>
                      <div className="admin-acts">
                        <button className="act-btn danger" onClick={() => deleteCategory(c.id)}>
                          <span className="ic">🗑</span> Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {view === "orders" && (
              <>
                <div className="admin-head"><h2>Orders</h2></div>
                {orders.length === 0 ? (
                  <div className="empty"><div className="glyph">🧾</div>No orders yet.</div>
                ) : (
                  orders.map((o) => {
                    const waNumber = (o.customer_phone || "").replace(/\D/g, "");
                    const statusColor = o.status === "paid" ? "var(--good)" : o.status === "failed" ? "var(--bad)" : "var(--ink-faint)";
                    return (
                      <div className="admin-row" style={{ alignItems: "flex-start", flexDirection: "column", gap: 6 }} key={o.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                          <b style={{ fontSize: 13 }}>{o.reference}</b>
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: statusColor }}>{o.status}</span>
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>{o.customer_name} · {o.customer_phone}</div>
                        <div style={{ fontSize: 12, color: "var(--ink-faint)" }}>{o.customer_address}</div>
                        <div style={{ fontSize: 12.5, fontWeight: 800 }}>{o.items.length} item(s) · {money(o.total)}</div>
                        {waNumber && (
                          <a href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 800, color: "var(--brand)" }}>
                            Message on WhatsApp →
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
              </>
            )}

            {view === "reviews" && (
              <>
                <div className="admin-head"><h2>Reviews</h2></div>
                {reviews.length === 0 ? (
                  <div className="empty"><div className="glyph">⭐</div>No reviews yet.</div>
                ) : (
                  reviews.map((r) => (
                    <div className="admin-row" style={{ alignItems: "flex-start", flexDirection: "column", gap: 6 }} key={r.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: 6 }}>
                        <b style={{ fontSize: 13 }}>{r.product_name}</b>
                        {!r.approved && (
                          <span style={{ fontSize: 10.5, fontWeight: 800, color: "var(--accent)", textTransform: "uppercase", letterSpacing: ".04em" }}>
                            Pending approval
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--accent)", letterSpacing: 1 }}>
                        {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)} <span style={{ color: "var(--ink-soft)", letterSpacing: 0 }}>— {r.customer_name}</span>
                      </div>
                      {r.comment && <div style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>{r.comment}</div>}
                      <div className="admin-acts">
                        {!r.approved && (
                          <button className="act-btn" onClick={() => approveReview(r.id)}>
                            <span className="ic">✓</span> Approve
                          </button>
                        )}
                        <button className="act-btn danger" onClick={() => deleteReview(r.id, r.approved)}>
                          <span className="ic">🗑</span> {r.approved ? "Remove" : "Reject"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {view === "about" && (
              <>
                <div className="admin-head"><h2>About Me</h2></div>
                <div className="hint" style={{ margin: "0 0 16px" }}>
                  This is what shows on your public "About" page — your photo and your own story, in your words.
                </div>
                <div className="field">
                  <label>Your photo</label>
                  <div className="imgpick">
                    <div className="prev">{aboutPhotoPreview ? <img src={aboutPhotoPreview} alt="" /> : "🖼️"}</div>
                    <label htmlFor="aboutPhotoInput">Choose photo</label>
                    <input id="aboutPhotoInput" type="file" accept="image/*" onChange={onAboutPhotoChange} />
                  </div>
                </div>
                <div className="field"><label>Heading</label>
                  <input
                    placeholder="I am Prisca, bringing the taste of home to China"
                    value={aboutForm.heading}
                    onChange={(e) => setAboutForm({ ...aboutForm, heading: e.target.value })}
                  />
                </div>
                <div className="field-row">
                  <div className="field"><label>Subheading</label>
                    <input
                      placeholder="A short line under your heading"
                      value={aboutForm.subheading}
                      onChange={(e) => setAboutForm({ ...aboutForm, subheading: e.target.value })}
                    />
                  </div>
                  <div className="field" style={{ maxWidth: 160 }}><label>Years of experience</label>
                    <input
                      placeholder="5"
                      inputMode="numeric"
                      value={aboutForm.years_experience}
                      onChange={(e) => setAboutForm({ ...aboutForm, years_experience: e.target.value.replace(/\D/g, "") })}
                    />
                  </div>
                </div>
                <div className="field"><label>Your story</label>
                  <textarea
                    style={{ minHeight: 140 }}
                    placeholder="Tell customers who you are, why you started, and what makes your groceries different…"
                    value={aboutForm.bio}
                    onChange={(e) => setAboutForm({ ...aboutForm, bio: e.target.value })}
                  />
                </div>
                <div className="error-text">{aboutError}</div>
                <button className="btn btn-primary btn-inline" disabled={savingAbout} onClick={saveAbout}>
                  {savingAbout ? <span className="spinner" /> : null}
                  {savingAbout ? "Saving…" : "Save About Me page"}
                </button>
              </>
            )}
          </main>
        </div>
      </div>

      <div className={`sheet-scrim${sheetOpen ? " show" : ""}`} onClick={() => setSheetOpen(false)} />
      <div className={`sheet${sheetOpen ? " show" : ""}`}>
        <div className="sheet-handle" />
        <div className="sheet-head"><h3>{editingId ? "Edit product" : "Add product"}</h3><button className="sheet-close" onClick={() => setSheetOpen(false)}>✕</button></div>
        <div className="sheet-body">
          <div className="field">
            <label>Cover photo</label>
            <div className="imgpick">
              <div className="prev">{imagePreview ? <img src={imagePreview} alt="" /> : "🖼️"}</div>
              <label htmlFor="imgInput">Choose photo from phone</label>
              <input id="imgInput" type="file" accept="image/*" onChange={onImageChange} />
            </div>
            <div className="hint">This is the main photo shown on the shop and in the cart.</div>
          </div>
          <div className="field"><label>Product name</label>
            <input placeholder="Garri (Yellow, 2kg)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field-row">
            <div className="field"><label>Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="field"><label>Price</label>
              <input placeholder="4500" inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
          </div>
          <div className="hint" style={{ marginTop: -6 }}>
            Don't see the right category? <a href="#" onClick={(e) => { e.preventDefault(); setSheetOpen(false); setView("categories"); }}>Add one</a> first, then come back.
          </div>
          <div className="field"><label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="field">
            <label>More photos</label>
            {editingId ? (
              <>
                {galleryImages.length > 0 && (
                  <div className="gallery-grid">
                    {galleryImages.map((img) => (
                      <div className="gallery-thumb" key={img.id}>
                        <img src={img.image} alt="" />
                        <button type="button" title="Remove photo" onClick={() => deleteGalleryImage(img.id)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="imgpick">
                  <div className="prev">{uploadingPhoto ? <span className="spinner" style={{ borderTopColor: "var(--accent)", borderColor: "var(--line)" }} /> : "🖼️"}</div>
                  <label htmlFor="galleryInput">{uploadingPhoto ? "Uploading…" : "Add more photos"}</label>
                  <input id="galleryInput" type="file" accept="image/*" multiple disabled={uploadingPhoto} onChange={onGalleryFilesChosen} />
                </div>
                <div className="hint">Shown as a photo gallery on this product's own page — angles, packaging, size comparisons.</div>
              </>
            ) : (
              <>
                {pendingGalleryFiles.length > 0 && (
                  <div className="gallery-grid">
                    {pendingGalleryFiles.map((f, i) => (
                      <div className="gallery-thumb" key={f.previewUrl}>
                        <img src={f.previewUrl} alt="" />
                        <button type="button" title="Remove photo" onClick={() => removePendingGalleryFile(i)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="imgpick">
                  <div className="prev">🖼️</div>
                  <label htmlFor="galleryInput">Add more photos</label>
                  <input id="galleryInput" type="file" accept="image/*" multiple onChange={onGalleryFilesChosen} />
                </div>
                <div className="hint">Shown as a photo gallery on this product's own page. Pick as many as you like — they'll upload automatically when you save below.</div>
              </>
            )}
          </div>

          <div className="error-text">{formError}</div>
        </div>
        <div className="sheet-foot">
          <button className="btn btn-primary" disabled={saving} onClick={saveProduct}>
            {saving ? <span className="spinner" /> : null}
            {saving ? "Saving…" : "Save product"}
          </button>
        </div>
      </div>
    </div>
  );
}
