<?php

namespace App\Models;

use App\Enums\CarStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use Database\Factories\CarFactory;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\RouteKey;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

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
}
