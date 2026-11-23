<?php

namespace App\Http\Controllers\Reservation;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reservation\QuoteReservationRequest;
use App\Http\Resources\CarResource;
use App\Http\Resources\LocationResource;
use App\Services\BookingEligibility;
use App\Services\ReservationPricing;
use Illuminate\Http\JsonResponse;

class ReservationQuoteController extends Controller
{
    /**
     * POST /api/reservations/quote (public): the price breakdown of a booking, whether
     * the car is free for these times, and, for a signed-in customer, whether they can
     * book (eligibility). The SPA's booking summary shows exactly this.
     */
    public function __invoke(
        QuoteReservationRequest $request,
        ReservationPricing $pricing,
        BookingEligibility $eligibility,
    ): JsonResponse {
        $car = $request->car()->load(CarResource::RELATIONS);
        $start = $request->startAt();
        $end = $request->endAt();
        $pickupLocation = $request->pickupLocation();
        $returnLocation = $request->returnLocation();

        $price = $pricing->quote($car, $start, $end, $pickupLocation, $returnLocation, $request->extraSelections());
        $available = $car->isAvailableBetween($start, $end);
        $user = $request->user('sanctum');
        $eligibilityResult = $user ? $eligibility->check($user, $start) : null;

        return response()->json(['data' => [
            'car' => new CarResource($car),
            'start_at' => $start->toIso8601String(),
            'end_at' => $end->toIso8601String(),
            'pickup_location' => new LocationResource($pickupLocation),
            'return_location' => new LocationResource($returnLocation),
            'pricing' => $price->toArray(),
            'available' => $available,
            'unavailable_message' => $available ? null : __('api.booking.already_booked'),
            'eligibility' => $eligibilityResult?->toArray(),
            'can_book' => $available && $eligibilityResult?->isEligible() === true,
        ]]);
    }
}
