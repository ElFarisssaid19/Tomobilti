<?php

namespace Tests\Feature\Console;

use App\Enums\ReservationStatus;
use App\Models\Reservation;
use Illuminate\Console\Scheduling\Event;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExpireReservationsTest extends TestCase
{
    use RefreshDatabase;

    public function test_refuses_pending_requests_whose_pick_up_time_has_passed(): void
    {
        $this->travelTo('2026-12-10 10:05');
        $expired = Reservation::factory()->between('2026-12-10 10:00', '2026-12-12 10:00')->pending()->create();
        $stillPending = Reservation::factory()->between('2026-12-10 10:30', '2026-12-12 10:00')->pending()->create();
        $confirmed = Reservation::factory()->between('2026-12-10 09:00', '2026-12-12 10:00')->confirmed()->create();

        $this->artisan('reservations:expire')
            ->expectsOutputToContain('1 demande expirée refusée.')
            ->assertSuccessful();

        $expired->refresh();
        $this->assertSame(ReservationStatus::Rejected, $expired->status);
        $this->assertSame('Demande expirée', $expired->rejection_reason);
        $this->assertTrue($expired->rejected_at->equalTo(now()));
        $this->assertSame(ReservationStatus::Pending, $stillPending->refresh()->status);
        $this->assertSame(ReservationStatus::Confirmed, $confirmed->refresh()->status);
    }

    public function test_is_scheduled_every_five_minutes(): void
    {
        $event = collect(app(Schedule::class)->events())
            ->first(fn (Event $event): bool => str_contains($event->command, 'reservations:expire'));

        $this->assertNotNull($event);
        $this->assertSame('*/5 * * * *', $event->expression);
    }
}
