<?php

namespace Tests\Feature\Reservation;

use App\Enums\ReservationStatus;
use App\Models\Location;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CancelReservationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-01 09:00');
        $this->user = User::factory()->create();
    }

    public function test_cancels_my_reservation_more_than_24_hours_before_pick_up(): void
    {
        $reservation = Reservation::factory()->for($this->user)->between('2026-12-02 09:30', '2026-12-04 10:00')->confirmed()->create();

        $this->actingAs($this->user)
            ->postJson("/api/reservations/{$reservation->reference}/cancel", ['reason' => 'Vol annulé'])
            ->assertOk()
            ->assertJsonPath('message', 'Réservation annulée.')
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.cancellation_reason', 'Vol annulé')
            ->assertJsonPath('data.cancellation.allowed', false);

        $reservation->refresh();
        $this->assertSame(ReservationStatus::Cancelled, $reservation->status);
        $this->assertTrue($reservation->cancelled_at->equalTo(now()));
        $this->assertSame('Vol annulé', $reservation->cancellation_reason);
    }

    public function test_the_reason_is_optional(): void
    {
        $reservation = Reservation::factory()->for($this->user)->between('2026-12-10 10:00', '2026-12-12 10:00')->pending()->create();

        $this->actingAs($this->user)
            ->postJson("/api/reservations/{$reservation->reference}/cancel")
            ->assertOk()
            ->assertJsonPath('data.cancellation_reason', null);
    }

    public function test_within_24_hours_of_pick_up_the_reason_is_explained(): void
    {
        $agency = Location::factory()->create(['name' => 'Marrakech Guéliz', 'phone' => '+212524000102']);
        $reservation = Reservation::factory()->for($this->user)->between('2026-12-02 09:00', '2026-12-04 10:00')->confirmed()
            ->create(['pickup_location_id' => $agency->id, 'return_location_id' => $agency->id]);

        $this->actingAs($this->user)
            ->getJson("/api/reservations/{$reservation->reference}")
            ->assertJsonPath('data.cancellation.allowed', false);

        $this->actingAs($this->user)
            ->postJson("/api/reservations/{$reservation->reference}/cancel")
            ->assertForbidden()
            ->assertExactJson([
                'message' => 'L’annulation gratuite n’est possible que jusqu’à 24 heures avant la prise en charge. Pour toute modification, appelez l’agence Marrakech Guéliz au +212524000102.',
            ]);

        $this->assertSame(ReservationStatus::Confirmed, $reservation->refresh()->status);
    }

    public function test_finished_reservations_cannot_be_cancelled(): void
    {
        $reservation = Reservation::factory()->for($this->user)->between('2026-12-10 10:00', '2026-12-12 10:00')->rejected()->create();

        $this->actingAs($this->user)
            ->postJson("/api/reservations/{$reservation->reference}/cancel")
            ->assertForbidden()
            ->assertExactJson(['message' => 'Cette réservation ne peut plus être annulée : elle est « refusée ».']);
    }

    public function test_someone_elses_reservation_is_not_found(): void
    {
        $reservation = Reservation::factory()->between('2026-12-10 10:00', '2026-12-12 10:00')->pending()->create();

        $this->actingAs($this->user)
            ->postJson("/api/reservations/{$reservation->reference}/cancel")
            ->assertNotFound();

        $this->assertSame(ReservationStatus::Pending, $reservation->refresh()->status);
    }
}
