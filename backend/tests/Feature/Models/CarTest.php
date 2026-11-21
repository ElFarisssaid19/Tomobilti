<?php

namespace Tests\Feature\Models;

use App\Enums\ReservationStatus;
use App\Models\Car;
use App\Models\CarImage;
use App\Models\Reservation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class CarTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Existing blocking reservation used by the overlap cases.
     */
    private const BOOKED_FROM = '2026-07-10 10:00:00';

    private const BOOKED_UNTIL = '2026-07-15 10:00:00';

    /**
     * @return array<string, array{string, string, bool}>
     */
    public static function periods(): array
    {
        return [
            'overlaps the start' => ['2026-07-08 10:00:00', '2026-07-11 10:00:00', false],
            'overlaps the end' => ['2026-07-14 10:00:00', '2026-07-17 10:00:00', false],
            'inside' => ['2026-07-11 09:00:00', '2026-07-13 18:00:00', false],
            'around' => ['2026-07-09 10:00:00', '2026-07-16 10:00:00', false],
            'same period' => [self::BOOKED_FROM, self::BOOKED_UNTIL, false],
            'ends when the booking starts' => ['2026-07-08 10:00:00', self::BOOKED_FROM, true],
            'starts when the booking ends' => [self::BOOKED_UNTIL, '2026-07-18 10:00:00', true],
            'before' => ['2026-07-01 10:00:00', '2026-07-05 10:00:00', true],
            'after' => ['2026-07-20 10:00:00', '2026-07-25 10:00:00', true],
        ];
    }

    #[DataProvider('periods')]
    public function test_available_between_excludes_cars_with_an_overlapping_reservation(string $start, string $end, bool $available): void
    {
        $car = $this->carBookedBetween(self::BOOKED_FROM, self::BOOKED_UNTIL);

        $this->assertSame($available, Car::availableBetween($start, $end)->whereKey($car->id)->exists());
    }

    #[DataProvider('periods')]
    public function test_is_available_between_detects_overlapping_reservations(string $start, string $end, bool $available): void
    {
        $car = $this->carBookedBetween(self::BOOKED_FROM, self::BOOKED_UNTIL);

        $this->assertSame($available, $car->isAvailableBetween($start, $end));
    }

    /**
     * @return array<string, array{ReservationStatus, bool}>
     */
    public static function reservationStatuses(): array
    {
        return [
            'pending blocks' => [ReservationStatus::Pending, false],
            'confirmed blocks' => [ReservationStatus::Confirmed, false],
            'active blocks' => [ReservationStatus::Active, false],
            'completed does not block' => [ReservationStatus::Completed, true],
            'cancelled does not block' => [ReservationStatus::Cancelled, true],
            'rejected does not block' => [ReservationStatus::Rejected, true],
        ];
    }

    #[DataProvider('reservationStatuses')]
    public function test_only_blocking_statuses_make_the_car_unavailable(ReservationStatus $status, bool $available): void
    {
        $car = $this->carBookedBetween(self::BOOKED_FROM, self::BOOKED_UNTIL, $status);

        $this->assertSame($available, $car->isAvailableBetween(self::BOOKED_FROM, self::BOOKED_UNTIL));
        $this->assertSame($available, Car::availableBetween(self::BOOKED_FROM, self::BOOKED_UNTIL)->whereKey($car->id)->exists());
    }

    /**
     * @return array<string, array{string}>
     */
    public static function unavailableCarStates(): array
    {
        return [
            'maintenance' => ['maintenance'],
            'out of service' => ['outOfService'],
        ];
    }

    #[DataProvider('unavailableCarStates')]
    public function test_cars_that_are_not_available_are_excluded(string $state): void
    {
        $car = Car::factory()->{$state}()->create();

        $this->assertFalse($car->isAvailableBetween(self::BOOKED_FROM, self::BOOKED_UNTIL));
        $this->assertFalse(Car::available()->whereKey($car->id)->exists());
        $this->assertFalse(Car::availableBetween(self::BOOKED_FROM, self::BOOKED_UNTIL)->whereKey($car->id)->exists());
    }

    public function test_soft_deleted_cars_are_excluded(): void
    {
        $car = Car::factory()->create();
        $car->delete();

        $this->assertFalse($car->isAvailableBetween(self::BOOKED_FROM, self::BOOKED_UNTIL));
        $this->assertFalse(Car::availableBetween(self::BOOKED_FROM, self::BOOKED_UNTIL)->whereKey($car->id)->exists());
    }

    public function test_ignored_reservation_does_not_conflict_with_itself(): void
    {
        $car = $this->carBookedBetween(self::BOOKED_FROM, self::BOOKED_UNTIL);
        $ownReservation = $car->reservations()->sole();

        $this->assertTrue($car->isAvailableBetween('2026-07-12 10:00:00', '2026-07-16 10:00:00', $ownReservation->id));
    }

    public function test_ignored_reservation_does_not_hide_other_conflicts(): void
    {
        $car = $this->carBookedBetween(self::BOOKED_FROM, self::BOOKED_UNTIL);
        $ownReservation = Reservation::factory()->for($car)->confirmed()
            ->between('2026-07-20 10:00:00', '2026-07-22 10:00:00')
            ->create();

        $this->assertFalse($car->isAvailableBetween('2026-07-14 10:00:00', '2026-07-21 10:00:00', $ownReservation->id));
    }

    public function test_reservations_of_another_car_do_not_block(): void
    {
        $this->carBookedBetween(self::BOOKED_FROM, self::BOOKED_UNTIL);
        $otherCar = Car::factory()->create();

        $this->assertTrue($otherCar->isAvailableBetween(self::BOOKED_FROM, self::BOOKED_UNTIL));
        $this->assertTrue(Car::availableBetween(self::BOOKED_FROM, self::BOOKED_UNTIL)->whereKey($otherCar->id)->exists());
    }

    public function test_rejects_a_period_that_ends_before_it_starts(): void
    {
        $car = Car::factory()->create();

        $this->expectException(InvalidArgumentException::class);

        $car->isAvailableBetween(self::BOOKED_UNTIL, self::BOOKED_FROM);
    }

    public function test_primary_image_prefers_the_flagged_image_then_the_first_one(): void
    {
        $car = Car::factory()->create();
        $first = CarImage::factory()->for($car)->create();
        CarImage::factory()->for($car)->create();

        $this->assertTrue($car->primaryImage->is($first));

        $flagged = CarImage::factory()->for($car)->primary()->create();

        $this->assertTrue($car->fresh()->primaryImage->is($flagged));
    }

    public function test_slug_is_the_route_key(): void
    {
        $car = Car::factory()->create(['slug' => 'dacia-logan-2024']);

        $this->assertSame('dacia-logan-2024', $car->getRouteKey());
    }

    private function carBookedBetween(string $start, string $end, ReservationStatus $status = ReservationStatus::Pending): Car
    {
        $car = Car::factory()->create();

        Reservation::factory()->for($car)->between($start, $end)->create(['status' => $status]);

        return $car;
    }
}
