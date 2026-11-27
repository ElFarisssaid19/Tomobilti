<?php

namespace Tests\Feature\Console;

use App\Models\Invoice;
use App\Models\Reservation;
use App\Models\User;
use App\Notifications\Agency\NewReservationRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CleanupE2eDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_removes_only_the_end_to_end_accounts_and_what_they_booked(): void
    {
        $admin = User::factory()->admin()->create();
        $e2e = User::factory()->create(['email' => 'client-1@e2e.tomobilti.test']);
        $customer = User::factory()->create(['email' => 'salma@example.com']);

        $e2eInvoice = Invoice::factory()->for(Reservation::factory()->for($e2e)->completed())->create();
        $e2ePending = Reservation::factory()->for($e2e)->create();
        $customerInvoice = Invoice::factory()->for(Reservation::factory()->for($customer)->completed())->create();
        $admin->notifyNow(new NewReservationRequest($e2ePending), ['database']);
        $admin->notifyNow(new NewReservationRequest($customerInvoice->reservation), ['database']);

        $this->artisan('tomobilti:e2e-cleanup')
            ->expectsOutputToContain('1 compte(s) et 2 réservation(s) de test supprimés.')
            ->assertSuccessful();

        $this->assertModelMissing($e2e);
        $this->assertModelMissing($e2ePending);
        $this->assertModelMissing($e2eInvoice);
        $this->assertModelExists($customer);
        $this->assertModelExists($customerInvoice);
        $this->assertSame(
            [$customerInvoice->reservation->reference],
            $admin->notifications()->get()->pluck('data.reference')->all(),
        );
    }

    public function test_is_refused_in_production(): void
    {
        $e2e = User::factory()->create(['email' => 'client-1@e2e.tomobilti.test']);
        $this->app->detectEnvironment(fn (): string => 'production');

        $this->artisan('tomobilti:e2e-cleanup')->assertFailed();

        $this->assertModelExists($e2e);
    }
}
