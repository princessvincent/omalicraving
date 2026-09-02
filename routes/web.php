<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web routes
|--------------------------------------------------------------------------
|
| The React storefront (frontend/) is built with `npm run build` straight
| into public/build-frontend/ — see frontend/vite.config.js. This single
| catch-all hands back that build's index.html for every page the SPA
| itself handles client-side (/, /product/:slug, /about, /account, ...),
| so a hard refresh or a shared link on any of those routes still works.
| Anything under /api, /storage or /build-frontend is excluded here and
| served by its own route/static file instead.
|
*/

Route::get('/{any?}', function () {
    $index = public_path('build-frontend/index.html');

    if (! file_exists($index)) {
        abort(404, 'Frontend build not found — run `npm install && npm run build` inside frontend/, or see DEPLOY.md.');
    }

    // The app shell itself should never be cached (so a redeploy is visible
    // immediately) — the hashed files it references under
    // /build-frontend/assets/... are safe to cache forever instead, since a
    // new build gives them new filenames.
    return response(file_get_contents($index), 200, [
        'Content-Type' => 'text/html; charset=UTF-8',
        'Cache-Control' => 'no-cache, must-revalidate',
    ]);
})->where('any', '^(?!api(?:/|$)|storage(?:/|$)|build-frontend(?:/|$)).*$');
