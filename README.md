# Omali Cravings — Laravel + React, one app

This is the Laravel rewrite of the old Django/DRF backend, with the same
React storefront merged in as part of the same project — one folder, one
thing to deploy, built specifically so it's easy to host on a shared cPanel
plan (like WhoGoHost) that runs PHP but not Python.

- **Backend**: `app/`, `routes/api.php`, `database/migrations/` — a
  Laravel rewrite of the old `shop/` Django app. Same URLs, same JSON
  shapes, same business rules (server-side pricing at checkout, Paystack/
  Stripe payments verified server-to-server, one login for customers and
  the seller, etc.) — see `CONVERSION_NOTES.md` for the point-by-point map.
- **Frontend**: `frontend/` — the exact same React (Vite) app you already
  had, untouched apart from two doc comments. It's built once
  (`npm run build`) straight into `public/build-frontend/`, and Laravel
  serves that build for every page alongside its own `/api/*` routes (see
  `routes/web.php`). There's no separate frontend server in production.

## ⚠️ One thing you have to do before anything else works

This project's PHP dependencies (`vendor/`) are **not included** — they
were built in a sandboxed environment that couldn't reach Packagist (the
PHP package registry), so there was no reliable way to fetch them here.
This is a one-time, completely standard step; it just has to happen
somewhere with normal internet access — your own Mac, or the server.

You need [Composer](https://getcomposer.org) (a package manager for PHP,
like `npm` for PHP) and PHP 8.2+ available wherever you run this command:

```bash
composer install --no-dev --optimize-autoloader
```

That's it — this downloads Laravel and its dependencies into `vendor/`
(a few seconds to a couple of minutes). Pick whichever is easiest for you:

1. **On your Mac** (if you don't have PHP/Composer): `brew install php composer`,
   then run the command above inside this folder. You can then also run
   `php artisan serve` here to try it locally before uploading anything.
2. **On the WhoGoHost server itself**, if your plan includes SSH/Terminal
   access (cPanel's "Terminal" icon) — upload the project first (see
   `DEPLOY.md`), then run the command there.
3. **cPanel's own Composer tool**, if your plan offers one (Softaculous or
   a "Setup PHP App" screen with a Composer/Run button) — point it at this
   folder's `composer.json`.

`DEPLOY.md` covers all three in more detail, including what to do if none
of them are available to you.

## Local development

```bash
# 1. Backend
composer install --no-dev --optimize-autoloader   # see above
cp .env.example .env
php artisan key:generate
php artisan migrate --seed        # creates the schema + a starter product catalogue
php artisan storage:link          # so uploaded product photos are reachable at /storage/...
php artisan app:make-admin owner@example.com "a-strong-password" "Shop Owner"

# 2. Frontend — build once into public/build-frontend
cd frontend
npm install
npm run build
cd ..

# 3. Run it
php artisan serve
# → http://127.0.0.1:8000  (storefront, /account, /admin — all served by Laravel)
```

Sign in at `/account` with the email/password you gave `app:make-admin`,
then open `/admin` — same dashboard as before, nothing changed there.

### Editing the frontend

For day-to-day frontend work with hot reload, run the two dev servers side
by side (same as the old Django setup):

```bash
php artisan serve            # terminal 1 — API on :8000
cd frontend && npm run dev   # terminal 2 — Vite on :5173, proxies /api and /storage to :8000
```

When you're done, `npm run build` (from inside `frontend/`) refreshes
`public/build-frontend/` with your changes — that's the only step needed
to make edits show up when Laravel itself is serving the site.

## Payments, email, currency

All configured the same way as before, just in `.env` instead of Django's
`.env` — see `.env.example` for every setting (Paystack keys, Stripe keys +
webhook secret, `NOTIFY_EMAIL`, `CURRENCY`, `DELIVERY_FEE`, mail server).
Point the Paystack/Stripe dashboard webhooks at:

- `https://yourdomain.com/api/payments/webhook/` (Paystack)
- `https://yourdomain.com/api/payments/webhook-stripe/` (Stripe)

## Database

Defaults to SQLite (zero setup) for local development. For WhoGoHost/
cPanel, switch `.env` to MySQL — see `DEPLOY.md`.

## Admin accounts

There's no sign-up form for the seller account — same as before, it's a
deliberate one-time step:

```bash
php artisan app:make-admin owner@example.com "a-strong-password" "Shop Owner"
```

Run it again with the same email any time to reset that account's password
or re-grant admin access.
