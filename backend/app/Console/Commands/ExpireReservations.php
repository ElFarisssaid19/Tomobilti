<?php

namespace App\Console\Commands;

use App\Enums\ReservationStatus;
use App\Models\Reservation;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * A pending request the agency never answered cannot be honoured once its pick-up
 * time has passed: it is refused with the reason "Demande expirée", which frees the
 * car for those dates. Scheduled every five minutes (routes/console.php).
 */
#[Signature('reservations:expire')]
#[Description('Refuse the pending reservations whose pick-up time has passed')]
class ExpireReservations extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $expired = Reservation::query()
            ->withStatus(ReservationStatus::Pending)
            ->where('start_at', '<=', now())
            ->update([
                'status' => ReservationStatus::Rejected,
                'rejection_reason' => __('api.booking.expired_reason'),
                'rejected_at' => now(),
                'updated_at' => now(),
            ]);

        $this->components->info(trans_choice(
            '{0} Aucune demande expirée.|{1} 1 demande expirée refusée.|[2,*] :count demandes expirées refusées.',
            $expired,
        ));

        return self::SUCCESS;
    }
}
