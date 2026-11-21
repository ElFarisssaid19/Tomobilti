<?php

namespace App\Enums;

use App\Enums\Concerns\HasOptions;

/**
 * Payment status of an invoice.
 */
enum InvoiceStatus: string
{
    use HasOptions;

    case Unpaid = 'unpaid';
    case Paid = 'paid';

    /**
     * French label shown in the UI.
     */
    public function label(): string
    {
        return match ($this) {
            self::Unpaid => 'Non payée',
            self::Paid => 'Payée',
        };
    }
}
