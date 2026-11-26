<?php

namespace App\Notifications\Client;

use App\Notifications\ReservationNotification;
use App\Services\FrenchFormatter;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * "C'est demain": sent once, about 24 hours before pick-up, by
 * reservations:send-reminders. Agency address and hours, documents to bring.
 */
class PickupReminder extends ReservationNotification
{
    public function type(): string
    {
        return 'reservation.reminder';
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
        $agency = $reservation->pickupLocation;

        return $this->mail(
            subject: "Rappel : prise en charge {$this->when()}",
            title: 'Votre voiture vous attend',
            intro: "Rendez-vous {$this->when()} pour récupérer votre {$this->carName()}.",
            details: array_filter([
                'Référence' => $reservation->reference,
                'Prise en charge' => FrenchFormatter::dateTime($reservation->start_at),
                'Agence' => $agency->name,
                'Adresse' => $agency->address,
                'Horaires' => $agency->opening_hours,
                'Téléphone' => $agency->phone,
                'À régler sur place' => FrenchFormatter::money((string) $reservation->total),
            ]),
            actionText: 'Voir ma réservation',
            actionUrl: $this->clientUrl(),
            list: [
                'title' => 'Documents à présenter',
                'items' => array_map(
                    fn (array $document): string => "{$document['label']}, {$document['detail']}",
                    __('api.documents.to_bring'),
                ),
            ],
        );
    }

    protected function inAppTitle(): string
    {
        return 'Prise en charge '.$this->when();
    }

    /**
     * "demain à 10:00", or "aujourd'hui à 10:00" when the reminder leaves late.
     */
    private function when(): string
    {
        $start = $this->reservation->start_at;
        $day = $start->isToday() ? 'aujourd’hui' : ($start->isTomorrow() ? 'demain' : 'le '.FrenchFormatter::date($start));

        return "{$day} à {$start->format('H:i')}";
    }
}
