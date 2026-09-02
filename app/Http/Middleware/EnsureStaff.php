<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Equivalent of shop/views.py::IsAdminStaff — beyond "is this token valid",
 * the underlying user must actually be staff. Stops a leaked/expired-but-
 * not-revoked token for a non-staff account from ever reaching admin
 * endpoints. One login serves both customers and the seller; this is the
 * only thing that gates the admin API.
 */
class EnsureStaff
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::guard('api')->user();

        if (! $user) {
            return response()->json(['error' => 'Authentication credentials were not provided.'], 401);
        }

        if (! $user->is_staff) {
            return response()->json(['error' => 'You do not have permission to perform this action.'], 403);
        }

        return $next($request);
    }
}
