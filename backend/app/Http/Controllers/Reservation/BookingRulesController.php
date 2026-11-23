<?php

namespace App\Http\Controllers\Reservation;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class BookingRulesController extends Controller
{
    /**
     * GET /api/booking-rules (public): the booking rules of config/tomobilti.php, so the
     * SPA offers the same time slots and limits as the server checks.
     */
    public function __invoke(): JsonResponse
    {
        $rules = config('tomobilti.booking');

        return response()->json(['data' => [
            'opening_time' => $rules['opening_time'],
            'closing_time' => $rules['closing_time'],
            'slot_minutes' => (int) $rules['slot_minutes'],
            'min_lead_hours' => (int) $rules['min_lead_hours'],
            'max_advance_months' => (int) $rules['max_advance_months'],
            'min_days' => (int) $rules['min_days'],
            'max_days' => (int) $rules['max_days'],
            'min_age' => (int) $rules['min_age'],
            'min_license_years' => (int) $rules['min_license_years'],
            'free_cancellation_hours' => (int) $rules['free_cancellation_hours'],
            'one_way_fee' => bcadd((string) $rules['one_way_fee'], '0', 2),
        ]]);
    }
}
