<?php

namespace Tests\Feature\Catalog;

use App\Enums\ReservationStatus;
use App\Models\Car;
use App\Models\Reservation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CarAvailabilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_returns_the_booked_days_of_blocking_reservations_as_date_ranges(): void
    {
        $this->travelTo('2026-12-01 09:00');
        $car = Car::factory()->create(['slug' => 'clio']);
        $book = fn (ReservationStatus $status, string $start, string $end) => Reservation::factory()
            ->for($car)->between($start, $end)->create(['status' => $status]);

        $book(ReservationStatus::Confirmed, '2026-12-10 10:00', '2026-12-14 10:00');
        $book(ReservationStatus::Pending, '2026-12-15 09:00', '2026-12-17 18:00');
        $book(ReservationStatus::Active, '2026-11-28 10:00', '2026-12-03 10:00');
        $book(ReservationStatus::Cancelled, '2026-12-20 10:00', '2026-12-22 10:00');
        $book(ReservationStatus::Rejected, '2026-12-24 10:00', '2026-12-26 10:00');
        $book(ReservationStatus::Completed, '2026-11-10 10:00', '2026-11-12 10:00');
        $book(ReservationStatus::Confirmed, '2027-08-01 10:00', '2027-08-05 10:00');

        $this->getJson('/api/cars/clio/availability')
            ->assertOk()
            ->assertExactJson(['data' => [
                'from' => '2026-12-01',
                'to' => '2027-06-01',
                'unavailable' => [
                    ['from' => '2026-11-28', 'to' => '2026-12-03'],
                    // 10 → 14 and the pending 15 → 17 touch: merged into one range.
                    ['from' => '2026-12-10', 'to' => '2026-12-17'],
                ],
            ]]);
    }

    public function test_limits_the_window_to_the_requested_dates(): void
    {
        $this->travelTo('2026-12-01 09:00');
        $car = Car::factory()->create(['slug' => 'clio']);
        Reservation::factory()->for($car)->between('2026-12-10 10:00', '2026-12-12 10:00')->confirmed()->create();
        Reservation::factory()->for($car)->between('2027-02-10 10:00', '2027-02-12 10:00')->confirmed()->create();

        $this->getJson('/api/cars/clio/availability?from=2027-02-01&to=2027-02-28')
            ->assertOk()
            ->assertJsonPath('data.unavailable', [['from' => '2027-02-10', 'to' => '2027-02-12']]);
    }

    public function test_exposes_no_customer_or_reservation_detail(): void
    {
        $this->travelTo('2026-12-01 09:00');
        $car = Car::factory()->create(['slug' => 'clio']);
        $reservation = Reservation::factory()->for($car)->between('2026-12-10 10:00', '2026-12-12 10:00')->confirmed()
            ->create(['customer_notes' => 'Arrivée par le vol AT 800']);

        $body = $this->getJson('/api/cars/clio/availability')->assertOk()->getContent();

        $this->assertSame(['from', 'to'], array_keys(json_decode($body, true)['data']['unavailable'][0]));
        foreach ([$reservation->reference, $reservation->user->name, $reservation->user->email, 'Arrivée par le vol', '10:00'] as $private) {
            $this->assertStringNotContainsString($private, $body);
        }
    }

    public function test_refuses_a_window_longer_than_six_months(): void
    {
        $this->travelTo('2026-12-01 09:00');
        Car::factory()->create(['slug' => 'clio']);

        $this->getJson('/api/cars/clio/availability?from=2026-12-01&to=2027-06-02')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['to' => 'La période demandée ne peut pas dépasser 6 mois.']);

        $this->getJson('/api/cars/clio/availability?from=2026-12-10&to=2026-12-01')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['to' => 'La date de fin doit être après la date de début.']);
    }

    public function test_cars_that_are_not_available_answer_404(): void
    {
        Car::factory()->maintenance()->create(['slug' => 'en-maintenance']);

        $this->getJson('/api/cars/en-maintenance/availability')->assertNotFound();
    }
}
