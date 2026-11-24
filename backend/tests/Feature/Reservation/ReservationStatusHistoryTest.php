<?php

namespace Tests\Feature\Reservation;

use App\Enums\ReservationStatus;
use App\Models\Car;
use App\Models\Reservation;
use App\Models\User;
use App\Services\ReservationBooker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * Status changes outside the back office also write the history.
 */
class ReservationStatusHistoryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-01 09:00');
    }

    public function test_booking_writes_the_first_row_with_the_customer_as_author(): void
    {
        $customer = User::factory()->create();
        $car = Car::factory()->create();

        $reservation = app(ReservationBooker::class)->book(
            $customer,
            $car,
            Carbon::parse('2026-12-10 10:00'),
            Carbon::parse('2026-12-12 10:00'),
            $car->location,
            $car->location,
        );

        $this->assertDatabaseHas('reservation_status_histories', [
            'reservation_id' => $reservation->id,
            'from_status' => null,
            'to_status' => 'pending',
            'user_id' => $customer->id,
        ]);
    }

    public function test_customer_cancellation_is_recorded_with_its_reason(): void
    {
        $reservation = Reservation::factory()->between('2026-12-10 10:00', '2026-12-12 10:00')->confirmed()->create();

        $this->actingAs($reservation->user)
            ->postJson("/api/reservations/{$reservation->reference}/cancel", ['reason' => 'Vol annulé'])
            ->assertOk();

        $history = $reservation->statusHistories()->sole();
        $this->assertSame(ReservationStatus::Confirmed, $history->from_status);
        $this->assertSame(ReservationStatus::Cancelled, $history->to_status);
        $this->assertSame($reservation->user_id, $history->user_id);
        $this->assertSame('Vol annulé', $history->note);
        $this->assertTrue($history->created_at->equalTo(now()));
    }

    public function test_expiry_is_recorded_without_author(): void
    {
        $this->travelTo('2026-12-10 10:05');
        $expired = Reservation::factory()->between('2026-12-10 10:00', '2026-12-12 10:00')->pending()->create();

        $this->artisan('reservations:expire')->assertSuccessful();

        $this->assertDatabaseHas('reservation_status_histories', [
            'reservation_id' => $expired->id,
            'from_status' => 'pending',
            'to_status' => 'rejected',
            'user_id' => null,
            'note' => 'Demande expirée',
        ]);
    }
}
