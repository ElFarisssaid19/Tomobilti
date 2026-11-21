<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;

/**
 * Operational status of a car in the fleet.
 */
enum CarStatus: string
{
    use HasOptions;

    case Available = 'available';
    case Maintenance = 'maintenance';
    case OutOfService = 'out_of_service';

    /**
     * French label shown in the UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::Available => 'Disponible',
            self::Maintenance => 'En maintenance',
            self::OutOfService => 'Hors service',
        };
    }
}
