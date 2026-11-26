<?php

namespace App\Policies;

use App\Enums\ReservationStatus;
use App\Exceptions\ReservationTransitionException;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Auth\Access\Response;

/**
 * What a customer and the agency may do with reservations (discovered automatically
 * for Reservation).
 *
 * A customer only ever sees their own reservations: someone else's answers 404,
 * so its existence is not revealed.
 *
 * Agency actions (admins only) follow ReservationStatus::allowedTransitions(): a
 * forbidden move answers 403 with the French reason ("Impossible de confirmer une
 * réservation « terminée »."). ReservationWorkflow checks again under a row lock.
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
     * The booking voucher of my own reservation, once confirmed (404 before, so the
     * SPA only offers it when the reservation says it exists).
     */
    public function downloadVoucher(User $user, Reservation $reservation): Response
    {
        return $this->owns($user, $reservation) && $reservation->hasVoucher()
            ? Response::allow()
            : Response::denyAsNotFound();
    }

    /**
     * The invoice of my own reservation, once issued at pick-up (404 otherwise).
     */
    public function downloadInvoice(User $user, Reservation $reservation): Response
    {
        return $this->owns($user, $reservation) && $reservation->invoice !== null
            ? Response::allow()
            : Response::denyAsNotFound();
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

    /**
     * Back office: list, read, export and annotate every reservation.
     */
    public function manage(User $user): bool
    {
        return $user->isAdmin();
    }

    public function confirm(User $user, Reservation $reservation): Response
    {
        return $this->adminTransition($user, $reservation, ReservationStatus::Confirmed);
    }

    public function reject(User $user, Reservation $reservation): Response
    {
        return $this->adminTransition($user, $reservation, ReservationStatus::Rejected);
    }

    public function markPickedUp(User $user, Reservation $reservation): Response
    {
        return $this->adminTransition($user, $reservation, ReservationStatus::Active);
    }

    public function markReturned(User $user, Reservation $reservation): Response
    {
        return $this->adminTransition($user, $reservation, ReservationStatus::Completed);
    }

    /**
     * The agency may cancel any pending or confirmed reservation, at any time (the
     * 24-hour rule only limits the customer), with a reason.
     */
    public function cancelAsAdmin(User $user, Reservation $reservation): Response
    {
        return $this->adminTransition($user, $reservation, ReservationStatus::Cancelled);
    }

    private function adminTransition(User $user, Reservation $reservation, ReservationStatus $to): Response
    {
        if (! $user->isAdmin()) {
            return Response::deny();
        }

        return $reservation->status->canTransitionTo($to)
            ? Response::allow()
            : Response::deny(ReservationTransitionException::notAllowedMessage($reservation->status, $to));
    }

    private function owns(User $user, Reservation $reservation): bool
    {
        return $reservation->user_id === $user->id;
    }
}
