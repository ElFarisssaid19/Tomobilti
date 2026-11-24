<?php

namespace App\Services;

use App\Enums\CarStatus;
use App\Enums\ReservationStatus;
use App\Exceptions\ReservationTransitionException;
use App\Models\Car;
use App\Models\Reservation;
use App\Models\User;
use Closure;
use Illuminate\Support\Facades\DB;

/**
 * The only way a reservation changes status (customer cancellation, admin actions,
 * expiry of unanswered requests). Every change:
 *
 *   1. locks the reservation row and reads its current status again, so two admins
 *      clicking at the same time cannot both move it;
 *   2. checks ReservationStatus::canTransitionTo() (pending → confirmed, …);
 *   3. saves the new status with its timestamp and reason;
 *   4. writes a reservation_status_histories row (who, from, to, note).
 *
 * Confirming also locks the car row first (like ReservationBooker) and checks again
 * that the car can be rented and that no other blocking reservation overlaps.
 */
class ReservationWorkflow
{
    /**
     * pending → confirmed, if the car is still free for these times.
     *
     * @throws ReservationTransitionException
     */
    public function confirm(Reservation $reservation, User $admin): Reservation
    {
        return DB::transaction(function () use ($reservation, $admin): Reservation {
            $car = Car::withTrashed()->whereKey($reservation->car_id)->lockForUpdate()->firstOrFail();

            return $this->transition(
                $reservation,
                ReservationStatus::Confirmed,
                $admin,
                changes: ['confirmed_at' => now()],
                guard: fn (Reservation $locked) => $this->ensureCarIsFree($car, $locked),
            );
        });
    }

    /**
     * pending → rejected, with the reason shown to the customer.
     *
     * @throws ReservationTransitionException
     */
    public function reject(Reservation $reservation, User $admin, string $reason): Reservation
    {
        return $this->transition($reservation, ReservationStatus::Rejected, $admin, $reason, [
            'rejected_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }

    /**
     * confirmed → active: the customer took the keys.
     *
     * @throws ReservationTransitionException
     */
    public function markPickedUp(Reservation $reservation, User $admin): Reservation
    {
        return $this->transition($reservation, ReservationStatus::Active, $admin, changes: ['picked_up_at' => now()]);
    }

    /**
     * active → completed: the car is back.
     *
     * @throws ReservationTransitionException
     */
    public function markReturned(Reservation $reservation, User $admin): Reservation
    {
        return $this->transition($reservation, ReservationStatus::Completed, $admin, changes: ['returned_at' => now()]);
    }

    /**
     * pending / confirmed → cancelled, by the customer (free cancellation, checked by
     * the ReservationPolicy) or by an admin (reason required by the request).
     *
     * @throws ReservationTransitionException
     */
    public function cancel(Reservation $reservation, User $by, ?string $reason = null): Reservation
    {
        return $this->transition($reservation, ReservationStatus::Cancelled, $by, $reason, [
            'cancelled_at' => now(),
            'cancellation_reason' => $reason,
        ]);
    }

    /**
     * pending → rejected by the scheduler ("Demande expirée"), once the pick-up time has
     * passed. Returns false when the request was answered meanwhile.
     */
    public function expire(Reservation $reservation): bool
    {
        $reason = __('api.booking.expired_reason');

        try {
            $this->transition($reservation, ReservationStatus::Rejected, null, $reason, [
                'rejected_at' => now(),
                'rejection_reason' => $reason,
            ], guard: function (Reservation $locked): void {
                if ($locked->start_at->isFuture()) {
                    throw ReservationTransitionException::notAllowed($locked->status, ReservationStatus::Rejected);
                }
            });
        } catch (ReservationTransitionException) {
            return false;
        }

        return true;
    }

    /**
     * Lock, check, save, record. $reservation is refreshed with the saved values.
     *
     * @param  array<string, mixed>  $changes  columns saved with the new status
     * @param  (Closure(Reservation): void)|null  $guard  extra check on the locked row, throws to refuse
     *
     * @throws ReservationTransitionException
     */
    private function transition(
        Reservation $reservation,
        ReservationStatus $to,
        ?User $by,
        ?string $note = null,
        array $changes = [],
        ?Closure $guard = null,
    ): Reservation {
        return DB::transaction(function () use ($reservation, $to, $by, $note, $changes, $guard): Reservation {
            $locked = Reservation::query()->whereKey($reservation->getKey())->lockForUpdate()->firstOrFail();
            $from = $locked->status;

            if (! $from->canTransitionTo($to)) {
                throw ReservationTransitionException::notAllowed($from, $to);
            }

            if ($guard !== null) {
                $guard($locked);
            }

            $locked->update([...$changes, 'status' => $to]);

            $locked->statusHistories()->create([
                'from_status' => $from,
                'to_status' => $to,
                'user_id' => $by?->id,
                'note' => $note,
                'created_at' => $locked->updated_at,
            ]);

            $reservation->setRawAttributes($locked->getAttributes(), true);
            $reservation->unsetRelation('statusHistories');

            return $reservation;
        });
    }

    /**
     * The car must still be rentable and free for the reservation's times (other
     * blocking reservations, the reservation itself excluded).
     *
     * @throws ReservationTransitionException
     */
    private function ensureCarIsFree(Car $car, Reservation $reservation): void
    {
        if ($car->trashed()) {
            throw ReservationTransitionException::carRemoved();
        }

        if ($car->status !== CarStatus::Available) {
            throw ReservationTransitionException::carNotRentable($car->status);
        }

        $conflict = $car->reservations()
            ->blocking()
            ->overlapping($reservation->start_at, $reservation->end_at)
            ->whereKeyNot($reservation->getKey())
            ->orderBy('start_at')
            ->value('reference');

        if ($conflict !== null) {
            throw ReservationTransitionException::overlap($conflict);
        }
    }
}
