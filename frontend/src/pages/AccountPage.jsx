import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useToast } from "../useToast.js";
import NavBar from "../components/NavBar.jsx";
import Footer from "../components/Footer.jsx";
import AuthArt from "../components/AuthArt.jsx";

const emptyLogin = { email: "", password: "" };
const emptyRegister = { name: "", email: "", password: "", phone: "" };

// Want a real photograph in the picture panel instead of the illustration?
// Drop the image into src/assets/ and set this to:
//   new URL("../assets/your-photo.jpg", import.meta.url).href
// ...or paste any hosted image URL. Leave it null to keep the illustration.
const AUTH_PHOTO_URL = null;

/**
 * The site's one and only sign-in page — a customer and the seller both use
 * it, with the same form hitting the same endpoint. What each of them can
 * then do differs only by is_staff on the account: a customer sees her own
 * saved details here; the seller is sent straight into /admin the moment
 * she's identified as staff — whether that's right after logging in here,
 * or from having already been signed in when she lands on this page — so
 * she never has to click through a middle screen to reach her dashboard.
 * The admin page itself still checks is_staff again before showing
 * anything — this page identifying someone as staff is not, by itself, a
 * way into the dashboard.
 */
export default function AccountPage() {
  const { message, show, toast } = useToast();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(emptyLogin);
  const [registerForm, setRegisterForm] = useState(emptyRegister);
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const [profileForm, setProfileForm] = useState({ name: "", phone: "", address: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    if (!api.hasToken()) {
      setChecking(false);
      return;
    }
    api
      .session()
      .then((data) => {
        if (data.is_staff) {
          navigate("/admin", { replace: true });
          return;
        }
        setUser(data);
        setProfileForm({ name: data.name || "", phone: data.phone || "", address: data.address || "" });
      })
      .catch(() => api.clearToken())
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function afterAuth(data) {
    api.saveToken(data.token);
    if (data.is_staff) {
      navigate("/admin", { replace: true });
      return;
    }
    setUser(data);
    setProfileForm({ name: data.name || "", phone: data.phone || "", address: data.address || "" });
  }

  async function submitLogin(e) {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    try {
      const data = await api.login(loginForm);
      afterAuth(data);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function submitRegister(e) {
    e.preventDefault();
    if (!registerForm.name.trim() || !registerForm.email.trim() || registerForm.password.length < 8) {
      setAuthError("Fill in your name and email, and use a password of at least 8 characters.");
      return;
    }
    setAuthBusy(true);
    setAuthError("");
    try {
      const data = await api.register(registerForm);
      afterAuth(data);
      toast("Account created");
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileError("");
    try {
      const data = await api.updateProfile(profileForm);
      setUser((prev) => ({ ...prev, ...data }));
      toast("Saved");
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleLogout() {
    try {
      await api.logout();
    } catch {
      /* ignore — clearing the local token still signs this browser out */
    }
    api.clearToken();
    setUser(null);
    setLoginForm(emptyLogin);
    setRegisterForm(emptyRegister);
    setMode("login");
    toast("Signed out");
  }

  // ---- signed in: her own account details, unchanged ----
  if (user) {
    return (
      <div className="app">
        <div className={`toast${show ? " show" : ""}`}>{message}</div>
        <NavBar />

        <section className="page-hero">
          <div className="page-hero-inner">
            <div className="eyebrow-bar" />
            <h1>My Account</h1>
          </div>
          <div className="page-hero-diamond" />
        </section>

        <main>
          <div className="account-wrap">
            <form className="contact-form" style={{ maxWidth: 480, margin: "0 auto" }} onSubmit={saveProfile}>
              <div className="section-label">Signed in as</div>
              <h2>{user.email}</h2>
              <div className="field"><label>Name</label>
                <input value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
              </div>
              <div className="field"><label>Phone</label>
                <input value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
              </div>
              <div className="field"><label>Saved delivery address</label>
                <textarea
                  placeholder="Used to pre-fill checkout — you can still change it at checkout any time."
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </div>
              <div className="error-text">{profileError}</div>
              <button className="btn btn-primary btn-inline" disabled={savingProfile} type="submit">
                {savingProfile ? <span className="spinner" /> : null}
                {savingProfile ? "Saving…" : "Save changes"}
              </button>
            </form>
            <button className="account-logout" onClick={handleLogout}>Sign out</button>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // ---- signed out: the two-panel sign-in page ----
  return (
    <div className="app">
      <div className={`toast${show ? " show" : ""}`}>{message}</div>
      <NavBar />

      <main className="auth-main">
        <div className="auth-card">
          {/* Picture side. On a phone this becomes a short banner above the
              form rather than disappearing, so the page still feels designed. */}
          <div className="auth-visual">
            {AUTH_PHOTO_URL ? <img src={AUTH_PHOTO_URL} alt="" /> : <AuthArt />}
            <div className="auth-visual-copy">
              <div className="eyebrow-bar" />
              <h2>Your Naija food,<br />here in China</h2>
              <p>Garri, stockfish, egusi, palm oil — the real thing, packed fresh and delivered to your door.</p>
              <ul className="auth-points">
                <li>No account needed — guest checkout always works</li>
                <li>Sign in to save your delivery address</li>
                <li>Your cart follows you to any device</li>
              </ul>
            </div>
          </div>

          {/* Form side */}
          <div className="auth-form-side">
            <div className="auth-form-inner">
              <div className="section-label">Welcome back</div>
              <h1>{mode === "login" ? "Sign in" : "Create account"}</h1>
              <p className="auth-lede">
                {mode === "login"
                  ? "Sign in to pick up where you left off."
                  : "It takes a minute, and your address is saved for next time."}
              </p>

              <div className="tabs-link auth-tabs">
                <button
                  className={`tlink${mode === "login" ? " active" : ""}`}
                  onClick={() => { setMode("login"); setAuthError(""); }}
                >
                  Log in
                </button>
                <button
                  className={`tlink${mode === "register" ? " active" : ""}`}
                  onClick={() => { setMode("register"); setAuthError(""); }}
                >
                  Create account
                </button>
              </div>

              {mode === "login" ? (
                <form onSubmit={submitLogin}>
                  <div className="field"><label>Email</label>
                    {/* type="text", not "email" — the shop's own staff account
                        signs in here too with a plain username (no "@"), and
                        an HTML5 email input would silently block that
                        submission client-side before it ever reaches the
                        server. Validation of what's actually a valid login
                        happens server-side either way. */}
                    <input
                      type="text"
                      autoComplete="username"
                      placeholder="you@example.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    />
                  </div>
                  <div className="field"><label>Password</label>
                    <input
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                  </div>
                  <div className="error-text">{authError}</div>
                  <button className="btn btn-primary" disabled={authBusy} type="submit">
                    {authBusy ? <span className="spinner" /> : null}
                    {authBusy ? "Signing in…" : "Log in"}
                  </button>
                  <div className="auth-switch">
                    New here?{" "}
                    <button type="button" onClick={() => { setMode("register"); setAuthError(""); }}>
                      Create an account
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={submitRegister}>
                  <div className="field"><label>Name</label>
                    <input
                      placeholder="Your full name"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                    />
                  </div>
                  <div className="field"><label>Email</label>
                    <input
                      type="email"
                      autoComplete="username"
                      placeholder="you@example.com"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    />
                  </div>
                  <div className="field"><label>Phone (optional)</label>
                    <input
                      placeholder="So we can reach you about your order"
                      value={registerForm.phone}
                      onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="field"><label>Password</label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    />
                  </div>
                  <div className="error-text">{authError}</div>
                  <button className="btn btn-primary" disabled={authBusy} type="submit">
                    {authBusy ? <span className="spinner" /> : null}
                    {authBusy ? "Creating account…" : "Create account"}
                  </button>
                  <div className="auth-switch">
                    Already have an account?{" "}
                    <button type="button" onClick={() => { setMode("login"); setAuthError(""); }}>
                      Log in
                    </button>
                  </div>
                </form>
              )}

              {checking ? null : (
                <div className="auth-guest-note">
                  You never need an account to shop here — checkout works as a guest.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
