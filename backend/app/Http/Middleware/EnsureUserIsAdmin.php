<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

/**
 * "admin" middleware: only administrators get through (Gate "access-admin").
 * Place it after auth:sanctum, so guests get 401 and clients get 403 (JSON, in French).
 */
class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        abort_unless(Gate::forUser($request->user())->allows('access-admin'), 403);

        return $next($request);
    }
}
