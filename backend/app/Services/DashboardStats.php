<?php

namespace App\Services;

use App\Enums\CarStatus;
use App\Enums\ReservationStatus;
use App\Http\Resources\Admin\AdminCarResource;
use App\Http\Resources\Admin\AdminReservationResource;
use App\Models\Car;
use App\Models\Category;
use App\Models\Location;
use App\Models\Reservation;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * Numbers of the admin dashboard (GET /api/admin/dashboard?period=30d|90d|12m).
 *
 * The period always ends tonight at midnight and starts at 00:00, so "30 jours" is
 * today and the 29 days before it. Every figure is one aggregate query (SUM, COUNT,
 * GROUP BY) or one eager-loaded list, so the cost does not grow with the data shown.
 * Dates are grouped with DATE(), which MySQL and SQLite (tests) both understand; weeks
 * and months are then bucketed in PHP from at most 366 daily rows.
 *
 * Definitions (the dashboard shows the same words):
 *  - revenue: total of the reservations completed (returned) during the period;
 *  - expected revenue: total of the confirmed and active reservations, whatever their
 *    dates (money the agency will collect for bookings already accepted);
 *  - reservations per status: reservations created during the period;
 *  - pending requests: pending reservations whose pick-up has not passed yet;
 *  - utilisation: booked days / car-days of the fleet in the period. Booked days are
 *    the hours of confirmed, active and completed reservations that fall inside the
 *    period, divided by 24. The fleet is every car not removed and not out of service;
 *  - active rentals: reservations in the "active" status right now.
 */
class DashboardStats
{
    /**
     * Accepted periods and their length.
     *
     * @var array<string, string>
     */
    public const PERIODS = [
        '30d' => '30 jours',
        '90d' => '90 jours',
        '12m' => '12 mois',
    ];

    public const DEFAULT_PERIOD = '30d';

    /**
     * Statuses of a reservation that occupies the car (pending requests excluded).
     *
     * @var list<ReservationStatus>
     */
    private const BOOKED = [ReservationStatus::Confirmed, ReservationStatus::Active, ReservationStatus::Completed];

    /**
     * Reservations that were not cancelled or refused.
     *
     * @var list<ReservationStatus>
     */
    private const KEPT = [ReservationStatus::Pending, ReservationStatus::Confirmed, ReservationStatus::Active, ReservationStatus::Completed];

    private CarbonImmutable $start;

    private CarbonImmutable $end;

    /**
     * @return array<string, mixed>
     */
    public function forPeriod(string $period): array
    {
        [$this->start, $this->end] = self::bounds($period);
        $previousStart = $this->start->sub($this->start->diff($this->end));

        return [
            'period' => [
                'key' => $period,
                'label' => self::PERIODS[$period],
                'from' => $this->start->toDateString(),
                'to' => $this->end->subDay()->toDateString(),
                'days' => (int) $this->start->diffInDays($this->end),
            ],
            'kpis' => [
                'revenue' => $this->revenueBetween($this->start, $this->end),
                'revenue_previous' => $this->revenueBetween($previousStart, $this->start),
                'expected_revenue' => $this->expectedRevenue(),
                'reservations' => $this->reservationsPerStatus(),
                'pending_requests' => Reservation::withStatus(ReservationStatus::Pending)->where('start_at', '>', now())->count(),
                'active_rentals' => Reservation::withStatus(ReservationStatus::Active)->count(),
                'utilisation' => $this->utilisation(),
            ],
            'today' => $this->pickupsAndReturns(),
            'charts' => [
                'revenue_by_month' => $this->revenueByMonth(),
                'reservations_by_week' => $this->reservationsByWeek(),
                'top_cars' => $this->topCars(),
                'by_category' => $this->shareByCategory(),
                'by_agency' => $this->shareByAgency(),
            ],
            'alerts' => [
                'pending_soon' => AdminReservationResource::collection(
                    Reservation::withStatus(ReservationStatus::Pending)
                        ->whereBetween('start_at', [now(), now()->addHours(48)])
                        ->with(AdminReservationResource::RELATIONS)
                        ->orderBy('start_at')
                        ->get(),
                ),
                'cars_unavailable' => AdminCarResource::collection(
                    Car::query()
                        ->whereIn('status', [CarStatus::Maintenance, CarStatus::OutOfService])
                        ->with(['brand', 'primaryImage'])
                        ->orderBy('status')
                        ->orderBy('id')
                        ->get(),
                ),
            ],
            'recent' => AdminReservationResource::collection(
                Reservation::query()->with(AdminReservationResource::RELATIONS)->latest()->latest('id')->limit(6)->get(),
            ),
        ];
    }

    /**
     * [start 00:00, tomorrow 00:00[ for a period key.
     *
     * @return array{0: CarbonImmutable, 1: CarbonImmutable}
     */
    public static function bounds(string $period): array
    {
        $end = CarbonImmutable::today()->addDay();

        $start = match ($period) {
            '90d' => $end->subDays(90),
            '12m' => $end->subYear(),
            default => $end->subDays(30),
        };

        return [$start, $end];
    }

