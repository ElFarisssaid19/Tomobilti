<?php

namespace App\Models;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use App\Models\Concerns\HasYearlySequenceNumber;
use Carbon\CarbonInterface;
use Database\Factories\InvoiceFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Invoice of a reservation (one per reservation). Amounts in MAD, VAT 20% by default.
 *
 * The number (e.g. "FAC-2026-000045") is generated on create, using the year of issued_at.
 */
#[Fillable([
    'reservation_id',
    'number',
    'issued_at',
    'subtotal_ht',
    'vat_rate',
    'vat_amount',
    'total_ttc',
    'status',
    'paid_at',
    'payment_method',
])]
class Invoice extends Model
{
    /** @use HasFactory<InvoiceFactory> */
    use HasFactory, HasYearlySequenceNumber;

    /**
     * Default VAT rate in Morocco (TVA), in percent.
     */
    public const DEFAULT_VAT_RATE = '20.00';

    /**
     * The model's default values for attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'status' => 'unpaid',
        'vat_rate' => self::DEFAULT_VAT_RATE,
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'issued_at' => 'datetime',
            'subtotal_ht' => 'decimal:2',
            'vat_rate' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'total_ttc' => 'decimal:2',
            'status' => InvoiceStatus::class,
            'paid_at' => 'datetime',
            'payment_method' => PaymentMethod::class,
        ];
    }

    /**
     * Split a VAT-inclusive total (rental prices are shown TTC) into HT and VAT,
     * rounded half up to the centime, without floating point arithmetic.
     *
     * @return array{subtotal_ht: string, vat_amount: string, total_ttc: string}
     */
    public static function splitTotal(string $totalTtc, string $vatRate = self::DEFAULT_VAT_RATE): array
    {
        $divisor = bcadd('1', bcdiv($vatRate, '100', 6), 6);
        $subtotal = bcadd(bcdiv($totalTtc, $divisor, 6), '0.005', 2);

        return [
            'subtotal_ht' => $subtotal,
            'vat_amount' => bcsub($totalTtc, $subtotal, 2),
            'total_ttc' => bcadd($totalTtc, '0', 2),
        ];
    }

    /**
     * @return BelongsTo<Reservation, $this>
     */
    public function reservation(): BelongsTo
    {
        return $this->belongsTo(Reservation::class);
    }

    protected function sequenceNumberColumn(): string
    {
        return 'number';
    }

    protected function sequenceNumberPrefix(): string
    {
        return 'FAC';
    }

    protected function sequenceNumberDate(): CarbonInterface
    {
        return $this->issued_at ?? now();
    }
}
