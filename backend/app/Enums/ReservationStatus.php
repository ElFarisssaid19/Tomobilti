<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;

/**
 * Lifecycle of a reservation.
 *
 *   pending ──▶ confirmed ──▶ active ──▶ completed
 *      │            │
 *      ├──▶ rejected └──▶ cancelled
 *      └──▶ cancelled
 */
enum ReservationStatus: string
{
    use HasOptions;

    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Active = 'active';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
    case Rejected = 'rejected';

    /**
     * French label shown in the UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::Pending => 'En attente',
            self::Confirmed => 'Confirmée',
            self::Active => 'En cours',
            self::Completed => 'Terminée',
            self::Cancelled => 'Annulée',
            self::Rejected => 'Refusée',
        };
    }

    /**
     * Whether a reservation in this status makes the car unavailable for its dates.
     */
    public function blocksAvailability(): bool
    {
        return in_array($this, self::blocking(), true);
    }

    /**
     * Statuses that make the car unavailable for the reservation dates.
     *
     * @return list<self>
     */
    public static function blocking(): array
    {
        return [self::Pending, self::Confirmed, self::Active];
    }

    /**
     * Whether the customer or an admin can still cancel the reservation.
     */
    public function canBeCancelled(): bool
    {
        return $this->canTransitionTo(self::Cancelled);
    }

    /**
     * Whether no further status change is possible.
     */
    public function isFinal(): bool
    {
        return $this->allowedTransitions() === [];
    }

    /**
     * Statuses this status may move to.
     *
     * @return list<self>
     */
    public function allowedTransitions(): array
    {
        return match ($this) {
            self::Pending => [self::Confirmed, self::Rejected, self::Cancelled],
            self::Confirmed => [self::Active, self::Cancelled],
            self::Active => [self::Completed],
            self::Completed, self::Cancelled, self::Rejected => [],
        };
    }

    /**
     * Whether moving from this status to the given one is allowed.
     */
    public function canTransitionTo(self $status): bool
    {
        return in_array($status, $this->allowedTransitions(), true);
    }
}
