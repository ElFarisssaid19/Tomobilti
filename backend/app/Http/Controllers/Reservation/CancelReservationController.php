<?php

namespace App\Http\Controllers\Reservation;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReservationDetailResource;
use App\Models\Reservation;
use App\Services\ReservationWorkflow;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CancelReservationController extends Controller
{
    /**
     * POST /api/reservations/{reference}/cancel { reason? }: free cancellation of my own
     * pending or confirmed reservation, until 24 hours before pick-up. Otherwise the
     * policy answers 403 with the French reason (404 for someone else's reservation).
     * The status history records the customer as the author.
     */
    public function __invoke(Request $request, Reservation $reservation, ReservationWorkflow $workflow): ReservationDetailResource
    {
        Gate::authorize('cancel', $reservation);

        $validated = $request->validate(
            ['reason' => ['nullable', 'string', 'max:500']],
            attributes: ['reason' => 'motif'],
        );

        $workflow->cancel($reservation, $request->user(), $validated['reason'] ?? null);

        return (new ReservationDetailResource($reservation->load(ReservationDetailResource::RELATIONS)))
            ->additional(['message' => __('api.booking.cancelled')]);
    }
}
