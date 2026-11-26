<?php

namespace App\Notifications\Client;

use App\Notifications\ReservationNotification;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * "Demande reçue": the customer booked, the agency will answer. Email only.
 */
class ReservationRequested extends ReservationNotification
{
    public function type(): string
    {
        return 'reservation.requested';
    }

    public function toMail(object $notifiable): MailMessage
    {
        return $this->mail(
            subject: "Demande reçue : {$this->reservation->reference}",
            title: 'Demande reçue',
            intro: 'Merci ! L’agence confirme votre réservation au plus vite, vous recevrez un e-mail.',
            details: $this->bookingDetails(),
            actionText: 'Voir ma réservation',
            actionUrl: $this->clientUrl(),
            outro: 'Le paiement se fait à l’agence, à la prise en charge.',
        );
    }
}
