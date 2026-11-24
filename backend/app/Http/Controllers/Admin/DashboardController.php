<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Services\DashboardStats;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class DashboardController extends Controller
{
    /**
     * GET /api/admin/dashboard?period=30d|90d|12m: KPIs, today's pick-ups and returns,
     * chart data, alerts and the latest reservations (definitions in DashboardStats).
     */
    public function __invoke(Request $request, DashboardStats $stats): JsonResponse
    {
        Gate::authorize('manage', Reservation::class);

        $validated = $request->validate([
            'period' => ['nullable', Rule::in(array_keys(DashboardStats::PERIODS))],
        ], attributes: ['period' => 'période']);

        return response()->json(['data' => $stats->forPeriod($validated['period'] ?? DashboardStats::DEFAULT_PERIOD)]);
    }
}
