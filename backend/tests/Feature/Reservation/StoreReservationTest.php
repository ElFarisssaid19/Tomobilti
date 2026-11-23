<?php

namespace Tests\Feature\Reservation;

use App\Enums\ExtraPricing;
use App\Enums\ReservationStatus;
use App\Models\Car;
use App\Models\Extra;
use App\Models\Location;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class StoreReservationTest extends TestCase
{
    use RefreshDatabase;

    private Car $car;

    private Location $agency;

    private Location $otherAgency;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-01 09:00');
        $this->agency = Location::factory()->create(['slug' => 'marrakech-gueliz']);
        $this->otherAgency = Location::factory()->create(['slug' => 'agadir']);
        $this->car = Car::factory()->for($this->agency)->create(['slug' => 'clio', 'price_per_day' => '300.00', 'deposit_amount' => '5000.00']);
        Extra::factory()->create(['slug' => 'gps', 'price' => '50.00', 'max_quantity' => 1]);
        Extra::factory()->perRental()->create(['slug' => 'conducteur', 'price' => '150.00', 'max_quantity' => 2]);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return [
            'car' => 'clio',
            'start_at' => '2026-12-10 10:00',
            'end_at' => '2026-12-13 10:00',
            'pickup_location' => 'marrakech-gueliz',
            'return_location' => 'agadir',
            'extras' => [['slug' => 'gps', 'quantity' => 1], ['slug' => 'conducteur', 'quantity' => 2]],
            'customer_notes' => 'Arrivée par le vol AT 800.',
            'terms' => true,
            ...$overrides,
        ];
    }

    public function test_guests_must_sign_in(): void
    {
        $this->postJson('/api/reservations', $this->payload())
            ->assertUnauthorized()
            ->assertJsonPath('message', 'Vous devez être connecté pour accéder à cette ressource.');
    }

    public function test_an_unverified_email_is_refused_in_french(): void
    {
        $this->actingAs(User::factory()->unverified()->create())
            ->postJson('/api/reservations', $this->payload())
            ->assertForbidden()
            ->assertExactJson(['message' => 'Confirmez votre adresse e-mail avant de réserver une voiture.']);

        $this->assertDatabaseCount('reservations', 0);
    }

    public function test_creates_a_pending_reservation_with_price_snapshots(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/reservations', $this->payload(['total' => '1.00', 'price_per_day' => '1.00', 'status' => 'confirmed']))
            ->assertCreated()
            ->assertJsonPath('message', 'Réservation envoyée. L’agence va la confirmer.')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.status_label', 'En attente')
            ->assertJsonPath('data.pricing.total', '1650.00')
            ->assertJsonPath('data.cancellation.allowed', true);

        $reservation = Reservation::sole();
        $response->assertJsonPath('data.reference', $reservation->reference);
        $this->assertMatchesRegularExpression('/^TMB-2026-\d{6}$/', $reservation->reference);
        $this->assertTrue($reservation->user->is($user));
        $this->assertSame(ReservationStatus::Pending, $reservation->status);
        $this->assertSame(3, $reservation->days);
        $this->assertSame('300.00', $reservation->price_per_day);
        // GPS 50 × 3 days + extra drivers 150 × 2 (per rental) = 450; one-way fee 300.
        $this->assertSame('450.00', $reservation->extras_total);
        $this->assertSame('300.00', $reservation->one_way_fee);
        $this->assertSame('1650.00', $reservation->total);
        $this->assertSame('5000.00', $reservation->deposit_amount);
        $this->assertSame('Arrivée par le vol AT 800.', $reservation->customer_notes);
        $this->assertTrue($reservation->returnLocation->is($this->otherAgency));
        $this->assertSame(
            [
                ['slug' => 'conducteur', 'quantity' => 2, 'unit_price' => '150.00', 'pricing' => ExtraPricing::PerRental, 'total' => '300.00'],
                ['slug' => 'gps', 'quantity' => 1, 'unit_price' => '50.00', 'pricing' => ExtraPricing::PerDay, 'total' => '150.00'],
            ],
            $reservation->extras->sortBy('slug')->map(fn (Extra $extra): array => [
                'slug' => $extra->slug,
                'quantity' => $extra->pivot->quantity,
                'unit_price' => $extra->pivot->unit_price,
                'pricing' => $extra->pivot->pricing,
                'total' => $extra->pivot->total,
            ])->values()->all(),
        );
    }

    public function test_later_price_changes_do_not_alter_the_reservation(): void
    {
        $this->actingAs(User::factory()->create())->postJson('/api/reservations', $this->payload())->assertCreated();

        $this->car->update(['price_per_day' => '999.00']);
        Extra::where('slug', 'gps')->update(['price' => '999.00']);

        $reference = Reservation::sole()->reference;
        $this->getJson("/api/reservations/{$reference}")
            ->assertOk()
            ->assertJsonPath('data.pricing.price_per_day', '300.00')
            ->assertJsonPath('data.pricing.extras.0.unit_price', '50.00')
            ->assertJsonPath('data.pricing.total', '1650.00');
    }

    public function test_the_rental_terms_must_be_accepted(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/reservations', $this->payload(['terms' => false]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['terms' => 'Vous devez accepter les conditions générales de location.']);
    }

    public function test_the_booking_rules_are_checked_again_on_submit(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/reservations', $this->payload(['start_at' => '2026-12-01 10:00']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['start_at' => 'La prise en charge doit avoir lieu au moins 2 heures après la réservation.']);

        $this->assertDatabaseCount('reservations', 0);
    }

    public function test_customers_who_cannot_book_get_the_reasons(): void
    {
        $user = User::factory()->withRecentLicense()->create();

        $this->actingAs($user)
            ->postJson('/api/reservations', $this->payload())
            ->assertUnprocessable()
            ->assertJsonPath('code', 'not_eligible')
            ->assertJsonPath('eligibility.eligible', false)
            ->assertJsonPath('eligibility.reasons.0.code', 'license_too_recent');

        $this->assertDatabaseCount('reservations', 0);
    }

    public function test_a_car_booked_for_overlapping_times_answers_409(): void
    {
        Reservation::factory()->for($this->car)->between('2026-12-12 18:00', '2026-12-14 10:00')->pending()->create();

        $this->actingAs(User::factory()->create())
            ->postJson('/api/reservations', $this->payload())
            ->assertStatus(409)
            ->assertExactJson([
                'message' => 'Cette voiture vient d’être réservée sur une partie de ces horaires. Choisissez d’autres dates ou une autre voiture.',
                'code' => 'car_unavailable',
            ]);

        $this->assertDatabaseCount('reservations', 1);
    }

    public function test_the_second_of_two_identical_bookings_is_refused(): void
    {
        $this->actingAs(User::factory()->create())->postJson('/api/reservations', $this->payload())->assertCreated();

        $this->actingAs(User::factory()->create())->postJson('/api/reservations', $this->payload())->assertStatus(409);

        $this->assertDatabaseCount('reservations', 1);
    }

    /**
     * Simulates another customer whose booking commits while this request waits for
     * the car row lock: the rival reservation only exists once the lock query has run,
     * so a 409 proves availability is checked again after the lock, inside the
     * transaction, and not only during validation. (SQLite ignores FOR UPDATE; on
     * MySQL the query must end with it.)
     */
    public function test_availability_is_checked_again_after_locking_the_car_row(): void
    {
        $rival = User::factory()->create();
        $lockQueries = [];

        Event::listen(QueryExecuted::class, function (QueryExecuted $query) use (&$lockQueries, $rival): void {
            $isCarLock = DB::transactionLevel() > 0
                && str_starts_with($query->sql, 'select')
                && str_contains($query->sql, '"cars"')
                && $query->bindings === [$this->car->id];

            if ($isCarLock && $lockQueries === []) {
                $lockQueries[] = $query->sql;
                Reservation::factory()->for($this->car)->for($rival)->between('2026-12-11 10:00', '2026-12-12 10:00')->create();
            }
        });

        $this->actingAs(User::factory()->create())
            ->postJson('/api/reservations', $this->payload())
            ->assertStatus(409);

        $this->assertCount(1, $lockQueries);
        if (DB::getDriverName() === 'mysql') {
            $this->assertStringEndsWith('for update', $lockQueries[0]);
        }
    }

    public function test_bookings_touching_an_existing_one_are_accepted(): void
    {
        Reservation::factory()->for($this->car)->between('2026-12-08 10:00', '2026-12-10 10:00')->confirmed()->create();

        $this->actingAs(User::factory()->create())
            ->postJson('/api/reservations', $this->payload())
            ->assertCreated();
    }
}
