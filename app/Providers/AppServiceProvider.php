<?php

namespace App\Providers;

use App\Models\ApiToken;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Laravel's JsonResource wraps single resources AND collections in
        // {"data": ...} by default. DRF's serializers never did that — the
        // frontend expects a bare array from e.g. GET /api/products/, not
        // {"data": [...]}. Disabling this globally keeps every Resource's
        // JSON shape byte-for-byte what the old Django API returned, so
        // the frontend needed no changes.
        JsonResource::withoutWrapping();

        // A DRF-authtoken-style guard: the frontend sends
        // `Authorization: Token <token>` (never changed when the backend
        // moved from Django to Laravel), so we resolve the user the same
        // way DRF's TokenAuthentication did — one plain token per user,
        // looked up in api_tokens. Accessed via auth('api')->user()/check().
        Auth::viaRequest('api-token', function ($request) {
            $header = (string) $request->header('Authorization', '');

            if (! str_starts_with($header, 'Token ')) {
                return null;
            }

            $token = trim(substr($header, 6));

            if ($token === '') {
                return null;
            }

            return ApiToken::with('user')->where('token', $token)->first()?->user;
        });

        $this->configureRateLimiting();
    }

    protected function configureRateLimiting(): void
    {
        // Mirrors shop/throttles.py + REST_FRAMEWORK DEFAULT_THROTTLE_RATES —
        // keyed by IP so a script hammering one endpoint from one address is
        // slowed down, without needing a logged-in account to identify it.
        RateLimiter::for('login', fn ($request) => \Illuminate\Cache\RateLimiting\Limit::perMinute(8)->by($request->ip()));
        RateLimiter::for('checkout', fn ($request) => \Illuminate\Cache\RateLimiting\Limit::perMinute(20)->by($request->ip()));
        RateLimiter::for('review', fn ($request) => \Illuminate\Cache\RateLimiting\Limit::perMinute(10)->by($request->ip()));
        RateLimiter::for('api', fn ($request) => \Illuminate\Cache\RateLimiting\Limit::perMinute(60)->by($request->ip()));
    }
}
