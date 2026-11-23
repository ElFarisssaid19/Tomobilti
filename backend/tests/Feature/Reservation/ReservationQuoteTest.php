<?php

namespace Tests\Feature\Reservation;

use App\Models\Car;
use App\Models\Extra;
use App\Models\Location;
use App\Models\Reservation;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class ReservationQuoteTest extends TestCase
{
    use RefreshDatabase;

    private Car $car;

    private Location $otherAgency;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-01 09:00');
        $agency = Location::factory()->create(['slug' => 'marrakech-gueliz', 'name' => 'Marrakech Guéliz']);
        $this->otherAgency = Location::factory()->create(['slug' => 'agadir', 'name' => 'Agadir Al Massira']);
        $this->car = Car::factory()->for($agency)->create(['slug' => 'clio', 'price_per_day' => '300.00', 'deposit_amount' => '5000.00']);
        Extra::factory()->create(['slug' => 'gps', 'name' => 'GPS', 'price' => '50.00', 'max_quantity' => 1]);
        Extra::factory()->create(['slug' => 'siege-bebe', 'name' => 'Siège bébé', 'price' => '40.00', 'max_quantity' => 2]);
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
            'end_at' => '2026-12-13 12:00',
            'pickup_location' => 'marrakech-gueliz',
            'return_location' => 'agadir',
            'extras' => [['slug' => 'gps', 'quantity' => 1], ['slug' => 'siege-bebe', 'quantity' => 2]],
            ...$overrides,
        ];
    }

    public function test_guests_get_the_full_price_breakdown_computed_by_the_server(): void
    {
        $this->postJson('/api/reservations/quote', $this->payload(['total' => '1.00', 'price_per_day' => '1.00']))
            ->assertOk()
            ->assertJsonPath('data.car.slug', 'clio')
            ->assertJsonPath('data.start_at', CarbonImmutable::parse('2026-12-10 10:00')->toIso8601String())
            ->assertJsonPath('data.pickup_location.name', 'Marrakech Guéliz')
            ->assertJsonPath('data.return_location.name', 'Agadir Al Massira')
            ->assertJsonPath('data.available', true)
            ->assertJsonPath('data.unavailable_message', null)
            ->assertJsonPath('data.eligibility', null)
            ->assertJsonPath('data.can_book', false)
            ->assertJsonPath('data.pricing', [
                // 10/12 10:00 → 13/12 12:00 = 74 hours = 4 billed days.
                'days' => 4,
                'price_per_day' => '300.00',
                'car_total' => '1200.00',
                'extras' => [
                    ['slug' => 'gps', 'name' => 'GPS', 'pricing' => 'per_day', 'pricing_label' => 'Par jour', 'unit_price' => '50.00', 'quantity' => 1, 'total' => '200.00'],
                    ['slug' => 'siege-bebe', 'name' => 'Siège bébé', 'pricing' => 'per_day', 'pricing_label' => 'Par jour', 'unit_price' => '40.00', 'quantity' => 2, 'total' => '320.00'],
                ],
                'extras_total' => '520.00',
                'fees' => [['code' => 'one_way', 'label' => 'Frais de retour dans une autre agence', 'amount' => '300.00']],
                'fees_total' => '300.00',
                'total' => '2020.00',
                'deposit_amount' => '5000.00',
            ]);
    }

    public function test_signed_in_customers_also_get_their_eligibility(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/reservations/quote', $this->payload())
            ->assertOk()
            ->assertJsonPath('data.eligibility', ['eligible' => true, 'reasons' => [], 'missing_fields' => []])
            ->assertJsonPath('data.can_book', true);
    }

    public function test_customers_who_cannot_book_yet_see_why(): void
    {
        $this->actingAs(User::factory()->withoutLicense()->create())
            ->postJson('/api/reservations/quote', $this->payload())
            ->assertOk()
            ->assertJsonPath('data.eligibility.eligible', false)
            ->assertJsonPath('data.eligibility.missing_fields', ['driving_license_number', 'driving_license_issued_at'])
            ->assertJsonPath('data.can_book', false);
    }

    public function test_tells_when_the_car_is_already_booked_for_overlapping_times(): void
    {
        Reservation::factory()->for($this->car)->between('2026-12-12 10:00', '2026-12-15 10:00')->confirmed()->create();

        $this->actingAs(User::factory()->create())
            ->postJson('/api/reservations/quote', $this->payload())
            ->assertOk()
            ->assertJsonPath('data.available', false)
            ->assertJsonPath('data.unavailable_message', 'Cette voiture est déjà réservée sur une partie de ces horaires. Choisissez d’autres dates ou une autre voiture.')
            ->assertJsonPath('data.can_book', false);
    }

    public function test_a_return_exactly_when_the_next_booking_starts_does_not_overlap(): void
    {
        Reservation::factory()->for($this->car)->between('2026-12-13 12:00', '2026-12-15 10:00')->confirmed()->create();

        $this->postJson('/api/reservations/quote', $this->payload())
            ->assertOk()
            ->assertJsonPath('data.available', true);
    }

    public function test_every_field_is_required(): void
    {
        $this->postJson('/api/reservations/quote', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'car' => 'Le champ voiture est obligatoire.',
                'start_at' => 'Le champ date de prise en charge est obligatoire.',
                'end_at' => 'Le champ date de restitution est obligatoire.',
                'pickup_location' => 'Le champ agence de prise en charge est obligatoire.',
                'return_location' => 'Le champ agence de restitution est obligatoire.',
            ]);
    }

    /**
     * @return array<string, array{array<string, mixed>, string, string}>
     */
    public static function invalidBookings(): array
    {
        $slot = 'Choisissez une heure entre 08:00 et 20:00, par tranche de 30 minutes.';

        return [
            'pick-up before opening' => [['start_at' => '2026-12-10 07:30'], 'start_at', $slot],
            'return after closing' => [['end_at' => '2026-12-13 20:30'], 'end_at', $slot],
            'time outside a 30-minute slot' => [['start_at' => '2026-12-10 10:15'], 'start_at', $slot],
            'pick-up in the past' => [['start_at' => '2026-11-30 10:00'], 'start_at', 'La date de prise en charge est déjà passée.'],
            'pick-up in less than 2 hours' => [['start_at' => '2026-12-01 10:30'], 'start_at', 'La prise en charge doit avoir lieu au moins 2 heures après la réservation.'],
            'pick-up more than 6 months ahead' => [['start_at' => '2027-06-02 10:00', 'end_at' => '2027-06-05 10:00'], 'start_at', 'Vous pouvez réserver au maximum 6 mois à l’avance.'],
            'longer than 30 days' => [['end_at' => '2027-01-09 10:30'], 'end_at', 'La location ne peut pas dépasser 30 jours.'],
            'return before pick-up' => [['end_at' => '2026-12-09 10:00'], 'end_at', 'La restitution doit avoir lieu après la prise en charge.'],
            'wrong date format' => [['start_at' => '10/12/2026 10:00'], 'start_at', 'Indiquez la date et l’heure au format AAAA-MM-JJ HH:MM.'],
            'unknown agency' => [['return_location' => 'tanger'], 'return_location', 'Choisissez une de nos agences.'],
            'too many of an extra' => [['extras' => [['slug' => 'siege-bebe', 'quantity' => 3]]], 'extras.0.quantity', 'Vous pouvez prendre au maximum 2 « Siège bébé ».'],
            'unknown extra' => [['extras' => [['slug' => 'jet-ski', 'quantity' => 1]]], 'extras.0.slug', 'Cette option n’est pas disponible.'],
            'same extra twice' => [['extras' => [['slug' => 'gps', 'quantity' => 1], ['slug' => 'gps', 'quantity' => 1]]], 'extras.0.slug', 'Chaque option ne peut être choisie qu’une fois.'],
        ];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    #[DataProvider('invalidBookings')]
    public function test_refuses_bookings_that_break_the_rules(array $overrides, string $field, string $message): void
    {
        $this->postJson('/api/reservations/quote', $this->payload($overrides))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([$field => $message]);
    }

    public function test_a_30_day_rental_returning_at_closing_time_is_accepted(): void
    {
        $this->postJson('/api/reservations/quote', $this->payload(['start_at' => '2026-12-10 20:00', 'end_at' => '2027-01-09 20:00']))
            ->assertOk()
            ->assertJsonPath('data.pricing.days', 30);
    }

    public function test_cars_that_cannot_be_rented_and_inactive_options_are_refused(): void
    {
        Car::factory()->maintenance()->create(['slug' => 'duster']);
        Extra::factory()->inactive()->create(['slug' => 'wifi']);
        Location::factory()->inactive()->create(['slug' => 'fermee']);

        $this->postJson('/api/reservations/quote', $this->payload([
            'car' => 'duster',
            'pickup_location' => 'fermee',
            'extras' => [['slug' => 'wifi', 'quantity' => 1]],
        ]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'car' => 'Cette voiture n’est pas disponible à la location.',
                'pickup_location' => 'Choisissez une de nos agences.',
                'extras.0.slug' => 'Cette option n’est pas disponible.',
            ]);
    }
}
