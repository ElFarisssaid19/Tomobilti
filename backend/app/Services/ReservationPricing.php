<?php

namespace App\Services;

use App\Enums\ExtraPricing;
use App\Models\Car;
use App\Models\Extra;
use App\Models\Location;
use Carbon\CarbonInterface;
use InvalidArgumentException;

/**
 * Computes the price of a rental. The server is the only source of truth for prices:
 * the SPA displays what this service returns and never sends a total.
 *
 * The rules, in the order they are applied:
 *
 *   1. days        = ceil(duration in hours / 24), at least 1
 *                    (e.g. Monday 10:00 → Wednesday 12:00 = 50 h = 3 days)
 *   2. car price   = days × price per day of the car
 *   3. each extra  = price × days × quantity   ("par jour")
 *                  = price × quantity          ("par location")
 *                    with 1 ≤ quantity ≤ max_quantity of the extra
 *   4. one-way fee = 300 DH when the return agency differs from the pick-up agency
 *   5. total       = car price + extras + one-way fee
 *
 * The deposit (caution) is never part of the total: it is held at the agency at
 * pick-up and given back at return. Amounts are decimal strings ("450.00") computed
 * with bcmath, never floats.
 */
class ReservationPricing
{
    /**
     * Number of billed days between pick-up and return: every started 24 hours counts.
     */
    public function billedDays(CarbonInterface $start, CarbonInterface $end): int
    {
        if ($end->lessThanOrEqualTo($start)) {
            throw new InvalidArgumentException('The return must be after the pick-up.');
        }

        $minutes = $start->diffInMinutes($end);

        return max(1, (int) ceil($minutes / (24 * 60)));
    }

    /**
     * Full price breakdown of a rental.
     *
     * @param  list<array{extra: Extra, quantity: int}>  $extras
     */
    public function quote(
        Car $car,
        CarbonInterface $start,
        CarbonInterface $end,
        Location $pickupLocation,
        Location $returnLocation,
        array $extras = [],
    ): PriceBreakdown {
        $days = $this->billedDays($start, $end);
        $pricePerDay = $this->money($car->price_per_day);
        $carTotal = bcmul($pricePerDay, (string) $days, 2);

        $extraLines = array_map(fn (array $selection): array => [
            'extra_id' => $selection['extra']->id,
            'slug' => $selection['extra']->slug,
            'name' => $selection['extra']->name,
            'pricing' => $selection['extra']->pricing,
            'unit_price' => $this->money($selection['extra']->price),
            'quantity' => $selection['quantity'],
            'total' => $this->extraTotal($selection['extra'], $selection['quantity'], $days),
        ], $extras);

        return new PriceBreakdown(
            days: $days,
            pricePerDay: $pricePerDay,
            carTotal: $carTotal,
            extras: $extraLines,
            oneWayFee: $this->oneWayFee($pickupLocation, $returnLocation),
            depositAmount: $this->money($car->deposit_amount),
        );
    }

    /**
     * Price of one extra for the rental.
     *
     * @throws InvalidArgumentException when the quantity is outside 1..max_quantity
     */
    public function extraTotal(Extra $extra, int $quantity, int $days): string
    {
        if ($quantity < 1 || $quantity > $extra->max_quantity) {
            throw new InvalidArgumentException(sprintf(
                'Quantity %d is outside 1..%d for the extra "%s".',
                $quantity,
                $extra->max_quantity,
                $extra->slug,
            ));
        }

        $times = $extra->pricing === ExtraPricing::PerDay ? $quantity * $days : $quantity;

        return bcmul($this->money($extra->price), (string) $times, 2);
    }

    /**
     * One-way fee: charged only when the car is returned to another agency.
     */
    public function oneWayFee(Location $pickupLocation, Location $returnLocation): string
    {
        return $pickupLocation->is($returnLocation)
            ? '0.00'
            : $this->money(config('tomobilti.booking.one_way_fee'));
    }

    private function money(string|int|float $amount): string
    {
        return bcadd((string) $amount, '0', 2);
    }
}
