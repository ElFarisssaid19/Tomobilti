<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthenticatedSessionController extends Controller
{
    /**
     * POST /api/auth/login: check the credentials (see LoginRequest::authenticate)
     * and start a new session.
     */
    public function store(LoginRequest $request): UserResource
    {
        $request->authenticate();

        // New session id after login: protects against session fixation.
        $request->session()->regenerate();

        return (new UserResource($request->user()))
            ->additional(['message' => __('api.auth.logged_in')]);
    }

    /**
     * POST /api/auth/logout: end the session and issue a fresh CSRF token.
     */
    public function destroy(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => __('api.auth.logged_out')]);
    }
}
