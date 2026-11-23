<?php

namespace App\Models;

use App\Enums\ReservationStatus;
use App\Enums\ReservationTab;
use App\Models\Concerns\HasYearlySequenceNumber;
use Carbon\CarbonInterface;
use Database\Factories\ReservationFactory;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;
use InvalidArgumentException;

/**
 * A booking of a car by a customer. Prices are snapshots taken at booking time.
 *
 * The reference (e.g. "TMB-2026-000123") is generated on create.
 */
#[Fillable([
    'reference',
    'user_id',
    'car_id',
    'pickup_location_id',
    'return_location_id',
    'start_at',
    'end_at',
    'days',
    'price_per_day',
    'extras_total',
    'one_way_fee',
    'total',
    'deposit_amount',
    'status',
    'customer_notes',
    'admin_notes',
    'rejection_reason',
    'cancellation_reason',
    'confirmed_at',
    'picked_up_at',
    'returned_at',
    'cancelled_at',
    'rejected_at',
])]
class Reservation extends Model
{
    /** @use HasFactory<ReservationFactory> */
    use HasFactory, HasYearlySequenceNumber;

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'pending',
        'extras_total' => 0,
        'one_way_fee' => 0,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'days' => 'integer',
            'price_per_day' => 'decimal:2',
            'extras_total' => 'decimal:2',
            'one_way_fee' => 'decimal:2',
            'total' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'status' => ReservationStatus::class,
            'confirmed_at' => 'datetime',
            'picked_up_at' => 'datetime',
            'returned_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    /**
     * The customer who booked.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The booked car, even if it was later removed from the fleet (soft deleted).
     *
     * @return BelongsTo<Car, $this>
     */
    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class)->withTrashed();
    }

    /**
     * @return BelongsTo<Location, $this>
     */
    public function pickupLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'pickup_location_id');
    }

    /**
     * @return BelongsTo<Location, $this>
     */
    public function returnLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'return_location_id');
    }

    /**
     * Booked extras, with quantity and price snapshot on the pivot, in booking order.
     *
     * @return BelongsToMany<Extra, $this, ExtraReservation, 'pivot'>
     */
    public function extras(): BelongsToMany
    {
        return $this->belongsToMany(Extra::class)
            ->using(ExtraReservation::class)
            ->withPivot(['quantity', 'unit_price', 'pricing', 'total'])
            ->withTimestamps()
            ->orderByPivot('id');
    }

    /**
     * @return HasOne<Invoice, $this>
     */
    public function invoice(): HasOne
    {
        return $this->hasOne(Invoice::class);
    }

    /**
     * Reservations in any of the given statuses.
     */
    #[Scope]
    protected function withStatus(Builder $query, ReservationStatus ...$statuses): void
    {
        $query->whereIn('status', $statuses);
    }

    /**
     * Reservations that make their car unavailable (pending, confirmed, active).
     */
    #[Scope]
    protected function blocking(Builder $query): void
    {
        $query->whereIn('status', ReservationStatus::blocking());
    }

    /**
     * Reservations whose period overlaps [$start, $end[.
     *
     * Touching periods (one ends exactly when the other starts) do not overlap.
     *
     * @throws InvalidArgumentException when $end is not after $start
     */
    #[Scope]
    protected function overlapping(Builder $query, DateTimeInterface|string $start, DateTimeInterface|string $end): void
    {
        $start = Carbon::parse($start);
        $end = Carbon::parse($end);

        if ($end->lessThanOrEqualTo($start)) {
            throw new InvalidArgumentException('The end date must be after the start date.');
        }

        $query->where('start_at', '<', $end)->where('end_at', '>', $start);
    }

    /**
     * Reservations that have not started yet.
     */
    #[Scope]
    protected function upcoming(Builder $query): void
    {
        $query->where('start_at', '>', now());
    }

    /**
     * Reservations in progress right now (started and not yet ended).
     */
    #[Scope]
    protected function current(Builder $query): void
    {
        $query->where('start_at', '<=', now())->where('end_at', '>', now());
    }

    /**
     * Reservations whose period is over.
     */
    #[Scope]
    protected function past(Builder $query): void
    {
        $query->where('end_at', '<=', now());
    }

    /**
     * Reservations of one tab of "Mes réservations" (ReservationTab).
     */
    #[Scope]
    protected function inTab(Builder $query, ReservationTab $tab): void
    {
        $tab->apply($query);
    }

    /**
     * Last moment the customer can cancel for free: free_cancellation_hours before pick-up.
     */
    public function freeCancellationDeadline(): CarbonInterface
    {
        return $this->start_at->copy()->subHours((int) config('tomobilti.booking.free_cancellation_hours'));
    }

    protected function sequenceNumberColumn(): string
    {
        return 'reference';
    }

    protected function sequenceNumberPrefix(): string
    {
        return 'TMB';
    }

    protected function sequenceNumberDate(): CarbonInterface
    {
        return $this->created_at ?? now();
    }
}
