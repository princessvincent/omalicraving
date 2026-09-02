# Deploying to WhoGoHost (or any cPanel shared host)

You don't know yet whether your plan has SSH/Terminal access, so this
covers both. Skim to whichever section matches once you check (cPanel →
look for a "Terminal" icon, or ask WhoGoHost support).

Either way, first:

1. **Create the MySQL database.** In cPanel → *MySQL Databases*: create a
   database, a user, a password, and attach the user to the database with
   *All Privileges*. Note the three values cPanel shows you — the database
   name and username are usually prefixed with your cPanel account name
   (e.g. `username_cravings`, not just `cravings`).
2. **Build the frontend once, before uploading anything**, from your own
   computer (this needs `npm`, which cPanel shared hosting won't have):
   ```bash
   cd frontend && npm install && npm run build && cd ..
   ```
   This writes `public/build-frontend/` — make sure it exists before you
   upload.

## If you have SSH/Terminal access (recommended)

This gives you the clean, standard Laravel layout: the project sits
**outside** `public_html`, and only its `public/` folder is reachable from
the web — matching how Laravel expects to run, and how the framework's own
security assumptions work (it can never accidentally serve `.env`, your
`.env` database password, `app/`, etc.).

1. Upload the whole project (this folder) to your home directory, e.g.
   `~/cravings` — **not** inside `public_html`. (cPanel File Manager can
   upload a zip and extract it; or `scp`/`git` over SSH if you're
   comfortable with that.)
2. In cPanel, open **Domains** (or *Addon Domains* / *Subdomains*) and set
   your domain's **Document Root** to `~/cravings/public`. If cPanel won't
   let you point an existing domain's document root somewhere outside
   `public_html`, use an addon domain or subdomain instead, or fall back to
   the No-SSH method below.
3. SSH in, `cd ~/cravings`, then:
   ```bash
   composer install --no-dev --optimize-autoloader
   cp .env.example .env
   php artisan key:generate
   ```
4. Edit `.env`:
   - `APP_URL=https://yourdomain.com`
   - `APP_ENV=production`, `APP_DEBUG=false`
   - `DB_CONNECTION=mysql`, plus the `DB_HOST` (usually `127.0.0.1` or
     `localhost` on cPanel), `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
     from the database you created above
   - `SITE_URL=${APP_URL}` (already the default)
   - Paystack/Stripe keys, mail settings, `NOTIFY_EMAIL` — see
     `.env.example` for what each does
5. ```bash
   php artisan migrate --seed
   php artisan storage:link
   php artisan app:make-admin owner@example.com "a-strong-password" "Shop Owner"
   php artisan config:cache
   php artisan route:cache
   ```
6. Visit your domain. Sign in at `/account`, then `/admin`.

If `php artisan storage:link` fails (some hosts disable symlinks), open
`config/filesystems.php` and change the `public` disk's `'root'` to
`public_path('storage')` directly (i.e. store uploaded photos straight
inside `public/storage/`, no symlink needed) — then re-upload/re-run.

## If you only have File Manager (no SSH)

Laravel's `public/` folder has to be what the domain actually serves, but
plain shared hosting usually always points your domain at `public_html`
with no way to change that. The standard workaround: move `public/`'s
*contents* into `public_html`, keep the rest of the app one level up
(outside `public_html`, so it's never web-reachable), and tell the moved
`index.php` where to find it.

1. In cPanel File Manager, go to your home directory (one level above
   `public_html`).
2. Upload this whole project there as `cravings-app` (so you end up with
   `~/cravings-app/` next to `~/public_html/`), then extract it.
3. Composer: you still need `vendor/` built here — either run it if cPanel
   offers a **Composer** tool (Software section) pointed at
   `~/cravings-app/composer.json`, or build `vendor/` on your own Mac and
   upload the whole `vendor/` folder (drag the folder into File Manager,
   or zip it locally and upload+extract the zip — much faster than
   uploading thousands of small files one by one).
4. Move the **contents** of `~/cravings-app/public/` into `~/public_html/`
   (not the `public` folder itself — its *files*: `index.php`,
   `.htaccess`, `build-frontend/`, `favicon.ico`, etc.). Delete the now-empty
   `~/cravings-app/public/` folder afterward.
5. Edit `~/public_html/index.php` — it has two lines like:
   ```php
   require __DIR__.'/../vendor/autoload.php';
   $app = require_once __DIR__.'/../bootstrap/app.php';
   ```
   Change both `../` to point at wherever you put the app, e.g. if it's
   `~/cravings-app`:
   ```php
   require __DIR__.'/../cravings-app/vendor/autoload.php';
   $app = require_once __DIR__.'/../cravings-app/bootstrap/app.php';
   ```
6. Copy `.env.example` to `.env` **inside `~/cravings-app/`** (not
   `public_html`) and fill it in as described in step 4 of the SSH
   section above.
7. Generate an app key without artisan (no SSH means no `php artisan`):
   add a temporary line to the top of `~/public_html/index.php` — actually,
   simplest is to ask your host to run one command for you via a support
   ticket, since almost every cPanel host can do this in seconds; or check
   whether cPanel's PHP "Setup PHP App" screen includes a way to run a
   single artisan command. If truly nothing lets you run a command, you can
   generate a key yourself with any PHP available to you (your Mac counts):
   ```bash
   php -r "echo 'base64:'.base64_encode(random_bytes(32));"
   ```
   and paste the result as `APP_KEY=` in `.env`.
8. For migrations (`php artisan migrate`) without SSH: same as step 7 —
   either a support ticket, a cPanel-provided "run artisan" button if your
   plan has one, or ask WhoGoHost support to run
   `php artisan migrate --seed && php artisan storage:link && php artisan app:make-admin ...`
   for you once. This is the one genuinely awkward part of no-SSH Laravel
   hosting — if this turns out to be a real blocker, it's worth asking
   WhoGoHost support directly whether your plan can get SSH enabled, since
   every step above becomes trivial with it.

### Storage symlink on no-SSH hosting

`php artisan storage:link` needs artisan (see above). If you can't run it,
skip the symlink entirely: edit `config/filesystems.php`'s `public` disk
and change `'root'` to `public_path('storage')` — uploaded product photos
then save directly under `public_html/storage/` with no symlink required.

## Webhooks

Once live, set these in the Paystack and Stripe dashboards so an order
still gets marked paid even if a customer closes their browser right after
paying:

- Paystack → Settings → API Keys & Webhooks → `https://yourdomain.com/api/payments/webhook/`
- Stripe → Developers → Webhooks → `https://yourdomain.com/api/payments/webhook-stripe/`
  (then copy the signing secret it gives you into `STRIPE_WEBHOOK_SECRET`)

## Updating the site later

- **Frontend-only change**: `cd frontend && npm run build`, then re-upload
  the new `public/build-frontend/` (or `public_html/build-frontend/` on the
  no-SSH layout) over the old one.
- **Backend change**: re-upload the changed `app/`/`routes/`/`database/`
  files, then (with SSH) `php artisan migrate` if you added a migration,
  and `php artisan config:cache route:cache` to refresh the caches from
  step 5 above.
