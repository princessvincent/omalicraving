<?php

// Mirrors shop/config/settings.py's CORS_ALLOWED_ORIGINS: an explicit
// allow-list, never "allow everything". In production the frontend is
// served by this same Laravel app (see routes/web.php), so CORS mostly
// doesn't matter — this exists so `npm run dev` (Vite on its own port,
// during frontend-only development) can still talk to this API.
return [

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173'))
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];
