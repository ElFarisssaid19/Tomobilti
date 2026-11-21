<?php

namespace App\Models;

use App\Enums\ExtraPricing;
use Database\Factories\ExtraFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\RouteKey;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Optional add-on for a rental (GPS, baby seat, extra driver...).
 */
#[Fillable(['name', 'slug', 'description', 'icon', 'price', 'pricing', 'max_quantity', 'is_active'])]
#[RouteKey('slug')]
class Extra extends Model
{
    /** @use HasFactory<ExtraFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'pricing' => ExtraPricing::class,
            'max_quantity' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Reservations that include this extra.
     *
     * @return BelongsToMany<Reservation, $this, ExtraReservation, 'pivot'>
     */
    public function reservations(): BelongsToMany
    {
        return $this->belongsToMany(Reservation::class)
            ->using(ExtraReservation::class)
            ->withPivot(['quantity', 'unit_price', 'pricing', 'total'])
            ->withTimestamps();
    }

    /**
     * Only extras that can currently be booked.
     */
    #[Scope]
    protected function active(Builder $query): void
    {
        $query->where('is_active', true);
    }
}
