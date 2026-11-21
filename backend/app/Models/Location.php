<?php

namespace App\Models;

use App\Enums\LocationType;
use Database\Factories\LocationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\RouteKey;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Pick-up / return point: an airport desk or a city agency.
 */
#[Fillable(['name', 'slug', 'type', 'city', 'address', 'phone', 'opening_hours', 'is_active'])]
#[RouteKey('slug')]
class Location extends Model
{
    /** @use HasFactory<LocationFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => LocationType::class,
            'is_active' => 'boolean',
        ];
    }

    /**
     * Cars whose home location is this one.
     *
     * @return HasMany<Car, $this>
     */
    public function cars(): HasMany
    {
        return $this->hasMany(Car::class);
    }

    /**
     * Reservations picked up here.
     *
     * @return HasMany<Reservation, $this>
     */
    public function pickupReservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'pickup_location_id');
    }

    /**
     * Reservations returned here.
     *
     * @return HasMany<Reservation, $this>
     */
    public function returnReservations(): HasMany
    {
        return $this->hasMany(Reservation::class, 'return_location_id');
    }
}
