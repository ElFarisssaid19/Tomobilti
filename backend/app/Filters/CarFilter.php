<?php

namespace App\Filters;

use App\Enums\ReservationStatus;
use App\Models\Car;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

/**
 * Turns the catalogue's query string (already validated by CarIndexRequest) into
 * Eloquent constraints on a Car query.
 *
 * One small method per filter, named after what it does. Each method does nothing
 * when its parameter is missing, so filters combine freely: every filter adds an
 * "AND" condition to the same query.
 *
 *     $query = (new CarFilter($request->validated()))->apply(Car::query()->available());
 *
 * GET /api/cars?category=suv&transmission=automatic&price_max=800&sort=price_asc
 *   → available SUVs with an automatic gearbox at 800 DH a day or less, cheapest first.
 */
final class CarFilter
{
    /**
     * Accepted values of the "sort" parameter.
     *
     * @var list<string>
     */
    public const SORTS = ['price_asc', 'price_desc', 'newest', 'popular'];

    public const DEFAULT_SORT = 'price_asc';

    /**
     * @param  array<string, mixed>  $filters  validated query parameters
     */
    public function __construct(private readonly array $filters) {}

    /**
     * Add every requested filter, then the sort order.
     *
     * @param  Builder<Car>  $query
     * @return Builder<Car>
     */
    public function apply(Builder $query): Builder
    {
        $this->byCategories($query);
        $this->byBrands($query);
        $this->byTransmission($query);
        $this->byFuels($query);
        $this->byMinimumSeats($query);
        $this->byPriceRange($query);
        $this->byLocation($query);
        $this->byAirConditioning($query);
        $this->bySearch($query);
        $this->bySlugs($query);
        $this->byPeriod($query);
        $this->sort($query);

        return $query;
    }

    /**
     * ?category=suv,luxe → cars in one of these categories.
     */
    private function byCategories(Builder $query): void
    {
        $slugs = $this->list('category');

        if ($slugs !== []) {
            $query->whereHas('category', fn (Builder $category) => $category->whereIn('slug', $slugs));
        }
    }

    /**
     * ?brand=dacia,renault → cars of one of these brands.
     */
    private function byBrands(Builder $query): void
    {
        $slugs = $this->list('brand');

        if ($slugs !== []) {
            $query->whereHas('brand', fn (Builder $brand) => $brand->whereIn('slug', $slugs));
        }
    }

    /**
     * ?transmission=automatic
     */
    private function byTransmission(Builder $query): void
    {
        if ($this->has('transmission')) {
            $query->where('transmission', $this->filters['transmission']);
        }
    }

    /**
     * ?fuel=diesel,hybrid → one of these fuels.
     */
    private function byFuels(Builder $query): void
    {
        $fuels = $this->list('fuel');

        if ($fuels !== []) {
            $query->whereIn('fuel', $fuels);
        }
    }

    /**
     * ?seats_min=7 → at least 7 seats.
     */
    private function byMinimumSeats(Builder $query): void
    {
        if ($this->has('seats_min')) {
            $query->where('seats', '>=', (int) $this->filters['seats_min']);
        }
    }

    /**
     * ?price_min=300&price_max=800 → price per day between both bounds (inclusive).
     */
    private function byPriceRange(Builder $query): void
    {
        if ($this->has('price_min')) {
            $query->where('price_per_day', '>=', $this->filters['price_min']);
        }

        if ($this->has('price_max')) {
            $query->where('price_per_day', '<=', $this->filters['price_max']);
        }
    }

    /**
     * ?location=marrakech-gueliz → cars based at this agency.
     */
    private function byLocation(Builder $query): void
    {
        if ($this->has('location')) {
            $query->whereHas('location', fn (Builder $location) => $location->where('slug', $this->filters['location']));
        }
    }

    /**
     * ?air_conditioning=1 → air-conditioned cars only (0 → without).
     */
    private function byAirConditioning(Builder $query): void
    {
        if ($this->has('air_conditioning')) {
            $query->where('air_conditioning', (bool) $this->filters['air_conditioning']);
        }
    }

    /**
     * ?q=dacia logan → every word must appear in the brand name or in the model.
     */
    private function bySearch(Builder $query): void
    {
        $words = preg_split('/\s+/', trim((string) ($this->filters['q'] ?? '')), -1, PREG_SPLIT_NO_EMPTY);

        foreach (array_slice($words, 0, 5) as $word) {
            $pattern = '%'.addcslashes($word, '%_\\').'%';

            $query->where(fn (Builder $match) => $match
                ->whereLike('model', $pattern)
                ->orWhereHas('brand', fn (Builder $brand) => $brand->whereLike('name', $pattern)));
        }
    }

    /**
     * ?slug=dacia-logan-2024,renault-clio-5-2025 → only these cars (the visitor's
     * favorites, kept in the browser). Unknown slugs simply match nothing.
     */
    private function bySlugs(Builder $query): void
    {
        $slugs = $this->list('slug');

        if ($slugs !== []) {
            $query->whereIn('slug', $slugs);
        }
    }

    /**
     * ?start_at=2026-12-20&end_at=2026-12-27 → cars free for the whole period.
     *
     * Dates are whole days, from the start of the first day to the end of the last
     * one, so a reservation that touches either day excludes the car (this matches
     * the days disabled in the car's calendar). Car::availableBetween() ignores
     * cancelled, rejected and completed reservations.
     */
    private function byPeriod(Builder $query): void
    {
        if (! $this->has('start_at') || ! $this->has('end_at')) {
            return;
        }

        $query->availableBetween(
            CarbonImmutable::parse($this->filters['start_at'])->startOfDay(),
            CarbonImmutable::parse($this->filters['end_at'])->endOfDay(),
        );
    }

    /**
     * ?sort=price_asc (default) | price_desc | newest (most recent model year) |
     * popular (most completed reservations). The id makes the order stable, so a car
     * never appears on two pages.
     */
    private function sort(Builder $query): void
    {
        match ($this->filters['sort'] ?? self::DEFAULT_SORT) {
            'price_desc' => $query->orderByDesc('price_per_day'),
            'newest' => $query->orderByDesc('year')->orderBy('price_per_day'),
            'popular' => $query
                ->withCount(['reservations as completed_reservations_count' => fn (Builder $reservations) => $reservations->withStatus(ReservationStatus::Completed)])
                ->orderByDesc('completed_reservations_count')
                ->orderBy('price_per_day'),
            default => $query->orderBy('price_per_day'),
        };

        $query->orderBy('id');
    }

    private function has(string $parameter): bool
    {
        return isset($this->filters[$parameter]) && $this->filters[$parameter] !== '';
    }

    /**
     * @return list<string>
     */
    private function list(string $parameter): array
    {
        return array_values((array) ($this->filters[$parameter] ?? []));
    }
}
