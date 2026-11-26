<?php

namespace App\Notifications\Client;

use App\Models\Reservation;
use App\Notifications\ReservationNotification;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * "Réservation annulée": the confirmation of the customer's own cancellation (email
 * only), or the agency's cancellation with its reason (email and in-app).
 */
class ReservationCancelled extends ReservationNotification
{
    public function __construct(Reservation $reservation, public bool $byAgency)
    {
        parent::__construct($reservation);
    }

    public function type(): string
    {
        return 'reservation.cancelled';
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return $this->byAgency ? ['mail', 'database'] : ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $reason = $this->reservation->cancellation_reason;

        return $this->mail(
            subject: "Réservation annulée : {$this->reservation->reference}",
            title: 'Réservation annulée',
            intro: $this->byAgency
                ? 'L’agence a dû annuler votre réservation. Nous sommes désolés.'
                : 'Votre annulation est enregistrée. Rien ne vous sera facturé.',
            details: $this->bookingDetails(),
            actionText: 'Voir les voitures',
            actionUrl: $this->frontendUrl('/voitures'),
            note: filled($reason) ? ['label' => 'Motif', 'text' => (string) $reason] : null,
        );
    }

    protected function inAppTitle(): string
    {
        return 'Réservation annulée par l’agence';
    }
}
