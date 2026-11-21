<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;

/**
 * Kind of pick-up / return point.
 */
enum LocationType: string
{
    use HasOptions;

    case Airport = 'airport';
    case Agency = 'agency';

    /**
     * French label shown in the UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::Airport => 'Aéroport',
            self::Agency => 'Agence',
        };
    }
}
