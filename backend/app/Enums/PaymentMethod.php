<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;

/**
 * How an invoice was paid.
 */
enum PaymentMethod: string
{
    use HasOptions;

    case Cash = 'cash';
    case Card = 'card';
    case BankTransfer = 'bank_transfer';

    /**
     * French label shown in the UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::Cash => 'Espèces',
            self::Card => 'Carte bancaire',
            self::BankTransfer => 'Virement bancaire',
        };
    }
}
