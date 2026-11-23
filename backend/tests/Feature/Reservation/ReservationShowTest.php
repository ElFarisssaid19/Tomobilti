<?php

namespace Tests\Feature\Reservation;

use App\Models\Car;
use App\Models\CarImage;
use App\Models\Extra;
use App\Models\Location;
use App\Models\Reservation;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationShowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-01 09:00');
    }

    public function test_shows_my_reservation_with_agencies_extras_breakdown_and_timeline(): void
    {
        $user = User::factory()->create();
        $pickup = Location::factory()->create(['name' => 'Marrakech Guéliz', 'phone' => '+212524000102', 'opening_hours' => 'Lun – Sam, 08:30 – 19:30']);
        $car = Car::factory()->for($pickup)->create(['price_per_day' => '300.00']);
        CarImage::factory()->for($car)->count(2)->create();
        $gps = Extra::factory()->create(['name' => 'GPS', 'price' => '50.00']);
        $reservation = Reservation::factory()->for($user)->for($car)
            ->between('2026-12-10 10:00', '2026-12-12 10:00')
            ->confirmed()
            ->create([
                'return_location_id' => Location::factory(),
                'one_way_fee' => '300.00',
                'extras_total' => '100.00',
                'total' => '1000.00',
                'customer_notes' => 'Vol AT 800',
                'admin_notes' => 'Client fidèle',
            ]);
        $reservation->extras()->attach($gps, ['quantity' => 1, 'unit_price' => '50.00', 'pricing' => 'per_day', 'total' => '100.00']);

        $this->actingAs($user)
            ->getJson("/api/reservations/{$reservation->reference}")
            ->assertOk()
            ->assertJsonPath('data.reference', $reservation->reference)
            ->assertJsonPath('data.status', 'confirmed')
            ->assertJsonCount(2, 'data.car.images')
            ->assertJsonPath('data.pickup_location.name', 'Marrakech Guéliz')
            ->assertJsonPath('data.pickup_location.phone', '+212524000102')
            ->assertJsonPath('data.pickup_location.opening_hours', 'Lun – Sam, 08:30 – 19:30')
            ->assertJsonPath('data.pricing.car_total', '600.00')
            ->assertJsonPath('data.pricing.extras.0.name', 'GPS')
            ->assertJsonPath('data.pricing.fees.0.amount', '300.00')
            ->assertJsonPath('data.pricing.total', '1000.00')
            ->assertJsonPath('data.customer_notes', 'Vol AT 800')
            ->assertJsonPath('data.timeline.confirmed_at', $reservation->confirmed_at->toIso8601String())
            ->assertJsonPath('data.timeline.picked_up_at', null)
            ->assertJsonPath('data.cancellation', [
                'allowed' => true,
                'reason' => null,
                'free_until' => CarbonImmutable::parse('2026-12-09 10:00')->toIso8601String(),
            ])
            ->assertJsonMissingPath('data.admin_notes');
    }

    public function test_someone_elses_reservation_is_not_found(): void
    {
        $reservation = Reservation::factory()->create();

        $this->actingAs(User::factory()->create())
            ->getJson("/api/reservations/{$reservation->reference}")
            ->assertNotFound()
            ->assertExactJson(['message' => 'Ressource introuvable.']);
    }

    public function test_guests_must_sign_in(): void
    {
        $reservation = Reservation::factory()->create();

        $this->getJson("/api/reservations/{$reservation->reference}")->assertUnauthorized();
    }
}
