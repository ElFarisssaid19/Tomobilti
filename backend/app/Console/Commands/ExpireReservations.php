<?php

namespace App\Console\Commands;

use App\Enums\ReservationStatus;
use App\Models\Reservation;
use App\Services\ReservationWorkflow;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * A pending request the agency never answered cannot be honoured once its pick-up
 * time has passed: it is refused with the reason "Demande expirée", which frees the
 * car for those dates. Scheduled every five minutes (routes/console.php).
 *
 * Each request goes through ReservationWorkflow::expire(), so the change is checked
 * under a row lock (an admin may confirm it at the same moment) and written to the
 * status history with no author (the scheduler).
 */
#[Signature('reservations:expire')]
#[Description('Refuse the pending reservations whose pick-up time has passed')]
class ExpireReservations extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(ReservationWorkflow $workflow): int
    {
        $expired = 0;

        Reservation::query()
            ->withStatus(ReservationStatus::Pending)
            ->where('start_at', '<=', now())
            ->lazyById()
            ->each(function (Reservation $reservation) use ($workflow, &$expired): void {
                $expired += $workflow->expire($reservation) ? 1 : 0;
            });

        $this->components->info(trans_choice(
            '{0} Aucune demande expirée.|{1} 1 demande expirée refusée.|[2,*] :count demandes expirées refusées.',
            $expired,
        ));

        return self::SUCCESS;
    }
}
