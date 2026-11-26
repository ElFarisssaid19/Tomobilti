<?php

namespace Tests\Feature\Notifications;

use App\Models\Car;
use App\Models\Invoice;
use App\Models\Location;
use App\Models\Reservation;
use App\Models\User;
use App\Notifications\Agency\NewReservationRequest;
use App\Notifications\Agency\ReservationCancelledByClient;
use App\Notifications\Client\InvoiceIssued;
use App\Notifications\Client\ReservationCancelled;
use App\Notifications\Client\ReservationCompleted;
use App\Notifications\Client\ReservationConfirmed;
use App\Notifications\Client\ReservationRejected;
use App\Notifications\Client\ReservationRequested;
use App\Notifications\ReservationNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ReservationNotificationsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private User $client;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-01 09:00');
        $this->admin = User::factory()->admin()->create();
        $this->client = User::factory()->create(['name' => 'Salma Bennani']);
    }

    /**
     * Only these notifications, each exactly once, to these notifiables.
     */
    private function assertOnlySent(array $expected): void
    {
        $sent = collect(Notification::sentNotifications())
            ->flatMap(fn (array $byKey) => collect($byKey)->flatMap(fn (array $byClass) => collect($byClass)
                ->flatMap(fn (array $entries, string $class) => array_fill(0, count($entries), $class))))
            ->countBy()
            ->sortKeys()
            ->all();

        ksort($expected);
        $this->assertSame($expected, $sent);
    }

    private function mailFor(ReservationNotification $notification, object $notifiable): MailMessage
    {
        return $notification->toMail($notifiable);
    }

    public function test_booking_tells_the_client_and_the_agency(): void
    {
        Notification::fake();
        $agency = Location::factory()->create(['slug' => 'gueliz']);
        Car::factory()->for($agency)->create(['slug' => 'clio']);

        $this->actingAs($this->client)->postJson('/api/reservations', [
            'car' => 'clio',
            'start_at' => '2026-12-10 10:00',
            'end_at' => '2026-12-12 10:00',
            'pickup_location' => 'gueliz',
            'return_location' => 'gueliz',
            'terms' => true,
        ])->assertCreated();

        Notification::assertSentTo($this->client, ReservationRequested::class, fn ($notification, array $channels) => $channels === ['mail']);
        Notification::assertSentOnDemand(
            NewReservationRequest::class,
            fn ($notification, array $channels, AnonymousNotifiable $notifiable) => $notifiable->routes['mail'] === 'contact@tomobilti.ma' && $channels === ['mail'],
        );
        Notification::assertSentTo($this->admin, NewReservationRequest::class, fn ($notification, array $channels) => $channels === ['database']);
        Notification::assertNotSentTo($this->client, NewReservationRequest::class);
    }

    public function test_confirming_emails_the_voucher_and_notifies_in_app_once(): void
    {
        Notification::fake();
        $reservation = Reservation::factory()->for($this->client)->between('2026-12-10 10:00', '2026-12-12 10:00')->pending()->create();

        $this->actingAs($this->admin)->postJson("/api/admin/reservations/{$reservation->reference}/confirm")->assertOk();
        $this->actingAs($this->admin)->postJson("/api/admin/reservations/{$reservation->reference}/confirm")->assertForbidden();

        $this->assertOnlySent([ReservationConfirmed::class => 1]);
        Notification::assertSentTo($this->client, ReservationConfirmed::class, function (ReservationConfirmed $notification, array $channels) {
            $mail = $this->mailFor($notification, $this->client);

            return $channels === ['mail', 'database']
                && $mail->subject === "Réservation confirmée : {$notification->reservation->reference}"
                && $mail->rawAttachments[0]['name'] === "bon-de-reservation-{$notification->reservation->reference}.pdf"
                && str_starts_with($mail->rawAttachments[0]['data'], '%PDF')
                && $notification->toArray($this->client)['url'] === "/espace/reservations/{$notification->reservation->reference}";
        });
    }

    public function test_refusing_emails_the_reason(): void
    {
        Notification::fake();
        $reservation = Reservation::factory()->for($this->client)->between('2026-12-10 10:00', '2026-12-12 10:00')->pending()->create();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/reservations/{$reservation->reference}/reject", ['reason' => 'Permis de moins de 2 ans.'])
            ->assertOk();

        $this->assertOnlySent([ReservationRejected::class => 1]);
        Notification::assertSentTo($this->client, ReservationRejected::class, function (ReservationRejected $notification, array $channels) {
            return $channels === ['mail', 'database']
                && str_contains((string) $this->mailFor($notification, $this->client)->render(), 'Permis de moins de 2 ans.');
        });
    }

    public function test_an_expired_request_is_refused_by_email_with_its_reason(): void
    {
        Notification::fake();
        Reservation::factory()->for($this->client)->between('2026-12-01 08:00', '2026-12-03 08:00')->pending()->create();

        Artisan::call('reservations:expire');

        Notification::assertSentTo($this->client, ReservationRejected::class, function (ReservationRejected $notification) {
            return str_contains((string) $this->mailFor($notification, $this->client)->render(), 'Demande expirée');
        });
    }

    public function test_a_client_cancellation_confirms_to_the_client_and_tells_the_agency(): void
    {
        Notification::fake();
        $reservation = Reservation::factory()->for($this->client)->between('2026-12-10 10:00', '2026-12-12 10:00')->confirmed()->create();

        $this->actingAs($this->client)
            ->postJson("/api/reservations/{$reservation->reference}/cancel", ['reason' => 'Vol annulé'])
            ->assertOk();

        Notification::assertSentTo($this->client, ReservationCancelled::class, fn (ReservationCancelled $notification, array $channels) => ! $notification->byAgency && $channels === ['mail']);
        Notification::assertSentOnDemand(ReservationCancelledByClient::class);
        Notification::assertSentTo($this->admin, ReservationCancelledByClient::class, fn ($notification, array $channels) => $channels === ['database']);
        $this->assertOnlySent([ReservationCancelled::class => 1, ReservationCancelledByClient::class => 2]);
    }

    public function test_an_agency_cancellation_gives_the_client_the_reason_in_app_too(): void
    {
        Notification::fake();
        $reservation = Reservation::factory()->for($this->client)->between('2026-12-10 10:00', '2026-12-12 10:00')->confirmed()->create();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/reservations/{$reservation->reference}/cancel", ['reason' => 'Véhicule immobilisé.'])
            ->assertOk();

        $this->assertOnlySent([ReservationCancelled::class => 1]);
        Notification::assertSentTo($this->client, ReservationCancelled::class, function (ReservationCancelled $notification, array $channels) {
            return $notification->byAgency
                && $channels === ['mail', 'database']
                && str_contains((string) $this->mailFor($notification, $this->client)->render(), 'Véhicule immobilisé.');
        });
    }

    public function test_the_pick_up_emails_the_invoice_pdf_and_notifies_in_app(): void
    {
        Notification::fake();
        $reservation = Reservation::factory()->for($this->client)->between('2026-12-01 10:00', '2026-12-03 10:00')->confirmed()->create();

        $this->actingAs($this->admin)
            ->postJson("/api/admin/reservations/{$reservation->reference}/pick-up", ['payment_method' => 'card', 'paid' => true])
            ->assertOk();

        $this->assertOnlySent([InvoiceIssued::class => 1]);
        Notification::assertSentTo($this->client, InvoiceIssued::class, function (InvoiceIssued $notification, array $channels) {
            $mail = $this->mailFor($notification, $this->client);

            return $channels === ['mail', 'database']
                && $mail->rawAttachments[0]['name'] === "facture-{$notification->invoice->number}.pdf"
                && str_starts_with($mail->rawAttachments[0]['data'], '%PDF');
        });
    }

    public function test_the_return_thanks_the_client(): void
    {
        Notification::fake();
        $reservation = Reservation::factory()->for($this->client)->between('2026-11-28 10:00', '2026-12-01 10:00')->active()->create();

        $this->actingAs($this->admin)->postJson("/api/admin/reservations/{$reservation->reference}/return")->assertOk();

        $this->assertOnlySent([ReservationCompleted::class => 1]);
        Notification::assertSentTo($this->client, ReservationCompleted::class, function (ReservationCompleted $notification, array $channels) {
            return $channels === ['mail'] && $this->mailFor($notification, $this->client)->subject === 'Merci pour votre location';
        });
    }

    public function test_a_refused_action_sends_nothing(): void
    {
        Notification::fake();
        $reservation = Reservation::factory()->for($this->client)->between('2026-12-10 10:00', '2026-12-12 10:00')->completed()->create();

        $this->actingAs($this->admin)->postJson("/api/admin/reservations/{$reservation->reference}/confirm")->assertForbidden();

        Notification::assertNothingSent();
    }

    public function test_notifications_are_queued_after_the_database_commit(): void
    {
        $reservation = Reservation::factory()->create();

        $this->assertTrue((new ReservationConfirmed($reservation))->afterCommit);
        $this->assertTrue((new NewReservationRequest($reservation))->afterCommit);
        $this->assertTrue((new InvoiceIssued(Invoice::factory()->for($reservation)->create()))->afterCommit);
    }

    public function test_the_confirmation_really_leaves_with_its_voucher_and_is_stored_in_app(): void
    {
        $reservation = Reservation::factory()->for($this->client)->between('2026-12-10 10:00', '2026-12-12 10:00')->pending()->create();

        $this->actingAs($this->admin)->postJson("/api/admin/reservations/{$reservation->reference}/confirm")->assertOk();

        $messages = app('mailer')->getSymfonyTransport()->messages();
        $this->assertCount(1, $messages);
        $email = $messages->first()->getOriginalMessage();
        $this->assertSame($this->client->email, $email->getTo()[0]->getAddress());
        $this->assertSame(["bon-de-reservation-{$reservation->reference}.pdf"], array_map(fn ($part) => $part->getFilename(), $email->getAttachments()));

        $this->assertSame(
            ['type' => 'reservation.confirmed', 'title' => 'Réservation confirmée', 'reference' => $reservation->reference, 'url' => "/espace/reservations/{$reservation->reference}"],
            array_diff_key($this->client->notifications()->sole()->data, ['body' => true]),
        );
    }
}
