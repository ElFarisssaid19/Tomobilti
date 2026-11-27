<?php

namespace App\Notifications\Agency;

use App\Notifications\ReservationNotification;
use App\Services\FrenchFormatter;
use Illuminate\Notifications\AnonymousNotifiable;

/**
 * What the agency hears about: the email goes to AGENCY_EMAIL (an on-demand route),
 * the in-app notification to every active admin. The customer is the Reply-To, so
 * the agency can answer straight from its mailbox.
 */
abstract class AgencyNotification extends ReservationNotification
{
    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return $notifiable instanceof AnonymousNotifiable ? ['mail'] : ['database'];
    }

    /**
     * Client, car and pick-up time.
     */
    protected function inAppBody(): string
    {
        return $this->loadedReservation()->user->name.', '.parent::inAppBody();
    }

    /**
     * @return array<string, string>
     */
    protected function clientDetails(): array
    {
        $client = $this->loadedReservation()->user;

        return array_filter([
            'Client' => $client->name,
            'E-mail' => $client->email,
            'Téléphone' => FrenchFormatter::phone($client->phone),
        ]);
    }
}
