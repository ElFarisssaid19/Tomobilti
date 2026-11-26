<?php

namespace App\Console\Commands;

use App\Enums\ReservationStatus;
use App\Models\Reservation;
use App\Services\ReservationNotifier;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Reminds customers of their pick-up, about 24 hours before: agency address and
 * hours, documents to bring (email and in-app). Scheduled every 15 minutes
 * (routes/console.php).
 *
 * Only confirmed reservations whose pick-up is less than 24 hours away get one, and
 * only once: each reservation is claimed by setting reminder_sent_at with a
 * conditional UPDATE before the reminder is queued, so two runs at the same time
 * (or a run after a confirmation that came late) never send it twice.
 */
#[Signature('reservations:send-reminders {--reference= : Only this reservation (e.g. TMB-2026-000123)}')]
#[Description('Send the pick-up reminder of confirmed reservations starting within 24 hours')]
class SendPickupReminders extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(ReservationNotifier $notifier): int
    {
        $sent = 0;
        $hours = (int) config('tomobilti.notifications.reminder_hours');

        Reservation::query()
            ->withStatus(ReservationStatus::Confirmed)
            ->whereNull('reminder_sent_at')
            ->where('start_at', '>', now())
            ->where('start_at', '<=', now()->addHours($hours))
            ->when($this->option('reference'), fn ($query, string $reference) => $query->where('reference', $reference))
            ->lazyById()
            ->each(function (Reservation $reservation) use ($notifier, &$sent): void {
                DB::transaction(function () use ($reservation, $notifier, &$sent): void {
                    $claimed = Reservation::query()
                        ->whereKey($reservation->getKey())
                        ->withStatus(ReservationStatus::Confirmed)
                        ->whereNull('reminder_sent_at')
                        ->update(['reminder_sent_at' => now()]);

                    if ($claimed === 1) {
                        $notifier->reminder($reservation);
                        $sent++;
                    }
                });
            });

        $this->components->info(trans_choice(
            '{0} Aucun rappel à envoyer.|{1} 1 rappel envoyé.|[2,*] :count rappels envoyés.',
            $sent,
        ));

        return self::SUCCESS;
    }
}
