<?php

use App\Http\Middleware\EnsureApiAuthenticated;
use App\Http\Middleware\EnsureStaff;
use App\Http\Middleware\ParseMultipartFormRequest;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'auth.api' => EnsureApiAuthenticated::class,
            'admin.staff' => EnsureStaff::class,
        ]);

        // The admin dashboard sends real HTTP PATCH requests with a
        // multipart body (product/about photo uploads) — see the class
        // docblock for why this needs to run before routing.
        $middleware->prependToGroup('api', ParseMultipartFormRequest::class);

        // Baseline per-IP throttle across the whole API (mirrors DRF's
        // AnonRateThrottle/UserRateThrottle default of 60-120/min) — see
        // AppServiceProvider::configureRateLimiting() for the 'api' limiter
        // and the more specific login/checkout/review limiters used on
        // individual routes in routes/api.php.
        $middleware->throttleApi();

        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Normalizes every API error into {"error": "<message>"} so the
        // existing frontend (which reads response.data.error — see
        // src/api.js::handle()) needed no changes at all. Mirrors
        // shop/exceptions.py::friendly_exception_handler exactly. Only
        // touches /api/* — the SPA's own HTML/asset routes render normally.
        $exceptions->render(function (\Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null; // let Laravel's normal handling take over
            }

            if ($e instanceof ValidationException) {
                $errors = $e->errors();
                $firstField = array_key_first($errors);
                $firstMessage = $errors[$firstField][0] ?? 'Validation failed.';
                $message = in_array($firstField, ['error', 'non_field_errors'], true)
                    ? $firstMessage
                    : "{$firstField}: {$firstMessage}";

                return response()->json(['error' => $message], 422);
            }

            if ($e instanceof AuthenticationException) {
                return response()->json(['error' => 'Authentication credentials were not provided.'], 401);
            }

            if ($e instanceof HttpExceptionInterface) {
                $status = $e->getStatusCode();
                $message = $e->getMessage();

                if ($message === '') {
                    $message = match (true) {
                        $status === 404 => 'Not found.',
                        $status === 405 => 'Method not allowed.',
                        $status === 429 => 'Too many requests. Please slow down and try again shortly.',
                        default => 'Something went wrong. Please try again.',
                    };
                }

                return response()->json(['error' => $message], $status);
            }

            // A real crash, not a validation/auth/HTTP error. The client
            // still only gets a generic message; the full exception is
            // always logged server-side (Laravel's default logging already
            // ran before this render callback). In APP_DEBUG, surface the
            // actual cause too — same trade-off as Django's DEBUG-only
            // `debug` field.
            $payload = ['error' => 'Something went wrong. Please try again.'];

            if (config('app.debug')) {
                $payload['debug'] = get_class($e).': '.$e->getMessage();
            }

            return response()->json($payload, 500);
        });
    })->create();
