<?php

namespace App\Notifications\Client;

use App\Notifications\ReservationNotification;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * "Réservation refusée", with the agency's reason (or "Demande expirée" when the
 * scheduler refused an unanswered request). Email and in-app.
 */
class ReservationRejected extends ReservationNotification
{
    public function type(): string
    {
        return 'reservation.rejected';
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return $this->mail(
            subject: "Réservation refusée : {$this->reservation->reference}",
            title: 'Réservation refusée',
            intro: 'L’agence ne peut pas honorer votre demande.',
            details: $this->bookingDetails(),
            actionText: 'Voir les voitures',
            actionUrl: $this->frontendUrl('/voitures'),
            note: ['label' => 'Motif', 'text' => (string) $this->reservation->rejection_reason],
        );
    }

    protected function inAppTitle(): string
    {
        return 'Réservation refusée';
    }
}
