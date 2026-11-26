<?php

namespace App\Notifications;

use App\Models\Reservation;
use App\Services\FrenchFormatter;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\AnonymousNotifiable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Base of every reservation email and in-app notification (Phase 6).
 *
 * - Queued, and only dispatched after the database transaction that changed the
 *   reservation commits (afterCommit): a rolled-back change never sends anything.
 * - Each event is sent once, by App\Services\ReservationNotifier, right after the
 *   status change that ReservationWorkflow made under a row lock.
 * - Emails share one short template (resources/views/mail/reservation.blade.php):
 *   a title, one line, the key details, one button.
 * - In-app notifications ("database" channel) store a type, a short French title and
 *   body, the reservation reference and the SPA path to open.
 */
abstract class ReservationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Relations the emails and the PDFs read.
     *
     * @var list<string>
     */
    protected const RELATIONS = ['user', 'car.brand', 'pickupLocation', 'returnLocation', 'extras', 'invoice'];

    public function __construct(public Reservation $reservation)
    {
        $this->afterCommit();
    }

    /**
     * Machine name of the event, e.g. "reservation.confirmed" (the SPA picks the icon from it).
     */
    abstract public function type(): string;

    /**
     * Get the notification's delivery channels. The agency's address (an on-demand
     * route) gets the email, admin users the in-app notification.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the array representation of the notification (database channel).
     *
     * @return array{type: string, title: string, body: string, reference: string, url: string}
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->type(),
            'title' => $this->inAppTitle(),
            'body' => $this->inAppBody(),
            'reference' => $this->reservation->reference,
            'url' => $this->isForAgency($notifiable)
                ? "/admin/reservations/{$this->reservation->reference}"
                : "/espace/reservations/{$this->reservation->reference}",
        ];
    }

    /**
     * Short title of the in-app notification ("Réservation confirmée").
     */
    protected function inAppTitle(): string
    {
        return '';
    }

    /**
     * Short body of the in-app notification: car and pick-up time.
     */
    protected function inAppBody(): string
    {
        return "{$this->carName()}, ".FrenchFormatter::shortDateTime($this->loadedReservation()->start_at);
    }

    /**
     * The email, in the shared template.
     *
     * @param  array<string, string>  $details  label => value, shown in the panel
     * @param  array{label: string, text: string}|null  $note  a reason, for example
     * @param  array{title: string, items: list<string>}|null  $list  a short checklist
     */
    protected function mail(
        string $subject,
        string $title,
        string $intro,
        array $details,
        string $actionText,
        string $actionUrl,
        ?array $note = null,
        ?array $list = null,
        ?string $outro = null,
    ): MailMessage {
        return (new MailMessage)
            ->subject($subject)
            ->markdown('mail.reservation', [
                'title' => $title,
                'intro' => $intro,
                'details' => $details,
                'note' => $note,
                'list' => $list,
                'actionText' => $actionText,
                'actionUrl' => $actionUrl,
                'outro' => $outro,
            ]);
    }

    /**
     * Reference, car, pick-up and return: the details most emails show.
     *
     * @return array<string, string>
     */
    protected function bookingDetails(): array
    {
        $reservation = $this->loadedReservation();

        return [
            'Référence' => $reservation->reference,
            'Voiture' => $this->carName(),
            'Prise en charge' => FrenchFormatter::dateTime($reservation->start_at).', '.$reservation->pickupLocation->name,
            'Restitution' => FrenchFormatter::dateTime($reservation->end_at).', '.$reservation->returnLocation->name,
            'Total' => FrenchFormatter::money((string) $reservation->total),
        ];
    }

    protected function clientUrl(): string
    {
        return $this->frontendUrl("/espace/reservations/{$this->reservation->reference}");
    }

    protected function adminUrl(): string
    {
        return $this->frontendUrl("/admin/reservations/{$this->reservation->reference}");
    }

    protected function frontendUrl(string $path): string
    {
        return rtrim((string) config('app.frontend_url'), '/').$path;
    }

    protected function carName(): string
    {
        $car = $this->loadedReservation()->car;

        return "{$car->brand->name} {$car->model}";
    }

    protected function isForAgency(object $notifiable): bool
    {
        return $notifiable instanceof AnonymousNotifiable || (method_exists($notifiable, 'isAdmin') && $notifiable->isAdmin());
    }

    protected function loadedReservation(): Reservation
    {
        return $this->reservation->loadMissing(static::RELATIONS);
    }
}
