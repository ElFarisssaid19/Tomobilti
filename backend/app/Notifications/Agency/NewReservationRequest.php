<?php

namespace App\Notifications\Agency;

use Illuminate\Notifications\Messages\MailMessage;

/**
 * "Nouvelle demande": a customer booked, the agency must confirm or refuse.
 */
class NewReservationRequest extends AgencyNotification
{
    public function type(): string
    {
        return 'agency.reservation_requested';
    }

    public function toMail(object $notifiable): MailMessage
    {
        $reservation = $this->loadedReservation();

        return $this->mail(
            subject: "Nouvelle demande : {$reservation->reference}",
            title: 'Nouvelle demande',
            intro: 'Une réservation attend votre réponse.',
            details: [...$this->clientDetails(), ...$this->bookingDetails()],
            actionText: 'Traiter la demande',
            actionUrl: $this->adminUrl(),
            note: filled($reservation->customer_notes) ? ['label' => 'Message du client', 'text' => $reservation->customer_notes] : null,
        )->replyTo($reservation->user->email, $reservation->user->name);
    }

    protected function inAppTitle(): string
    {
        return 'Nouvelle demande';
    }
}
