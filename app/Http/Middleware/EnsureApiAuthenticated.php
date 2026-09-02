<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Equivalent of DRF's IsAuthenticated permission class. Always answers with
 * JSON (never a redirect-to-login) — this is an API-only backend, so a
 * missing/invalid token is just a 401 the frontend already knows how to
 * read via data.error.
 */
class EnsureApiAuthenticated
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::guard('api')->check()) {
            return response()->json(['error' => 'Authentication credentials were not provided.'], 401);
        }

        return $next($request);
    }
}
