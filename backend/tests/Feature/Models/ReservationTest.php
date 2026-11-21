<?php

namespace Tests\Feature\Models;

use App\Enums\ExtraPricing;
use App\Enums\ReservationStatus;
use App\Models\Car;
use App\Models\Extra;
use App\Models\ExtraReservation;
use App\Models\Invoice;
use App\Models\Reservation;
use Carbon\CarbonInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationTest extends TestCase
{
    use RefreshDatabase;

    public function test_generates_sequential_references_per_year(): void
    {
        $this->travelTo('2026-03-01 12:00:00');

        $first = Reservation::factory()->create();
        $second = Reservation::factory()->create();

        $this->assertSame('TMB-2026-000001', $first->reference);
        $this->assertSame('TMB-2026-000002', $second->reference);
    }

    public function test_reference_sequence_restarts_each_year(): void
    {
        $this->travelTo('2026-12-31 23:00:00');
        Reservation::factory()->count(2)->create();

        $this->travelTo('2027-01-01 09:00:00');
        $reservation = Reservation::factory()->create();

        $this->assertSame('TMB-2027-000001', $reservation->reference);
    }

    public function test_reference_uses_the_year_of_an_explicit_creation_date(): void
    {
        $this->travelTo('2026-03-01 12:00:00');

        $reservation = Reservation::factory()->make();
        $reservation->created_at = now()->subYear();
        $reservation->save();

        $this->assertSame('TMB-2025-000001', $reservation->reference);
    }

    public function test_keeps_a_reference_that_is_already_set(): void
    {
        $reservation = Reservation::factory()->create(['reference' => 'TMB-2026-000777']);

        $this->assertSame('TMB-2026-000777', $reservation->reference);
    }

    public function test_casts_money_dates_and_status(): void
    {
        $car = Car::factory()->create(['price_per_day' => 250, 'deposit_amount' => 5000]);

        $reservation = Reservation::factory()->for($car)
            ->between('2026-07-10 10:00:00', '2026-07-13 10:00:00')
            ->create()
            ->fresh();

        $this->assertSame(ReservationStatus::Pending, $reservation->status);
        $this->assertSame('250.00', $reservation->price_per_day);
        $this->assertSame('750.00', $reservation->total);
        $this->assertSame('5000.00', $reservation->deposit_amount);
        $this->assertSame(3, $reservation->days);
        $this->assertInstanceOf(CarbonInterface::class, $reservation->start_at);
        $this->assertSame('2026-07-13 10:00:00', $reservation->end_at->format('Y-m-d H:i:s'));
    }

    public function test_keeps_its_car_after_the_car_is_soft_deleted(): void
    {
        $reservation = Reservation::factory()->completed()->create();
        $reservation->car->delete();

        $this->assertTrue($reservation->fresh()->car->trashed());
    }

    public function test_relations_resolve_both_ways(): void
    {
        $reservation = Reservation::factory()->completed()->create();
        $invoice = Invoice::factory()->for($reservation)->create();

        $this->assertTrue($reservation->user->reservations->first()->is($reservation));
        $this->assertTrue($reservation->car->reservations->first()->is($reservation));
        $this->assertTrue($reservation->pickupLocation->pickupReservations->first()->is($reservation));
        $this->assertTrue($reservation->returnLocation->returnReservations->first()->is($reservation));
        $this->assertTrue($reservation->invoice->is($invoice));
        $this->assertTrue($invoice->reservation->is($reservation));
    }

    public function test_extras_pivot_keeps_the_price_snapshot(): void
    {
        $reservation = Reservation::factory()->create();
        $extra = Extra::factory()->perRental()->create(['price' => 150]);

        $reservation->extras()->attach($extra, [
            'quantity' => 2,
            'unit_price' => '150.00',
            'pricing' => ExtraPricing::PerRental,
            'total' => '300.00',
        ]);
        $extra->update(['price' => 200]);

        $pivot = $reservation->extras()->sole()->pivot;

        $this->assertInstanceOf(ExtraReservation::class, $pivot);
        $this->assertSame(2, $pivot->quantity);
        $this->assertSame('150.00', $pivot->unit_price);
        $this->assertSame(ExtraPricing::PerRental, $pivot->pricing);
        $this->assertSame('300.00', $pivot->total);
        $this->assertTrue($extra->reservations->first()->is($reservation));
    }

    public function test_time_scopes_split_upcoming_current_and_past_reservations(): void
    {
        $this->travelTo('2026-07-15 12:00:00');

        $past = Reservation::factory()->between('2026-07-01 10:00:00', '2026-07-15 12:00:00')->create();
        $current = Reservation::factory()->between('2026-07-15 12:00:00', '2026-07-20 10:00:00')->create();
        $upcoming = Reservation::factory()->between('2026-07-15 12:00:01', '2026-07-20 10:00:00')->create();

        $this->assertEquals([$past->id], Reservation::past()->pluck('id')->all());
        $this->assertEquals([$current->id], Reservation::current()->pluck('id')->all());
        $this->assertEquals([$upcoming->id], Reservation::upcoming()->pluck('id')->all());
    }

    public function test_status_scopes_filter_by_status(): void
    {
        $pending = Reservation::factory()->pending()->create();
        $active = Reservation::factory()->active()->create();
        $cancelled = Reservation::factory()->cancelled()->create();

        $this->assertEqualsCanonicalizing(
            [$pending->id, $active->id],
            Reservation::blocking()->pluck('id')->all(),
        );
        $this->assertEqualsCanonicalizing(
            [$active->id, $cancelled->id],
            Reservation::withStatus(ReservationStatus::Active, ReservationStatus::Cancelled)->pluck('id')->all(),
        );
    }
}
