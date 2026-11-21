<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;

/**
 * How the price of a rental extra is applied.
 */
enum ExtraPricing: string
{
    use HasOptions;

    case PerDay = 'per_day';
    case PerRental = 'per_rental';

    /**
     * French label shown in the UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::PerDay => 'Par jour',
            self::PerRental => 'Par location',
        };
    }
}
