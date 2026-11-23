<?php

namespace App\Services;

use App\Enums\ExtraPricing;
use App\Models\Reservation;

/**
 * Result of ReservationPricing: every line of the price, ready to show or to save.
 *
 * Built either from a quote (before booking) or from a saved reservation (its price
 * snapshots), so the SPA shows the same breakdown in the booking summary and on the
 * reservation page.
 */
final readonly class PriceBreakdown
{
    public string $extrasTotal;

    public string $total;

    /**
     * @param  list<array{extra_id: int, slug: string, name: string, pricing: ExtraPricing, unit_price: string, quantity: int, total: string}>  $extras
     */
    public function __construct(
        public int $days,
        public string $pricePerDay,
        public string $carTotal,
        public array $extras,
        public string $oneWayFee,
        public string $depositAmount,
    ) {
        $this->extrasTotal = array_reduce(
            $extras,
            fn (string $sum, array $line): string => bcadd($sum, $line['total'], 2),
            '0.00',
        );
        $this->total = bcadd(bcadd($carTotal, $this->extrasTotal, 2), $oneWayFee, 2);
    }

    /**
     * The breakdown of a saved reservation, from its snapshots (load "extras" first).
     */
    public static function fromReservation(Reservation $reservation): self
    {
        $extras = $reservation->extras->map(fn ($extra): array => [
            'extra_id' => $extra->id,
            'slug' => $extra->slug,
            'name' => $extra->name,
            'pricing' => $extra->pivot->pricing,
            'unit_price' => (string) $extra->pivot->unit_price,
            'quantity' => $extra->pivot->quantity,
            'total' => (string) $extra->pivot->total,
        ])->values()->all();

        return new self(
            days: $reservation->days,
            pricePerDay: (string) $reservation->price_per_day,
            carTotal: bcmul((string) $reservation->price_per_day, (string) $reservation->days, 2),
            extras: $extras,
            oneWayFee: (string) $reservation->one_way_fee,
            depositAmount: (string) $reservation->deposit_amount,
        );
    }

    /**
     * JSON shape shared by the quote and the reservation detail.
     *
     * @return array{days: int, price_per_day: string, car_total: string, extras: list<array<string, mixed>>, extras_total: string, fees: list<array{code: string, label: string, amount: string}>, fees_total: string, total: string, deposit_amount: string}
     */
    public function toArray(): array
    {
        $fees = bccomp($this->oneWayFee, '0', 2) > 0
            ? [['code' => 'one_way', 'label' => __('api.booking.one_way_fee'), 'amount' => $this->oneWayFee]]
            : [];

        return [
            'days' => $this->days,
            'price_per_day' => $this->pricePerDay,
            'car_total' => $this->carTotal,
            'extras' => array_map(fn (array $line): array => [
                'slug' => $line['slug'],
                'name' => $line['name'],
                'pricing' => $line['pricing']->value,
                'pricing_label' => $line['pricing']->label(),
                'unit_price' => $line['unit_price'],
                'quantity' => $line['quantity'],
                'total' => $line['total'],
            ], $this->extras),
            'extras_total' => $this->extrasTotal,
            'fees' => $fees,
            'fees_total' => $this->oneWayFee,
            'total' => $this->total,
            'deposit_amount' => $this->depositAmount,
        ];
    }
}