    private function revenueBetween(CarbonImmutable $from, CarbonImmutable $to): string
    {
        return $this->decimal(
            Reservation::withStatus(ReservationStatus::Completed)
                ->where('returned_at', '>=', $from)
                ->where('returned_at', '<', $to)
                ->sum('total'),
        );
    }

    private function expectedRevenue(): string
    {
        return $this->decimal(
            Reservation::withStatus(ReservationStatus::Confirmed, ReservationStatus::Active)->sum('total'),
        );
    }

    /**
     * Reservations created in the period, per status (every status present, 0 included).
     *
     * @return array{total: int, by_status: array<string, int>}
     */
    private function reservationsPerStatus(): array
    {
        $counts = $this->createdInPeriod(Reservation::query())
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $byStatus = collect(ReservationStatus::cases())
            ->mapWithKeys(fn (ReservationStatus $status): array => [$status->value => (int) ($counts[$status->value] ?? 0)])
            ->all();

        return ['total' => array_sum($byStatus), 'by_status' => $byStatus];
    }

    /**
     * Booked days / available car-days, in percent (one decimal).
     *
     * Only the start and end of the overlapping reservations are read; the overlap with
     * the period is clipped in PHP, which stays portable across databases.
     *
     * @return array{rate: float, booked_days: float, available_car_days: int, cars: int}
     */
    private function utilisation(): array
    {
        $bookedSeconds = Reservation::withStatus(...self::BOOKED)
            ->overlapping($this->start, $this->end)
            ->toBase()
            ->get(['start_at', 'end_at'])
            ->sum(function (object $reservation): int {
                $from = max(CarbonImmutable::parse($reservation->start_at), $this->start);
                $to = min(CarbonImmutable::parse($reservation->end_at), $this->end);

                return max(0, (int) $from->diffInSeconds($to));
            });

        $cars = Car::query()->where('status', '!=', CarStatus::OutOfService)->count();
        $carDays = $cars * (int) $this->start->diffInDays($this->end);
        $bookedDays = round($bookedSeconds / 86400, 1);

        return [
            'rate' => $carDays > 0 ? min(100.0, round($bookedSeconds / 86400 / $carDays * 100, 1)) : 0.0,
            'booked_days' => $bookedDays,
            'available_car_days' => $carDays,
            'cars' => $cars,
        ];
    }

    /**
     * Pick-ups (pending, confirmed or already active) and returns (confirmed, active or
     * already completed) today and tomorrow.
     *
     * @return list<array{date: string, pickups: mixed, returns: mixed}>
     */
    private function pickupsAndReturns(): array
    {
        $today = CarbonImmutable::today();
        $until = $today->addDays(2);

        $pickups = Reservation::withStatus(ReservationStatus::Pending, ReservationStatus::Confirmed, ReservationStatus::Active)
            ->where('start_at', '>=', $today)
            ->where('start_at', '<', $until)
            ->with(AdminReservationResource::RELATIONS)
            ->orderBy('start_at')
            ->get();

        $returns = Reservation::withStatus(ReservationStatus::Confirmed, ReservationStatus::Active, ReservationStatus::Completed)
            ->where('end_at', '>=', $today)
            ->where('end_at', '<', $until)
            ->with(AdminReservationResource::RELATIONS)
            ->orderBy('end_at')
            ->get();

        return collect([$today, $today->addDay()])->map(fn (CarbonImmutable $day): array => [
            'date' => $day->toDateString(),
            'pickups' => AdminReservationResource::collection(
                $pickups->filter(fn (Reservation $reservation): bool => $reservation->start_at->isSameDay($day))->values(),
            ),
            'returns' => AdminReservationResource::collection(
                $returns->filter(fn (Reservation $reservation): bool => $reservation->end_at->isSameDay($day))->values(),
            ),
        ])->all();
    }

    /**
     * Revenue of the last 12 months, this month included (completed reservations, by
     * month of return).
     *
     * @return list<array{month: string, revenue: string, reservations: int}>
     */
    private function revenueByMonth(): array
    {
        $firstMonth = CarbonImmutable::today()->startOfMonth()->subMonths(11);

        $days = Reservation::withStatus(ReservationStatus::Completed)
            ->where('returned_at', '>=', $firstMonth)
            ->where('returned_at', '<', CarbonImmutable::today()->addDay())
            ->selectRaw('DATE(returned_at) as day, SUM(total) as revenue, COUNT(*) as reservations')
            ->groupByRaw('DATE(returned_at)')
            ->toBase()
            ->get();

        $months = collect(range(0, 11))->mapWithKeys(fn (int $offset): array => [
            $firstMonth->addMonths($offset)->format('Y-m') => ['revenue' => '0.00', 'reservations' => 0],
        ])->all();

        foreach ($days as $day) {
            $month = substr((string) $day->day, 0, 7);
            $months[$month]['revenue'] = bcadd($months[$month]['revenue'], (string) $day->revenue, 2);
            $months[$month]['reservations'] += (int) $day->reservations;
        }

        return collect($months)
            ->map(fn (array $values, string $month): array => ['month' => $month, ...$values])
            ->values()
            ->all();
    }

