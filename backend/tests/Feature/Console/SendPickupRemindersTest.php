<?php

namespace Tests\Feature\Console;

use App\Models\Reservation;
use App\Notifications\Client\PickupReminder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class SendPickupRemindersTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-01 09:00');
    }

    public function test_reminds_a_confirmed_reservation_picked_up_within_24_hours_once(): void
    {
        Notification::fake();
        $reservation = Reservation::factory()->between('2026-12-02 08:30', '2026-12-04 08:30')->confirmed()->create();

        $this->artisan('reservations:send-reminders')->expectsOutputToContain('1 rappel envoyé.')->assertSuccessful();
        $this->artisan('reservations:send-reminders')->expectsOutputToContain('Aucun rappel à envoyer.')->assertSuccessful();

        Notification::assertSentToTimes($reservation->user, PickupReminder::class, 1);
        Notification::assertSentTo($reservation->user, PickupReminder::class, fn ($notification, array $channels) => $channels === ['mail', 'database']);
        $this->assertTrue($reservation->refresh()->reminder_sent_at->equalTo(now()));
    }

    public function test_skips_cancelled_pending_later_and_started_reservations(): void
    {
        Notification::fake();
        Reservation::factory()->between('2026-12-01 15:00', '2026-12-03 15:00')->cancelled()->create();
        Reservation::factory()->between('2026-12-01 15:00', '2026-12-03 15:00')->pending()->create();
        Reservation::factory()->between('2026-12-02 09:30', '2026-12-04 09:30')->confirmed()->create();
        Reservation::factory()->between('2026-12-01 08:00', '2026-12-03 08:00')->confirmed()->create();

        $this->artisan('reservations:send-reminders')->expectsOutputToContain('Aucun rappel à envoyer.');

        Notification::assertNothingSent();
    }

    public function test_the_reminder_email_gives_the_agency_and_the_documents(): void
    {
        $reservation = Reservation::factory()->between('2026-12-02 08:30', '2026-12-04 08:30')->confirmed()->create();

        $this->artisan('reservations:send-reminders', ['--reference' => $reservation->reference])->assertSuccessful();

        $html = app('mailer')->getSymfonyTransport()->messages()->sole()->getOriginalMessage()->getHtmlBody();
        $this->assertStringContainsString('Rendez-vous demain à 08:30', $html);
        $this->assertStringContainsString(e($reservation->pickupLocation->address), $html);
        $this->assertStringContainsString('Permis de conduire', $html);
    }

    public function test_reference_limits_the_run_to_one_reservation(): void
    {
        Notification::fake();
        $target = Reservation::factory()->between('2026-12-02 08:00', '2026-12-04 08:00')->confirmed()->create();
        $other = Reservation::factory()->between('2026-12-02 08:00', '2026-12-04 08:00')->confirmed()->create();

        $this->artisan('reservations:send-reminders', ['--reference' => $target->reference])->assertSuccessful();

        Notification::assertSentTo($target->user, PickupReminder::class);
        Notification::assertNotSentTo($other->user, PickupReminder::class);
        $this->assertNull($other->refresh()->reminder_sent_at);
    }
}
