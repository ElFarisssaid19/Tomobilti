<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;
use App\Models\Reservation;
use Illuminate\Database\Eloquent\Builder;

/**
 * Tabs of the back-office reservations list (GET /api/admin/reservations?tab=...):
 *
 *  - pending: requests to answer (pending), soonest pick-up first;
 *  - today:   pick-ups or returns today (cancelled and refused left out);
 *  - active:  cars currently with a customer, soonest return first;
 *  - all:     everything, newest first.
 */
enum AdminReservationTab: string
{
    use HasOptions;

    case Pending = 'pending';
    case Today = 'today';
    case Active = 'active';
    case All = 'all';

    /**
     * French label shown in the UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::Pending => 'À traiter',
            self::Today => 'Aujourd’hui',
            self::Active => 'En cours',
            self::All => 'Toutes',
        };
    }

    /**
     * Restrict a reservations query to this tab.
     *
     * @param  Builder<Reservation>  $query
     */
    public function apply(Builder $query): void
    {
        $today = now()->startOfDay();
        $tomorrow = $today->copy()->addDay();

        match ($this) {
            self::Pending => $query->where('reservations.status', ReservationStatus::Pending),
            self::Today => $query
                ->whereNotIn('reservations.status', [ReservationStatus::Cancelled, ReservationStatus::Rejected])
                ->where(fn (Builder $day) => $day
                    ->whereBetween('reservations.start_at', [$today, $tomorrow->copy()->subSecond()])
                    ->orWhereBetween('reservations.end_at', [$today, $tomorrow->copy()->subSecond()])),
            self::Active => $query->where('reservations.status', ReservationStatus::Active),
            self::All => null,
        };
    }

    /**
     * Default sort column and direction of the tab.
     *
     * @return array{0: string, 1: 'asc'|'desc'}
     */
    public function defaultSort(): array
    {
        return match ($this) {
            self::Pending, self::Today => ['start_at', 'asc'],
            self::Active => ['end_at', 'asc'],
            self::All => ['created_at', 'desc'],
        };
    }
}
