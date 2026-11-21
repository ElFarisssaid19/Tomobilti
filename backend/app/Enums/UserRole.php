<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;

/**
 * Role of a user account.
 */
enum UserRole: string
{
    use HasOptions;

    case Admin = 'admin';
    case Client = 'client';

    /**
     * French label shown in the UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Administrateur',
            self::Client => 'Client',
        };
    }
}
