<?php

namespace App\Http\Controllers\Reservation;

use App\Enums\ReservationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationDetailResource;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CancelReservationController extends Controller
{
    /**
     * POST /api/reservations/{reference}/cancel { reason? }: free cancellation of my own
     * pending or confirmed reservation, until 24 hours before pick-up. Otherwise the
     * policy answers 403 with the French reason (404 for someone else's reservation).
     */
    public function __invoke(Request $request, Reservation $reservation): ReservationDetailResource
    {
        Gate::authorize('cancel', $reservation);

        $validated = $request->validate(
            ['reason' => ['nullable', 'string', 'max:500']],
            attributes: ['reason' => 'motif'],
        );

        $reservation->update([
            'status' => ReservationStatus::Cancelled,
            'cancelled_at' => now(),
            'cancellation_reason' => $validated['reason'] ?? null,
        ]);

        return (new ReservationDetailResource($reservation->load(ReservationDetailResource::RELATIONS)))
            ->additional(['message' => __('api.booking.cancelled')]);
    }
}
