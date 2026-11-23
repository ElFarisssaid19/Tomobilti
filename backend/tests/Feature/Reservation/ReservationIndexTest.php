<?php

namespace Tests\Feature\Reservation;

use App\Models\Car;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationIndexTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-01 09:00');
        $this->user = User::factory()->create();
    }

    private function book(string $start, string $end, string $state): Reservation
    {
        return Reservation::factory()->for($this->user)->between($start, $end)->{$state}()->create();
    }

    public function test_guests_must_sign_in(): void
    {
        $this->getJson('/api/reservations')->assertUnauthorized();
    }

    public function test_each_reservation_appears_in_exactly_one_tab(): void
    {
        $upcomingLater = $this->book('2026-12-20 10:00', '2026-12-22 10:00', 'confirmed');
        $upcomingSoon = $this->book('2026-12-05 10:00', '2026-12-07 10:00', 'pending');
        $pickedUp = $this->book('2026-11-28 10:00', '2026-12-03 10:00', 'active');
        $startedNotPickedUp = $this->book('2026-11-30 10:00', '2026-12-02 10:00', 'confirmed');
        $completed = $this->book('2026-11-10 10:00', '2026-11-12 10:00', 'completed');
        $endedNeverPickedUp = $this->book('2026-11-20 10:00', '2026-11-22 10:00', 'confirmed');
        $cancelled = $this->book('2026-12-15 10:00', '2026-12-17 10:00', 'cancelled');
        $rejected = $this->book('2026-12-18 10:00', '2026-12-19 10:00', 'rejected');
        Reservation::factory()->between('2026-12-08 10:00', '2026-12-09 10:00')->create();

        $references = fn (string $tab): array => $this->actingAs($this->user)
            ->getJson("/api/reservations?tab={$tab}")
            ->assertOk()
            ->json('data.*.reference');

        $this->assertSame([$upcomingSoon->reference, $upcomingLater->reference], $references('upcoming'));
        $this->assertSame([$pickedUp->reference, $startedNotPickedUp->reference], $references('current'));
        $this->assertSame([$endedNeverPickedUp->reference, $completed->reference], $references('past'));
        $this->assertEqualsCanonicalizing([$cancelled->reference, $rejected->reference], $references('cancelled'));
    }

    public function test_rows_show_the_car_dates_total_and_status_with_the_counts_of_every_tab(): void
    {
        $car = Car::factory()->create(['model' => 'Clio 5']);
        $reservation = Reservation::factory()->for($this->user)->for($car)
            ->between('2026-12-10 10:00', '2026-12-13 10:00')->pending()->create();
        $this->book('2026-11-10 10:00', '2026-11-12 10:00', 'completed');

        $this->actingAs($this->user)
            ->getJson('/api/reservations')
            ->assertOk()
            ->assertJsonPath('meta.tab', 'upcoming')
            ->assertJsonPath('meta.counts', ['upcoming' => 1, 'current' => 0, 'past' => 1, 'cancelled' => 0])
            ->assertJsonPath('data.0.reference', $reservation->reference)
            ->assertJsonPath('data.0.status', 'pending')
            ->assertJsonPath('data.0.status_label', 'En attente')
            ->assertJsonPath('data.0.total', $reservation->total)
            ->assertJsonPath('data.0.days', 3)
            ->assertJsonPath('data.0.car.model', 'Clio 5')
            ->assertJsonPath('data.0.pickup_location.slug', $reservation->pickupLocation->slug)
            ->assertJsonMissingPath('data.0.admin_notes')
            ->assertJsonMissingPath('data.0.user_id');
    }

    public function test_lists_are_paginated_by_ten(): void
    {
        foreach (range(1, 12) as $day) {
            $this->book(sprintf('2026-12-%02d 10:00', $day + 2), sprintf('2026-12-%02d 18:00', $day + 2), 'pending');
        }

        $this->actingAs($this->user)->getJson('/api/reservations?tab=upcoming')
            ->assertOk()
            ->assertJsonCount(10, 'data')
            ->assertJsonPath('meta.total', 12)
            ->assertJsonPath('meta.last_page', 2);

        $this->actingAs($this->user)->getJson('/api/reservations?tab=upcoming&page=2')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_an_unknown_tab_is_refused(): void
    {
        $this->actingAs($this->user)->getJson('/api/reservations?tab=all')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['tab']);
    }
}
