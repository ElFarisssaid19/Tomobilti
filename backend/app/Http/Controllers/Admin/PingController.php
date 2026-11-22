<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PingController extends Controller
{
    /**
     * GET /api/admin/ping: proves that the admin area is reachable (admins only).
     */
    public function __invoke(Request $request): JsonResponse
    {
        return response()->json([
            'message' => __('api.admin.pong', ['name' => $request->user()->name]),
            'time' => now()->toIso8601String(),
        ]);
    }
}
