<?php

namespace Tests\Feature\Reservation;

use App\Models\Car;
use App\Models\Extra;
use App\Models\Location;
use App\Services\ReservationPricing;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ReservationPricingTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{string, string, int}>
     */
    public static function periods(): array
    {
        return [
            'a few hours' => ['2026-12-10 09:00', '2026-12-10 18:00', 1],
            'exactly 24 hours' => ['2026-12-10 10:00', '2026-12-11 10:00', 1],
            '24 hours and 30 minutes' => ['2026-12-10 10:00', '2026-12-11 10:30', 2],
            '50 hours' => ['2026-12-10 10:00', '2026-12-12 12:00', 3],
            'exactly 30 days' => ['2026-12-01 10:00', '2026-12-31 10:00', 30],
        ];
    }

    #[DataProvider('periods')]
    public function test_every_started_24_hours_is_a_billed_day(string $start, string $end, int $days): void
    {
        $this->assertSame($days, (new ReservationPricing)->billedDays(CarbonImmutable::parse($start), CarbonImmutable::parse($end)));
    }

    public function test_the_return_must_be_after_the_pick_up(): void
    {
        $this->expectException(InvalidArgumentException::class);

        (new ReservationPricing)->billedDays(CarbonImmutable::parse('2026-12-10 10:00'), CarbonImmutable::parse('2026-12-10 10:00'));
    }

    public function test_quote_adds_the_car_the_extras_and_never_the_deposit(): void
    {
        $car = Car::factory()->create(['price_per_day' => '450.00', 'deposit_amount' => '8000.00']);
        $gps = Extra::factory()->create(['slug' => 'gps', 'price' => '50.00', 'max_quantity' => 1]);
        $babySeat = Extra::factory()->create(['slug' => 'siege-bebe', 'price' => '40.00', 'max_quantity' => 2]);
        $driver = Extra::factory()->perRental()->create(['slug' => 'conducteur', 'price' => '150.00', 'max_quantity' => 2]);

        $price = (new ReservationPricing)->quote(
            $car,
            CarbonImmutable::parse('2026-12-10 10:00'),
            CarbonImmutable::parse('2026-12-13 10:00'),
            $car->location,
            $car->location,
            [
                ['extra' => $gps, 'quantity' => 1],
                ['extra' => $babySeat, 'quantity' => 2],
                ['extra' => $driver, 'quantity' => 2],
            ],
        );

        $this->assertSame(3, $price->days);
        $this->assertSame('1350.00', $price->carTotal);
        // GPS 50 × 3 days × 1 = 150, baby seats 40 × 3 days × 2 = 240, driver 150 × 2 (per rental) = 300.
        $this->assertSame(['150.00', '240.00', '300.00'], array_column($price->extras, 'total'));
        $this->assertSame('690.00', $price->extrasTotal);
        $this->assertSame('0.00', $price->oneWayFee);
        $this->assertSame('2040.00', $price->total);
        $this->assertSame('8000.00', $price->depositAmount);
    }

    public function test_returning_to_another_agency_adds_the_one_way_fee(): void
    {
        $car = Car::factory()->create(['price_per_day' => '300.00']);
        $otherAgency = Location::factory()->create();

        $price = (new ReservationPricing)->quote(
            $car,
            CarbonImmutable::parse('2026-12-10 10:00'),
            CarbonImmutable::parse('2026-12-12 10:00'),
            $car->location,
            $otherAgency,
        );

        $this->assertSame('300.00', $price->oneWayFee);
        $this->assertSame('900.00', $price->total);
        $this->assertSame(
            [['code' => 'one_way', 'label' => 'Frais de retour dans une autre agence', 'amount' => '300.00']],
            $price->toArray()['fees'],
        );
    }

    /**
     * @return array<string, array{int}>
     */
    public static function invalidQuantities(): array
    {
        return [
            'zero' => [0],
            'above max_quantity' => [3],
        ];
    }

    #[DataProvider('invalidQuantities')]
    public function test_an_extra_quantity_outside_one_to_max_quantity_is_refused(int $quantity): void
    {
        $babySeat = Extra::factory()->create(['price' => '40.00', 'max_quantity' => 2]);

        $this->expectException(InvalidArgumentException::class);

        (new ReservationPricing)->extraTotal($babySeat, $quantity, 3);
    }
}
