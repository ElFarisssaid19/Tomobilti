<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;

/**
 * Fuel / energy type of a car.
 */
enum FuelType: string
{
    use HasOptions;

    case Diesel = 'diesel';
    case Petrol = 'petrol';
    case Hybrid = 'hybrid';
    case Electric = 'electric';

    /**
     * French label shown in the UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::Diesel => 'Diesel',
            self::Petrol => 'Essence',
            self::Hybrid => 'Hybride',
            self::Electric => 'Électrique',
        };
    }
}
