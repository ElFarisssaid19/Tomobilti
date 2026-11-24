<?php

namespace App\Models;

use App\Enums\CarStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use Carbon\CarbonInterface;
use Database\Factories\CarFactory;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\RouteKey;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * A car of the rental fleet.
 */
#[Fillable([
    'brand_id',
    'category_id',
    'location_id',
    'model',
    'slug',
    'year',
    'plate_number',
    'color',
    'transmission',
    'fuel',
    'seats',
    'doors',
    'luggage',
    'air_conditioning',
    'mileage',
    'price_per_day',
    'deposit_amount',
    'status',
    'description',
    'is_featured',
])]
#[RouteKey('slug')]
class Car extends Model
{
    /** @use HasFactory<CarFactory> */
    use HasFactory, SoftDeletes;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'transmission' => Transmission::class,
            'fuel' => FuelType::class,
            'seats' => 'integer',
            'doors' => 'integer',
            'luggage' => 'integer',
            'air_conditioning' => 'boolean',
            'mileage' => 'integer',
            'price_per_day' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'status' => CarStatus::class,
            'is_featured' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Brand, $this>
     */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Home location of the car (where it is normally picked up).
     *
     * @return BelongsTo<Location, $this>
     */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    /**
     * Images ordered for display.
     *
     * @return HasMany<CarImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(CarImage::class)->orderBy('sort_order')->orderBy('id');
    }

    /**
     * The image flagged as primary, or the first image when none is flagged.
     *
     * @return HasOne<CarImage, $this>
     */
    public function primaryImage(): HasOne
    {
        return $this->hasOne(CarImage::class)->ofMany([
            'is_primary' => 'max',
            'id' => 'min',
        ]);
    }

    /**
     * @return HasMany<Reservation, $this>
     */
    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    /**
     * Cars that can be rented (status "available").
     */
    #[Scope]
    protected function available(Builder $query): void
    {
        $query->where('status', CarStatus::Available);
    }

    /**
     * Cars chosen by the agency for the home page.
     */
    #[Scope]
    protected function featured(Builder $query): void
    {
        $query->where('is_featured', true);
    }

    /**
     * Available cars with no blocking reservation overlapping the given period.
     *
     * Overlap rule: existing.start_at < $end AND existing.end_at > $start, so a return
     * at 10:00 and a pick-up at 10:00 on the same car do not overlap.
     */
    #[Scope]
    protected function availableBetween(Builder $query, DateTimeInterface|string $start, DateTimeInterface|string $end): void
    {
        $query->available()->whereDoesntHave(
            'reservations',
            fn (Builder $reservations) => $reservations->blocking()->overlapping($start, $end),
        );
    }

    /**
     * Whether this car can be booked for the given period.
     *
     * Pass $ignoreReservationId when changing the dates of an existing reservation,
     * so it does not conflict with itself.
     */
    public function isAvailableBetween(
        DateTimeInterface|string $start,
        DateTimeInterface|string $end,
        ?int $ignoreReservationId = null,
    ): bool {
        if ($this->trashed() || $this->status !== CarStatus::Available) {
            return false;
        }

        return $this->reservations()
            ->blocking()
            ->overlapping($start, $end)
            ->when($ignoreReservationId, fn (Builder $query, int $id) => $query->whereKeyNot($id))
            ->doesntExist();
    }

    /**
     * A free slug for brand + model + year ("renault-clio-5-2025"), with "-2", "-3"…
     * when another car (removed ones included) already has it.
     */
    public static function uniqueSlug(string $brand, string $model, int $year, ?int $ignoreId = null): string
    {
        $base = Str::slug("{$brand} {$model} {$year}");
        $taken = static::withTrashed()
            ->where(fn (Builder $query) => $query->where('slug', $base)->orWhere('slug', 'like', "{$base}-%"))
            ->when($ignoreId, fn (Builder $query, int $id) => $query->whereKeyNot($id))
            ->pluck('slug')
            ->all();

        $slug = $base;

        for ($suffix = 2; in_array($slug, $taken, true); $suffix++) {
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }

    /**
     * Blocking reservations (pending, confirmed, active) that are not over yet: what
     * still needs this car.
     *
     * @return HasMany<Reservation, $this>
     */
    public function upcomingReservations(): HasMany
    {
        return $this->reservations()->blocking()->notEnded();
    }

    /**
     * Other available cars of the same category, the closest in price first.
     *
     * @return Collection<int, Car>
     */
    public function similarCars(int $limit): Collection
    {
        return static::query()
            ->available()
            ->where('category_id', $this->category_id)
            ->whereKeyNot($this->getKey())
            ->orderByRaw('ABS(price_per_day - ?)', [$this->price_per_day])
            ->orderBy('id')
            ->limit($limit)
            ->get();
    }

    /**
     * Days on which this car cannot be booked between $from and $to, as inclusive
     * date ranges (["from" => "2026-12-01", "to" => "2026-12-05"]).
     *
     * Only the dates of blocking reservations are read (no customer data). A day
     * touched by a reservation counts as unavailable: pick-up and return times are
     * chosen in the booking flow. Overlapping or adjacent ranges are merged.
     *
     * @return list<array{from: string, to: string}>
     */
    public function unavailableDateRanges(CarbonInterface $from, CarbonInterface $to): array
    {
        $reservations = $this->reservations()
            ->blocking()
            ->overlapping($from->copy()->startOfDay(), $to->copy()->endOfDay())
            ->orderBy('start_at')
            ->get(['start_at', 'end_at']);

        $ranges = [];

        foreach ($reservations as $reservation) {
            $start = $reservation->start_at->toDateString();
            $end = $reservation->end_at->toDateString();
            $last = array_key_last($ranges);

            if ($last !== null && $start <= Carbon::parse($ranges[$last]['to'])->addDay()->toDateString()) {
                $ranges[$last]['to'] = max($ranges[$last]['to'], $end);

                continue;
            }

            $ranges[] = ['from' => $start, 'to' => $end];
        }

        return $ranges;
    }
}
