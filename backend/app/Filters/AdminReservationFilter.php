<?php

namespace App\Filters;

use App\Enums\AdminReservationTab;
use App\Models\Reservation;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

/**
 * Filters of the back-office reservations list and of its CSV export
 * (GET /api/admin/reservations, /export), validated by Admin\ReservationIndexRequest.
 *
 * GET /api/admin/reservations?tab=all&status=confirmed,active&from=2026-12-01&to=2026-12-31&q=bennani
 *   → confirmed or active reservations touching December, for a client named Bennani.
 */
final class AdminReservationFilter
{
    /**
     * Sortable columns.
     *
     * @var list<string>
     */
    public const SORTS = ['start_at', 'end_at', 'created_at', 'total', 'reference'];

    /**
     * @param  array<string, mixed>  $filters  validated query parameters
     */
    public function __construct(private readonly array $filters) {}

    public function tab(): AdminReservationTab
    {
        return AdminReservationTab::tryFrom($this->filters['tab'] ?? '') ?? AdminReservationTab::Pending;
    }

    /**
     * The tab, every filter, then the sort.
     *
     * @param  Builder<Reservation>  $query
     * @return Builder<Reservation>
     */
    public function apply(Builder $query): Builder
    {
        $this->tab()->apply($query);
        $this->byStatuses($query);
        $this->byPeriod($query);
        $this->byCar($query);
        $this->byLocation($query);
        $this->bySearch($query);
        $this->sort($query);

        return $query;
    }

    /**
     * ?status=confirmed,active
     */
    private function byStatuses(Builder $query): void
    {
        if (! empty($this->filters['status'])) {
            $query->whereIn('status', $this->filters['status']);
        }
    }

    /**
     * ?from=2026-12-01&to=2026-12-31 → reservations whose period touches these days
     * (either bound may be left out).
     */
    private function byPeriod(Builder $query): void
    {
        if (filled($this->filters['from'] ?? null)) {
            $query->where('end_at', '>', CarbonImmutable::parse($this->filters['from'])->startOfDay());
        }

        if (filled($this->filters['to'] ?? null)) {
            $query->where('start_at', '<', CarbonImmutable::parse($this->filters['to'])->addDay()->startOfDay());
        }
    }

    /**
     * ?car=12 (car id, removed cars included).
     */
    private function byCar(Builder $query): void
    {
        if (filled($this->filters['car'] ?? null)) {
            $query->where('car_id', $this->filters['car']);
        }
    }

    /**
     * ?location=3 → picked up or returned at this agency.
     */
    private function byLocation(Builder $query): void
    {
        if (filled($this->filters['location'] ?? null)) {
            $location = $this->filters['location'];
            $query->where(fn (Builder $either) => $either->where('pickup_location_id', $location)->orWhere('return_location_id', $location));
        }
    }

    /**
     * ?q=bennani → reference, or the client's name, email or phone.
     */
    private function bySearch(Builder $query): void
    {
        $search = trim((string) ($this->filters['q'] ?? ''));

        if ($search === '') {
            return;
        }

        $like = '%'.addcslashes($search, '%_\\').'%';
        $phone = preg_replace('/[\s.\-()]/', '', $search);

        $query->where(fn (Builder $match) => $match
            ->where('reference', 'like', $like)
            ->orWhereHas('user', fn (Builder $user) => $user
                ->where('name', 'like', $like)
                ->orWhere('email', 'like', $like)
                ->when($phone !== '', fn (Builder $byPhone) => $byPhone->orWhere('phone', 'like', '%'.ltrim($phone, '0+').'%'))));
    }

    /**
     * ?sort=total&direction=desc, otherwise the tab's default order.
     */
    private function sort(Builder $query): void
    {
        [$defaultSort, $defaultDirection] = $this->tab()->defaultSort();
        $sort = $this->filters['sort'] ?? $defaultSort;
        $direction = $this->filters['direction'] ?? ($sort === $defaultSort ? $defaultDirection : 'asc');

        $query->orderBy($sort, $direction === 'desc' ? 'desc' : 'asc')->orderBy('id', $direction === 'desc' ? 'desc' : 'asc');
    }
}
