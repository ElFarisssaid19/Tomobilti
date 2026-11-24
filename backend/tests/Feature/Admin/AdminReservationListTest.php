<?php

namespace Tests\Feature\Admin;

use App\Models\Brand;
use App\Models\Car;
use App\Models\Location;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminReservationListTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-01 09:00');
        $this->admin = User::factory()->admin()->create();
    }

    public function test_tabs_with_their_counts(): void
    {
        $pendingLater = Reservation::factory()->between('2026-12-20 10:00', '2026-12-22 10:00')->pending()->create();
        $pendingSoon = Reservation::factory()->between('2026-12-05 10:00', '2026-12-07 10:00')->pending()->create();
        $pickupToday = Reservation::factory()->between('2026-12-01 14:00', '2026-12-04 10:00')->confirmed()->create();
        $active = Reservation::factory()->between('2026-11-29 10:00', '2026-12-01 18:00')->active()->create();
        Reservation::factory()->between('2026-12-01 10:00', '2026-12-03 10:00')->cancelled()->create();

        $this->actingAs($this->admin)->getJson('/api/admin/reservations')
            ->assertOk()
            ->assertJsonPath('meta.tab', 'pending')
            ->assertJsonPath('meta.counts', ['pending' => 2, 'today' => 2, 'active' => 1, 'all' => 5])
            ->assertJsonPath('data.*.reference', [$pendingSoon->reference, $pendingLater->reference]);

        $this->actingAs($this->admin)->getJson('/api/admin/reservations?tab=today')
            ->assertJsonPath('data.*.reference', [$active->reference, $pickupToday->reference]);

        $this->actingAs($this->admin)->getJson('/api/admin/reservations?tab=active')
            ->assertJsonPath('data.*.reference', [$active->reference]);
    }

    public function test_filters_and_sort(): void
    {
        $agency = Location::factory()->create();
        $client = User::factory()->create(['name' => 'Salma Bennani', 'phone' => '+212661234567']);
        $match = Reservation::factory()->for($client)->between('2026-12-10 10:00', '2026-12-12 10:00')->confirmed()
            ->create(['return_location_id' => $agency->id]);
        Reservation::factory()->between('2026-12-10 10:00', '2026-12-12 10:00')->confirmed()->create();
        Reservation::factory()->for($client)->between('2027-01-10 10:00', '2027-01-12 10:00')->pending()->create();

        $query = http_build_query([
            'tab' => 'all', 'status' => 'confirmed,active', 'from' => '2026-12-12', 'to' => '2026-12-31',
            'q' => 'bennani', 'location' => $agency->id, 'car' => $match->car_id,
        ]);

        $this->actingAs($this->admin)->getJson("/api/admin/reservations?{$query}")
            ->assertOk()
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.reference', $match->reference)
            ->assertJsonPath('data.0.client.name', 'Salma Bennani');

        $this->actingAs($this->admin)->getJson('/api/admin/reservations?tab=all&q=0661234567')->assertJsonPath('meta.total', 2);
        $this->actingAs($this->admin)->getJson("/api/admin/reservations?tab=all&q={$match->reference}")->assertJsonPath('meta.total', 1);
        $this->actingAs($this->admin)->getJson('/api/admin/reservations?tab=all&sort=total&direction=sideways')->assertJsonValidationErrors('direction');
        $this->actingAs($this->admin)->getJson('/api/admin/reservations?from=2026-12-10&to=2026-12-01')->assertJsonValidationErrors('to');
    }

    public function test_detail_has_client_car_pricing_and_history(): void
    {
        $reservation = Reservation::factory()->between('2026-12-10 10:00', '2026-12-12 10:00')->pending()->create(['customer_notes' => 'Vol AT 405']);
        $reservation->statusHistories()->create(['from_status' => null, 'to_status' => 'pending', 'user_id' => $reservation->user_id, 'created_at' => now()]);

        $this->actingAs($this->admin)->getJson("/api/admin/reservations/{$reservation->reference}")
            ->assertOk()
            ->assertJsonPath('data.client.email', $reservation->user->email)
            ->assertJsonPath('data.car.plate_number', $reservation->car->plate_number)
            ->assertJsonPath('data.pricing.total', $reservation->total)
            ->assertJsonPath('data.customer_notes', 'Vol AT 405')
            ->assertJsonPath('data.history.0.from_status', null)
            ->assertJsonPath('data.history.0.to_status', 'pending')
            ->assertJsonPath('data.history.0.author.role', 'client');
    }

    public function test_csv_export_of_the_filtered_list_opens_in_excel_with_accents(): void
    {
        $car = Car::factory()->for(Brand::factory()->create(['name' => 'Citroën']))->create(['model' => 'C3', 'year' => 2024, 'plate_number' => '12345-A-6']);
        $client = User::factory()->create(['name' => 'Leïla Benali']);
        Reservation::factory()->for($car)->for($client)->between('2026-12-10 10:00', '2026-12-12 10:00')->confirmed()->create([
            'price_per_day' => '300.50', 'total' => '601.00',
        ]);
        Reservation::factory()->between('2026-12-10 10:00', '2026-12-12 10:00')->pending()->create();

        $response = $this->actingAs($this->admin)->get('/api/admin/reservations/export?tab=all&status=confirmed')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/csv; charset=UTF-8')
            ->assertDownload('reservations-2026-12-01.csv');

        $csv = $response->streamedContent();
        $this->assertStringStartsWith("\u{FEFF}Référence;", $csv);

        $lines = array_values(array_filter(explode("\n", substr($csv, 3))));
        $this->assertSame(
            ['Référence', 'Statut', 'Client', 'E-mail', 'Téléphone', 'Voiture', 'Immatriculation', 'Agence de départ', 'Agence de retour', 'Début', 'Fin', 'Jours', 'Options (DH)', 'Frais aller simple (DH)', 'Total TTC (DH)', 'Créée le'],
            str_getcsv($lines[0], ';', escape: ''),
        );
        $this->assertCount(2, $lines);
        $row = str_getcsv($lines[1], ';', escape: '');
        $this->assertSame('Confirmée', $row[1]);
        $this->assertSame('Leïla Benali', $row[2]);
        $this->assertSame('Citroën C3 2024', $row[5]);
        $this->assertSame('10/12/2026 10:00', $row[9]);
        $this->assertSame('601,00', $row[14]);
    }

    public function test_planning_lists_every_car_with_its_reservations_in_the_range(): void
    {
        $car = Car::factory()->create();
        $idle = Car::factory()->create();
        $removedWithBooking = Car::factory()->create();
        Car::factory()->create()->delete();
        $inRange = Reservation::factory()->for($car)->between('2026-11-30 10:00', '2026-12-03 10:00')->active()->create();
        Reservation::factory()->for($car)->between('2026-12-05 10:00', '2026-12-06 10:00')->rejected()->create();
        Reservation::factory()->for($car)->between('2027-01-05 10:00', '2027-01-06 10:00')->confirmed()->create();
        Reservation::factory()->for($removedWithBooking)->between('2026-12-08 10:00', '2026-12-09 10:00')->completed()->create();
        $removedWithBooking->delete();

        $response = $this->actingAs($this->admin)->getJson('/api/admin/planning?from=2026-12-01&to=2026-12-14')
            ->assertOk()
            ->assertJsonPath('data.from', '2026-12-01')
            ->assertJsonPath('data.to', '2026-12-14')
            ->assertJsonCount(3, 'data.cars');

        $cars = collect($response->json('data.cars'))->keyBy('id');
        $this->assertSame([$inRange->reference], array_column($cars[$car->id]['reservations'], 'reference'));
        $this->assertSame([], $cars[$idle->id]['reservations']);
        $this->assertTrue($cars[$removedWithBooking->id]['is_deleted']);
    }

    public function test_planning_covers_31_days_at_most(): void
    {
        $this->actingAs($this->admin)->getJson('/api/admin/planning?from=2026-12-01&to=2026-12-31')->assertOk();

        $this->actingAs($this->admin)->getJson('/api/admin/planning?from=2026-12-01&to=2027-01-01')
            ->assertUnprocessable()
            ->assertJsonPath('errors.to.0', 'Le planning couvre au maximum 31 jours.');

        $this->actingAs($this->admin)->getJson('/api/admin/planning')
            ->assertOk()
            ->assertJsonPath('data.from', '2026-11-30')
            ->assertJsonPath('data.to', '2026-12-13');
    }
}
