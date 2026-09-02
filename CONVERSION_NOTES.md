# What changed, going from Django+DRF to Laravel

The goal throughout was: **same API contract, same frontend, same
behavior** — just a different backend language, and one project instead of
two. If you never read this file, the site should just work the same way
it did before.

## Direct equivalents

| Django/DRF | Laravel | Notes |
|---|---|---|
| `shop/models.py` | `app/Models/*.php` + `database/migrations/` | Same fields, same rules (unique slugs, singleton About row, etc.) |
| `shop/serializers.py` | `app/Http/Resources/*.php` | Same JSON field names/shapes |
| `shop/views.py` | `app/Http/Controllers/Api/**/*.php` | Same endpoints, same logic |
| `shop/urls.py` | `routes/api.php` | **Identical URLs**, trailing slashes and all |
| `shop/paystack.py` | `app/Services/PaystackService.php` | Same server-to-server verification |
| `shop/stripe_gateway.py` | `app/Services/StripeCheckoutService.php` | Same Stripe Checkout flow |
| `shop/emails.py` | `app/Mail/NewOrderNotification.php` + `app/Jobs/SendOrderNotificationJob.php` | Same email content; see below for the "async send" bit |
| `shop/exceptions.py` (`friendly_exception_handler`) | `bootstrap/app.php`'s `withExceptions()` | Every API error still comes back as `{"error": "..."}` |
| `shop/throttles.py` + `REST_FRAMEWORK` rates | `RateLimiter::for(...)` in `AppServiceProvider` | Same per-IP limits (login 8/min, checkout 20/min, review 10/min, general 60/min) |
| `rest_framework.authtoken` (`Token <key>`) | `App\Models\ApiToken` + `App\Http\Middleware\EnsureApiAuthenticated`/`EnsureStaff` | The frontend's `Authorization: Token <token>` header needed **no changes** — Laravel now issues/checks the same header shape via a small custom guard |
| `IsAdminStaff` permission | `admin.staff` middleware | Same 401-if-no-token / 403-if-not-staff split DRF used |
| Django admin (`/django-admin`) | *(not ported)* | This was Django's own built-in superuser panel, separate from the React `/admin` dashboard the seller actually uses — the real admin UI is the React page, which is untouched and still works |

## Things that had to change shape (same behavior, different mechanism)

- **Auth token header** (`Authorization: Token <token>`): DRF has this
  built in. Laravel's usual token auth (Sanctum) uses `Bearer`, so instead
  there's a small custom guard (`AppServiceProvider::boot()` →
  `Auth::viaRequest('api-token', ...)`) that reads the exact same header
  the frontend already sends. Nothing in `frontend/` changed for this.
- **"Send the order email without blocking the response"**: Django did
  this with a background `threading.Thread`. PHP-FPM/shared hosting has no
  equivalent, and there's no queue worker on shared hosting either — so
  instead `SendOrderNotificationJob` is dispatched with `->afterResponse()`,
  which runs it once the HTTP response has already been sent back to the
  browser. Same effect (checkout doesn't wait on the mail server), no extra
  moving parts to keep running.
- **PATCH + file upload** (the admin dashboard uploads a product/about photo
  via `fetch(..., { method: "PATCH", body: formData })`): PHP only parses
  multipart bodies for POST, never PUT/PATCH, so this needed a small
  middleware (`App\Http\Middleware\ParseMultipartFormRequest`) that parses
  those requests by hand. Transparent to the frontend and to the rest of
  the backend code — `$request->file(...)` just works.
- **Trailing slashes**: DRF's URLs all end in `/` (`/api/products/`), and
  the React frontend calls them that way. Laravel/Apache's default project
  setup actually strips trailing slashes with a 301 redirect — which would
  have silently turned every POST/PATCH/DELETE (login, checkout, saving a
  product, ...) into a broken GET. That rule was removed from
  `public/.htaccess`; see the comment there.
- **Image URLs**: Django's `ImageField` returned URLs under `/media/...`.
  Laravel's equivalent (the `public` disk + `storage:link`) serves them
  under `/storage/...` instead. The frontend never hardcodes this — it just
  displays whatever URL the API gives it — so this needed no frontend
  changes either.

## Deliberately not carried over

- **Django admin** (`/django-admin`) — a separate, secondary admin UI
  Django ships automatically. The seller-facing admin the site actually
  uses is the React `/admin` page, which talks to the same
  `/api/admin/*` endpoints either way.
- **`django-environ`, `whitenoise`, `psycopg2`, `gunicorn`** and the rest
  of `requirements.txt` — these were Python/Django-specific plumbing
  (env file parsing, serving static files, Postgres driver, WSGI server).
  Laravel/PHP has its own built-in equivalents for all of them, so there's
  nothing to port.
