<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;
use App\Models\Reservation;
use Illuminate\Database\Eloquent\Builder;

/**
 * Tabs of "Mes réservations" (GET /api/reservations?tab=...). Every reservation
 * belongs to exactly one tab:
 *
 *  - upcoming:  pending or confirmed, not started yet (soonest first);
 *  - current:   picked up (active), or pending / confirmed and inside its period;
 *  - past:      completed, or pending / confirmed whose period is over (latest first);
 *  - cancelled: cancelled by the customer or refused by the agency (latest first).
 */
enum ReservationTab: string
{
    use HasOptions;

    case Upcoming = 'upcoming';
    case Current = 'current';
    case Past = 'past';
    case Cancelled = 'cancelled';

    /**
     * French label shown in the UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::Upcoming => 'À venir',
            self::Current => 'En cours',
            self::Past => 'Passées',
            self::Cancelled => 'Annulées',
        };
    }

    /**
     * Restrict and sort a reservations query to this tab.
     *
     * @param  Builder<Reservation>  $query
     */
    public function apply(Builder $query): void
    {
        $now = now();
        $waiting = [ReservationStatus::Pending, ReservationStatus::Confirmed];

        match ($this) {
            self::Upcoming => $query
                ->whereIn('status', $waiting)
                ->where('start_at', '>', $now)
                ->orderBy('start_at'),
            self::Current => $query
                ->where(fn (Builder $current) => $current
                    ->where('status', ReservationStatus::Active)
                    ->orWhere(fn (Builder $started) => $started
                        ->whereIn('status', $waiting)
                        ->where('start_at', '<=', $now)
                        ->where('end_at', '>', $now)))
                ->orderBy('start_at'),
            self::Past => $query
                ->where(fn (Builder $past) => $past
                    ->where('status', ReservationStatus::Completed)
                    ->orWhere(fn (Builder $ended) => $ended
                        ->whereIn('status', $waiting)
                        ->where('end_at', '<=', $now)))
                ->orderByDesc('end_at'),
            self::Cancelled => $query
                ->whereIn('status', [ReservationStatus::Cancelled, ReservationStatus::Rejected])
                ->orderByDesc('updated_at'),
        };

        $query->orderByDesc('id');
    }
}
