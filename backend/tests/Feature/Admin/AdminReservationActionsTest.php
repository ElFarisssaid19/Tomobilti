<?php

namespace Tests\Feature\Admin;

use App\Enums\ReservationStatus;
use App\Models\Car;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminReservationActionsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-01 09:00');
        $this->admin = User::factory()->admin()->create();
    }

    private function assertHistory(Reservation $reservation, ReservationStatus $from, ReservationStatus $to, ?string $note = null): void
    {
        $this->assertDatabaseHas('reservation_status_histories', [
            'reservation_id' => $reservation->id,
            'from_status' => $from->value,
            'to_status' => $to->value,
            'user_id' => $this->admin->id,
            'note' => $note,
        ]);
    }

    public function test_confirms_a_pending_reservation(): void
    {
        $reservation = Reservation::factory()->between('2026-12-10 10:00', '2026-12-12 10:00')->pending()->create();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/reservations/{$reservation->reference}/confirm")
            ->assertOk()
            ->assertJsonPath('message', 'Réservation confirmée.')
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonPath('data.history.0.to_status', 'confirmed')
            ->assertJsonPath('data.history.0.author.id', $this->admin->id);

        $reservation->refresh();
        $this->assertSame(ReservationStatus::Confirmed, $reservation->status);
        $this->assertTrue($reservation->confirmed_at->equalTo(now()));
        $this->assertHistory($reservation, ReservationStatus::Pending, ReservationStatus::Confirmed);
    }

    public function test_confirming_is_refused_when_another_blocking_reservation_overlaps(): void
    {
        $car = Car::factory()->create();
        $other = Reservation::factory()->for($car)->between('2026-12-09 10:00', '2026-12-11 10:00')->pending()->create();
        $reservation = Reservation::factory()->for($car)->between('2026-12-10 10:00', '2026-12-12 10:00')->pending()->create();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/reservations/{$reservation->reference}/confirm")
            ->assertConflict()
            ->assertJsonPath('code', 'reservation_overlap')
            ->assertJsonPath('message', "La voiture est déjà réservée sur une partie de ces horaires (réservation {$other->reference}). Refusez l’une des deux demandes.");

        $this->assertSame(ReservationStatus::Pending, $reservation->refresh()->status);
        $this->assertDatabaseMissing('reservation_status_histories', ['reservation_id' => $reservation->id]);
    }

    public function test_confirming_is_refused_when_the_car_is_in_maintenance(): void
    {
        $reservation = Reservation::factory()->for(Car::factory()->maintenance())->between('2026-12-10 10:00', '2026-12-12 10:00')->pending()->create();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/reservations/{$reservation->reference}/confirm")
            ->assertConflict()
            ->assertJsonPath('message', 'Cette voiture est « en maintenance » : remettez-la en service avant de confirmer la réservation.');
    }

    public function test_rejects_with_a_required_reason_shown_to_the_customer(): void
    {
        $reservation = Reservation::factory()->between('2026-12-10 10:00', '2026-12-12 10:00')->pending()->create();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/reservations/{$reservation->reference}/reject", ['reason' => ' '])
            ->assertUnprocessable()
            ->assertJsonPath('errors.reason.0', 'Indiquez le motif : il sera affiché au client.');

        $this->actingAs($this->admin)
            ->postJson("/api/admin/reservations/{$reservation->reference}/reject", ['reason' => 'Permis de moins de 2 ans.'])
            ->assertOk()
            ->assertJsonPath('message', 'Réservation refusée.')
            ->assertJsonPath('data.rejection_reason', 'Permis de moins de 2 ans.');

        $this->assertHistory($reservation, ReservationStatus::Pending, ReservationStatus::Rejected, 'Permis de moins de 2 ans.');

        $this->actingAs($reservation->user)
            ->getJson("/api/reservations/{$reservation->reference}")
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', 'Permis de moins de 2 ans.');
    }

    public function test_picks_up_then_returns_a_confirmed_reservation(): void
    {
        $reservation = Reservation::factory()->between('2026-12-01 10:00', '2026-12-03 10:00')->confirmed()->create();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/reservations/{$reservation->reference}/pick-up", ['payment_method' => 'cash', 'paid' => true])
            ->assertOk()
            ->assertJsonPath('message', 'Réservation marquée comme récupérée.')
            ->assertJsonPath('data.status', 'active');
        $this->assertTrue($reservation->refresh()->picked_up_at->equalTo(now()));

        $this->travel(2)->days();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/reservations/{$reservation->reference}/return")
            ->assertOk()
            ->assertJsonPath('message', 'Réservation marquée comme rendue.')
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.history.*.to_status', ['active', 'completed']);

        $this->assertTrue($reservation->refresh()->returned_at->equalTo(now()));
        $this->assertHistory($reservation, ReservationStatus::Confirmed, ReservationStatus::Active);
        $this->assertHistory($reservation, ReservationStatus::Active, ReservationStatus::Completed);
    }

    public function test_the_agency_cancels_with_a_reason_even_within_24_hours(): void
    {
        $reservation = Reservation::factory()->between('2026-12-01 18:00', '2026-12-03 10:00')->confirmed()->create();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/reservations/{$reservation->reference}/cancel", ['reason' => 'Panne du véhicule.'])
            ->assertOk()
            ->assertJsonPath('message', 'Réservation annulée.')
            ->assertJsonPath('data.status', 'cancelled')
            ->assertJsonPath('data.cancellation_reason', 'Panne du véhicule.');

        $this->assertHistory($reservation, ReservationStatus::Confirmed, ReservationStatus::Cancelled, 'Panne du véhicule.');
    }

    public function test_forbidden_transitions_answer_403_with_the_reason(): void
    {
        $completed = Reservation::factory()->between('2026-11-01 10:00', '2026-11-03 10:00')->completed()->create();
        $pending = Reservation::factory()->between('2026-12-10 10:00', '2026-12-12 10:00')->pending()->create();
        $active = Reservation::factory()->between('2026-11-30 10:00', '2026-12-03 10:00')->active()->create();

        $cases = [
            [$completed, 'confirm', [], 'Impossible de confirmer une réservation « terminée ».'],
            [$pending, 'return', [], 'Impossible de marquer comme rendue une réservation « en attente ».'],
            [$pending, 'pick-up', [], 'Impossible de marquer comme récupérée une réservation « en attente ».'],
            [$active, 'cancel', ['reason' => 'Test'], 'Impossible d’annuler une réservation « en cours ».'],
            [$active, 'reject', ['reason' => 'Test'], 'Impossible de refuser une réservation « en cours ».'],
        ];

        foreach ($cases as [$reservation, $action, $body, $message]) {
            $this->actingAs($this->admin)
                ->postJson("/api/admin/reservations/{$reservation->reference}/{$action}", $body)
                ->assertForbidden()
                ->assertExactJson(['message' => $message]);
        }

        $this->assertDatabaseCount('reservation_status_histories', 0);
    }

    public function test_saves_internal_notes(): void
    {
        $reservation = Reservation::factory()->pending()->create();

        $this->actingAs($this->admin)
            ->patchJson("/api/admin/reservations/{$reservation->reference}/notes", ['admin_notes' => 'Client fidèle.'])
            ->assertOk()
            ->assertJsonPath('message', 'Notes enregistrées.')
            ->assertJsonPath('data.admin_notes', 'Client fidèle.');

        $this->actingAs($reservation->user)
            ->getJson("/api/reservations/{$reservation->reference}")
            ->assertJsonMissingPath('data.admin_notes');
    }
}
