<?php

namespace App\Policies;

use App\Models\Reservation;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * What a customer may do with reservations (discovered automatically for Reservation).
 *
 * A customer only ever sees their own reservations: someone else's answers 404,
 * so its existence is not revealed. The agency's actions come in Phase 5.
 */
class ReservationPolicy
{
    /**
     * "Mes réservations": every signed-in user has a (possibly empty) list.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Reservation $reservation): Response
    {
        return $this->owns($user, $reservation) ? Response::allow() : Response::denyAsNotFound();
    }

    /**
     * Disabled accounts cannot book. The other conditions (verified email, complete
     * profile, age, licence) are checked by BookingEligibility for the pick-up date.
     */
    public function create(User $user): Response
    {
        return $user->is_active
            ? Response::allow()
            : Response::deny(__('api.booking.eligibility.account_inactive'));
    }

    /**
     * Free cancellation: own reservation, still pending or confirmed, and more than
     * 24 hours before pick-up.
     */
    public function cancel(User $user, Reservation $reservation): Response
    {
        if (! $this->owns($user, $reservation)) {
            return Response::denyAsNotFound();
        }

        if (! $reservation->status->canBeCancelled()) {
            return Response::deny(__('api.booking.cancel.not_cancellable', [
                'status' => mb_strtolower($reservation->status->label()),
            ]));
        }

        if (! now()->lessThan($reservation->freeCancellationDeadline())) {
            return Response::deny(__('api.booking.cancel.too_late', [
                'hours' => config('tomobilti.booking.free_cancellation_hours'),
                'agency' => $reservation->pickupLocation->phone
                    ? "{$reservation->pickupLocation->name} au {$reservation->pickupLocation->phone}"
                    : $reservation->pickupLocation->name,
            ]));
        }

        return Response::allow();
    }

    private function owns(User $user, Reservation $reservation): bool
    {
        return $reservation->user_id === $user->id;
    }
}