    /**
     * Reservations created per week (weeks start on Monday) over the period.
     *
     * @return list<array{week: string, reservations: int}>
     */
    private function reservationsByWeek(): array
    {
        $days = $this->createdInPeriod(Reservation::query())
            ->selectRaw('DATE(created_at) as day, COUNT(*) as reservations')
            ->groupByRaw('DATE(created_at)')
            ->toBase()
            ->pluck('reservations', 'day');

        $weeks = [];

        for ($week = $this->start->startOfWeek(); $week->lessThan($this->end); $week = $week->addWeek()) {
            $weeks[$week->toDateString()] = 0;
        }

        foreach ($days as $day => $count) {
            $weeks[CarbonImmutable::parse($day)->startOfWeek()->toDateString()] += (int) $count;
        }

        return collect($weeks)
            ->map(fn (int $count, string $week): array => ['week' => $week, 'reservations' => $count])
            ->values()
            ->all();
    }

    /**
     * The 5 cars that brought the most revenue in the period.
     *
     * @return list<array{car: mixed, revenue: string, reservations: int}>
     */
    private function topCars(): array
    {
        $rows = Reservation::withStatus(ReservationStatus::Completed)
            ->where('returned_at', '>=', $this->start)
            ->where('returned_at', '<', $this->end)
            ->selectRaw('car_id, SUM(total) as revenue, COUNT(*) as reservations')
            ->groupBy('car_id')
            ->orderByDesc('revenue')
            ->orderBy('car_id')
            ->limit(5)
            ->toBase()
            ->get();

        $cars = Car::withTrashed()->with(['brand', 'primaryImage'])->findMany($rows->pluck('car_id'))->keyBy('id');

        return $rows->map(fn (object $row): array => [
            'car' => new AdminCarResource($cars[$row->car_id]),
            'revenue' => $this->decimal($row->revenue),
            'reservations' => (int) $row->reservations,
        ])->all();
    }

    /**
     * Reservations created in the period (not cancelled or refused) per car category.
     *
     * @return list<array{id: int, name: string, reservations: int, amount: string}>
     */
    private function shareByCategory(): array
    {
        $rows = $this->createdInPeriod(Reservation::query()->whereIn('reservations.status', self::KEPT))
            ->join('cars', 'cars.id', '=', 'reservations.car_id')
            ->selectRaw('cars.category_id as group_id, COUNT(*) as reservations, SUM(reservations.total) as amount')
            ->groupBy('cars.category_id')
            ->toBase()
            ->get();

        return $this->share($rows, Category::query()->orderBy('sort_order')->get(['id', 'name']));
    }

    /**
     * Reservations created in the period (not cancelled or refused) per pick-up agency.
     *
     * @return list<array{id: int, name: string, reservations: int, amount: string}>
     */
    private function shareByAgency(): array
    {
        $rows = $this->createdInPeriod(Reservation::withStatus(...self::KEPT))
            ->selectRaw('pickup_location_id as group_id, COUNT(*) as reservations, SUM(total) as amount')
            ->groupBy('pickup_location_id')
            ->toBase()
            ->get();

        return $this->share($rows, Location::query()->orderBy('id')->get(['id', 'name']));
    }

    /**
     * Join grouped rows to their names, most reservations first (then highest amount), groups without reservations left out.
     *
     * @param  Collection<int, object>  $rows
     * @param  Collection<int, Category|Location>  $groups
     * @return list<array{id: int, name: string, reservations: int, amount: string}>
     */
    private function share(Collection $rows, Collection $groups): array
    {
        $byId = $rows->keyBy('group_id');

        return $groups
            ->filter(fn ($group): bool => isset($byId[$group->id]))
            ->map(fn ($group): array => [
                'id' => $group->id,
                'name' => $group->name,
                'reservations' => (int) $byId[$group->id]->reservations,
                'amount' => $this->decimal($byId[$group->id]->amount),
            ])
            ->sort(fn (array $a, array $b): int => [$b['reservations'], (float) $b['amount']] <=> [$a['reservations'], (float) $a['amount']])
            ->values()
            ->all();
    }

    /**
     * @param  Builder<Reservation>  $query
     * @return Builder<Reservation>
     */
    private function createdInPeriod(Builder $query): Builder
    {
        return $query
            ->where('reservations.created_at', '>=', $this->start)
            ->where('reservations.created_at', '<', $this->end);
    }

    private function decimal(mixed $value): string
    {
        return bcadd((string) ($value ?? '0'), '0', 2);
    }
}
