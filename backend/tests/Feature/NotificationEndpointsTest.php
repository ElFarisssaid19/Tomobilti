<?php

namespace Tests\Feature;

use App\Models\Reservation;
use App\Models\User;
use App\Notifications\Client\ReservationConfirmed;
use App\Notifications\Client\ReservationRejected;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-01 09:00');
        $this->user = User::factory()->create();
    }

    private function notify(User $user, string $notification): Reservation
    {
        $reservation = Reservation::factory()->for($user)->confirmed()->create(['rejection_reason' => 'Motif']);
        $user->notifyNow(new $notification($reservation), ['database']);

        return $reservation;
    }

    public function test_lists_my_notifications_newest_first_with_the_unread_count(): void
    {
        $first = $this->notify($this->user, ReservationConfirmed::class);
        $this->travel(1)->hour();
        $second = $this->notify($this->user, ReservationRejected::class);
        $this->notify(User::factory()->create(), ReservationConfirmed::class);

        $this->actingAs($this->user)
            ->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonPath('meta.unread_count', 2)
            ->assertJsonPath('data.*.reference', [$second->reference, $first->reference])
            ->assertJsonPath('data.0.type', 'reservation.rejected')
            ->assertJsonPath('data.0.title', 'Réservation refusée')
            ->assertJsonPath('data.0.url', "/espace/reservations/{$second->reference}")
            ->assertJsonPath('data.0.read_at', null);
    }

    public function test_marks_one_notification_as_read(): void
    {
        $this->notify($this->user, ReservationConfirmed::class);
        $this->notify($this->user, ReservationRejected::class);
        $id = $this->user->notifications()->first()->id;

        $this->actingAs($this->user)
            ->postJson("/api/notifications/{$id}/read")
            ->assertOk()
            ->assertJsonPath('meta.unread_count', 1)
            ->assertJsonPath('data.read_at', now()->toIso8601String());

        $this->assertSame(1, $this->user->unreadNotifications()->count());
    }

    public function test_marks_every_notification_as_read(): void
    {
        $this->notify($this->user, ReservationConfirmed::class);
        $this->notify($this->user, ReservationRejected::class);

        $this->actingAs($this->user)
            ->postJson('/api/notifications/read-all')
            ->assertOk()
            ->assertJsonPath('meta.unread_count', 0);

        $this->assertSame(0, $this->user->unreadNotifications()->count());
    }

    public function test_someone_elses_notification_answers_404(): void
    {
        $other = User::factory()->create();
        $this->notify($other, ReservationConfirmed::class);
        $id = $other->notifications()->first()->id;

        $this->actingAs($this->user)->postJson("/api/notifications/{$id}/read")->assertNotFound();

        $this->assertNull($other->notifications()->first()->read_at);
    }

    public function test_guests_must_sign_in(): void
    {
        $this->getJson('/api/notifications')->assertUnauthorized();
        $this->postJson('/api/notifications/read-all')->assertUnauthorized();
    }
}
