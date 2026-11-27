<?php

namespace App\Console\Commands;

use App\Models\Invoice;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Removes what the Playwright end-to-end suite (frontend/e2e) created: the accounts on
 * the reserved test domain, their reservations with the invoices, extras and status
 * history, the in-app notifications about those reservations (the admins' ones too)
 * and the accounts' sessions. Nothing else is touched.
 *
 * The suite runs it before and after each run. Refused in production.
 */
#[Signature('tomobilti:e2e-cleanup')]
#[Description('Delete the accounts and reservations created by the end-to-end tests')]
class CleanupE2eData extends Command
{
    /**
     * Every account the e2e suite creates uses this e-mail domain (frontend/e2e/support).
     */
    public const EMAIL_DOMAIN = 'e2e.tomobilti.test';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if (app()->isProduction()) {
            $this->components->error('Commande désactivée en production.');

            return self::FAILURE;
        }

        $users = User::query()->where('email', 'like', '%@'.self::EMAIL_DOMAIN)->pluck('id');
        $references = Reservation::query()->whereIn('user_id', $users)->pluck('reference');

        DB::transaction(function () use ($users, $references): void {
            foreach ($references as $reference) {
                DB::table('notifications')->where('data', 'like', '%"reference":"'.$reference.'"%')->delete();
            }

            DB::table('notifications')
                ->where('notifiable_type', (new User)->getMorphClass())
                ->whereIn('notifiable_id', $users)
                ->delete();

            Invoice::query()->whereIn('reservation_id', Reservation::query()->whereIn('user_id', $users)->select('id'))->delete();
            // Extras and status history go with the reservation (cascade).
            Reservation::query()->whereIn('user_id', $users)->delete();
            DB::table('sessions')->whereIn('user_id', $users)->delete();
            User::query()->whereKey($users)->delete();
        });

        $this->components->info(sprintf(
            '%d compte(s) et %d réservation(s) de test supprimés.',
            $users->count(),
            $references->count(),
        ));

        return self::SUCCESS;
    }
}
