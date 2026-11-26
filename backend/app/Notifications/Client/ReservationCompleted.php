<?php

namespace App\Notifications\Client;

use App\Notifications\ReservationNotification;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * "Merci": the car is back. Email only.
 */
class ReservationCompleted extends ReservationNotification
{
    public function type(): string
    {
        return 'reservation.completed';
    }

    public function toMail(object $notifiable): MailMessage
    {
        $reservation = $this->loadedReservation();

        return $this->mail(
            subject: 'Merci pour votre location',
            title: "Merci, {$this->firstName()}",
            intro: "Vous avez rendu votre {$this->carName()}. À bientôt sur la route !",
            details: [
                'Référence' => $reservation->reference,
                'Voiture' => $this->carName(),
                'Restitution' => $reservation->returnLocation->name,
            ],
            actionText: 'Réserver à nouveau',
            actionUrl: $this->frontendUrl('/voitures'),
        );
    }

    private function firstName(): string
    {
        return strtok($this->loadedReservation()->user->name, ' ') ?: $this->reservation->user->name;
    }
}
