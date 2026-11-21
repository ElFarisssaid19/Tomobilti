<?php

namespace App\Models;

use App\Enums\ExtraPricing;
use Illuminate\Database\Eloquent\Relations\Pivot;

/**
 * An extra booked on a reservation, with its price snapshot at booking time.
 */
class ExtraReservation extends Pivot
{
    /**
     * Indicates if the IDs are auto-incrementing.
     *
     * @var bool
     */
    public $incrementing = true;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'pricing' => ExtraPricing::class,
            'total' => 'decimal:2',
        ];
    }
}
