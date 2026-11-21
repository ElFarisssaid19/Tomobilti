<?php

namespace Database\Factories;

use App\Enums\InvoiceStatus;
use App\Enums\PaymentMethod;
use App\Models\Invoice;
use App\Models\Reservation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Invoices whose amounts are derived from the reservation total (TTC).
 *
 * @extends Factory<Invoice>
 */
class InvoiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'reservation_id' => Reservation::factory()->completed(),
            'issued_at' => now(),
            'vat_rate' => Invoice::DEFAULT_VAT_RATE,
            'subtotal_ht' => fn (array $attributes) => $this->amounts($attributes)['subtotal_ht'],
            'vat_amount' => fn (array $attributes) => $this->amounts($attributes)['vat_amount'],
            'total_ttc' => fn (array $attributes) => $this->amounts($attributes)['total_ttc'],
            'status' => InvoiceStatus::Unpaid,
            'paid_at' => null,
            'payment_method' => null,
        ];
    }

    public function paid(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => InvoiceStatus::Paid,
            'paid_at' => $attributes['issued_at'],
            'payment_method' => PaymentMethod::Card,
        ]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array{subtotal_ht: string, vat_amount: string, total_ttc: string}
     */
    private function amounts(array $attributes): array
    {
        $reservation = Reservation::findOrFail($attributes['reservation_id']);

        return Invoice::splitTotal((string) $reservation->total, (string) $attributes['vat_rate']);
    }
}
