<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CurrentSessionController extends Controller
{
    /**
     * GET /api/auth/session: the signed-in user, or `data: null` for a visitor. The SPA
     * calls it on start-up instead of GET /api/user, so a visitor's first page load does
     * not log a 401 error in the browser console (GET /api/user keeps its 401).
     */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user('sanctum');

        return response()->json(['data' => $user ? new UserResource($user) : null]);
    }
}
