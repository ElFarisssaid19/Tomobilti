<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;

/**
 * Gearbox type of a car.
 */
enum Transmission: string
{
    use HasOptions;

    case Manual = 'manual';
    case Automatic = 'automatic';

    /**
     * French label shown in the UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::Manual => 'Manuelle',
            self::Automatic => 'Automatique',
        };
    }
}
