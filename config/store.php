<?php

return [

    // Shown in receipts/emails and used for currency formatting.
    'currency' => env('CURRENCY', 'NGN'),
    'currency_symbol' => env('CURRENCY_SYMBOL', '₦'),

    // Flat delivery fee added at checkout, in the currency above (whole units).
    'delivery_fee' => (int) env('DELIVERY_FEE', 1500),

    // Where the "new order" notification email goes. Falls back to the
    // outgoing mail account itself when unset.
    'notify_email' => env('NOTIFY_EMAIL', ''),

    // Used to build Stripe's redirect-back URLs (success/cancel) — must
    // match wherever the site is actually reachable. Once the frontend is
    // merged into this Laravel app, that's simply APP_URL.
    'site_url' => env('SITE_URL', env('APP_URL', 'http://localhost')),

];
