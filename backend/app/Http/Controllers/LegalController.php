<?php

namespace App\Http\Controllers;

use App\Models\Car;
use App\Services\CatalogCache;
use Illuminate\Http\JsonResponse;

class LegalController extends Controller
{
    /**
     * GET /api/legal (public): every value printed on /conditions-generales and
     * /confidentialite, read from config/tomobilti.php (booking, rental, privacy,
     * company) and from the fleet (deposit range), so the pages state the rules the
     * server actually applies.
     */
    public function __invoke(): JsonResponse
    {
        return response()->json(['data' => CatalogCache::remember('legal', fn (): array => $this->values())]);
    }

    /**
     * @return array<string, mixed>
     */
    private function values(): array
    {
        $booking = config('tomobilti.booking');
        $rental = config('tomobilti.rental');
        $deposits = Car::query()->available()
            ->selectRaw('MIN(deposit_amount) as min_deposit, MAX(deposit_amount) as max_deposit')
            ->first();

        return [
            'company' => config('tomobilti.company'),
            'booking' => [
                'opening_time' => $booking['opening_time'],
                'closing_time' => $booking['closing_time'],
                'min_lead_hours' => (int) $booking['min_lead_hours'],
                'max_advance_months' => (int) $booking['max_advance_months'],
                'min_days' => (int) $booking['min_days'],
                'max_days' => (int) $booking['max_days'],
                'min_age' => (int) $booking['min_age'],
                'min_license_years' => (int) $booking['min_license_years'],
                'free_cancellation_hours' => (int) $booking['free_cancellation_hours'],
                'one_way_fee' => bcadd((string) $booking['one_way_fee'], '0', 2),
            ],
            'rental' => [
                'refuel_fee' => bcadd((string) $rental['refuel_fee'], '0', 2),
                'km_per_day' => $rental['km_per_day'] === null ? null : (int) $rental['km_per_day'],
                'late_return_grace_minutes' => (int) $rental['late_return_grace_minutes'],
                'excess_equals_deposit' => (bool) $rental['excess_equals_deposit'],
                'deposit_min' => $deposits?->min_deposit === null ? null : bcadd((string) $deposits->min_deposit, '0', 2),
                'deposit_max' => $deposits?->max_deposit === null ? null : bcadd((string) $deposits->max_deposit, '0', 2),
                'documents' => __('api.documents.to_bring'),
            ],
            'privacy' => [
                'retention_years' => array_map('intval', config('tomobilti.privacy.retention_years')),
            ],
        ];
    }
}
