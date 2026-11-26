<?php

namespace App\Notifications\Agency;

use Illuminate\Notifications\Messages\MailMessage;

/**
 * "Annulation client": the customer cancelled (free cancellation); the car is free again.
 */
class ReservationCancelledByClient extends AgencyNotification
{
    public function type(): string
    {
        return 'agency.reservation_cancelled';
    }

    public function toMail(object $notifiable): MailMessage
    {
        $reservation = $this->loadedReservation();

        return $this->mail(
            subject: "Annulation client : {$reservation->reference}",
            title: 'Réservation annulée par le client',
            intro: 'La voiture est de nouveau libre pour ces dates.',
            details: [...$this->clientDetails(), ...$this->bookingDetails()],
            actionText: 'Voir la réservation',
            actionUrl: $this->adminUrl(),
            note: filled($reservation->cancellation_reason) ? ['label' => 'Motif', 'text' => $reservation->cancellation_reason] : null,
        )->replyTo($reservation->user->email, $reservation->user->name);
    }

    protected function inAppTitle(): string
    {
        return 'Annulation client';
    }
}
