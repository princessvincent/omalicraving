<?php

namespace App\Support;

use Illuminate\Support\Facades\Storage;

/**
 * Turns a stored path (e.g. "products/abc.jpg") into the same kind of
 * absolute URL Django's ImageField used to hand back — the frontend just
 * renders whatever URL string the API gives it, so the actual path scheme
 * doesn't need to match Django's (/media/...) at all.
 */
class Media
{
    public static function url(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        return Storage::disk('public')->url($path);
    }
}
