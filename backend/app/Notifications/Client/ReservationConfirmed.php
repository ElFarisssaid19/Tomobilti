<?php

namespace App\Notifications\Client;

use App\Notifications\ReservationNotification;
use App\Services\ReservationDocuments;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * "Réservation confirmée", with the booking voucher (PDF) attached. Email and in-app.
 */
class ReservationConfirmed extends ReservationNotification
{
    public function type(): string
    {
        return 'reservation.confirmed';
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
        $reservation = $this->loadedReservation();

        return $this->mail(
            subject: "Réservation confirmée : {$reservation->reference}",
            title: 'Réservation confirmée',
            intro: 'Votre voiture vous attend. Votre bon de réservation est joint à cet e-mail.',
            details: $this->bookingDetails(),
            actionText: 'Voir ma réservation',
            actionUrl: $this->clientUrl(),
            outro: 'Annulation gratuite jusqu’à 24 h avant la prise en charge.',
        )->attachData(
            app(ReservationDocuments::class)->voucher($reservation)->output(),
            $reservation->voucherFilename(),
            ['mime' => 'application/pdf'],
        );
    }

    protected function inAppTitle(): string
    {
        return 'Réservation confirmée';
    }
}
