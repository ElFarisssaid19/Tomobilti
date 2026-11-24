<?php

namespace Tests\Feature\Admin;

use App\Enums\CarStatus;
use App\Models\Brand;
use App\Models\Car;
use App\Models\Category;
use App\Models\Location;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCarTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private Brand $renault;

    protected function setUp(): void
    {
        parent::setUp();

        $this->travelTo('2026-12-01 09:00');
        $this->admin = User::factory()->admin()->create();
        $this->renault = Brand::factory()->create(['name' => 'Renault']);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(array $overrides = []): array
    {
        return [
            'brand_id' => $this->renault->id,
            'category_id' => Category::factory()->create()->id,
            'location_id' => Location::factory()->create()->id,
            'model' => 'Clio 5',
            'year' => 2025,
            'plate_number' => '12345 a 6',
            'color' => 'Bleu',
            'transmission' => 'automatic',
            'fuel' => 'petrol',
            'seats' => 5,
            'doors' => 5,
            'luggage' => 2,
            'air_conditioning' => true,
            'mileage' => 12000,
            'price_per_day' => '330.00',
            'deposit_amount' => '6000',
            'status' => 'available',
            'description' => 'Citadine automatique.',
            'is_featured' => false,
            ...$overrides,
        ];
    }

    public function test_creates_a_car_with_a_normalized_plate_and_a_generated_slug(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/admin/cars', $this->payload())
            ->assertCreated()
            ->assertJsonPath('message', 'Voiture ajoutée à la flotte.')
            ->assertJsonPath('data.slug', 'renault-clio-5-2025')
            ->assertJsonPath('data.plate_number', '12345-A-6')
            ->assertJsonPath('data.name', 'Renault Clio 5')
            ->assertJsonPath('data.status', 'available');

        $this->assertDatabaseHas('cars', ['slug' => 'renault-clio-5-2025', 'plate_number' => '12345-A-6', 'price_per_day' => '330.00']);
    }

    public function test_the_slug_stays_unique_even_against_removed_cars(): void
    {
        Car::factory()->create(['slug' => 'renault-clio-5-2025'])->delete();

        $this->actingAs($this->admin)
            ->postJson('/api/admin/cars', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.slug', 'renault-clio-5-2025-2');
    }

    public function test_plate_must_follow_the_moroccan_format_and_be_unique(): void
    {
        Car::factory()->create(['plate_number' => '12345-A-6']);

        $this->actingAs($this->admin)
            ->postJson('/api/admin/cars', $this->payload(['plate_number' => '12345-a-6']))
            ->assertUnprocessable()
            ->assertJsonPath('errors.plate_number.0', 'Cette immatriculation est déjà utilisée par une autre voiture.');

        foreach (['AB-123-CD', '123456-A-6', '12345-A-90', '12345-A-0', '12345-6'] as $plate) {
            $this->actingAs($this->admin)
                ->postJson('/api/admin/cars', $this->payload(['plate_number' => $plate]))
                ->assertUnprocessable()
                ->assertJsonPath('errors.plate_number.0', 'Saisissez une immatriculation marocaine valide, par exemple 12345-A-6.');
        }
    }

    public function test_required_fields_get_french_messages(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/admin/cars', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['brand_id', 'model', 'year', 'plate_number', 'price_per_day', 'status'])
            ->assertJsonPath('errors.model.0', 'Le champ modèle est obligatoire.');
    }

    public function test_updating_the_model_or_year_renews_the_slug_but_never_the_status(): void
    {
        $car = Car::factory()->for($this->renault)->create(['model' => 'Clio 5', 'year' => 2024, 'slug' => 'renault-clio-5-2024', 'plate_number' => '11111-B-40']);

        $this->actingAs($this->admin)
            ->putJson("/api/admin/cars/{$car->id}", $this->payload(['year' => 2025, 'plate_number' => '11111-B-40', 'status' => 'maintenance']))
            ->assertOk()
            ->assertJsonPath('message', 'Voiture enregistrée.')
            ->assertJsonPath('data.slug', 'renault-clio-5-2025')
            ->assertJsonPath('data.status', 'available');
    }

    public function test_lists_with_search_filters_and_sort(): void
    {
        $clio = Car::factory()->for($this->renault)->create(['model' => 'Clio', 'price_per_day' => 300, 'plate_number' => '22222-A-6']);
        $kangoo = Car::factory()->for($this->renault)->maintenance()->create(['model' => 'Kangoo', 'price_per_day' => 400]);
        $removed = Car::factory()->for($this->renault)->create(['model' => 'Megane']);
        $removed->delete();
        Car::factory()->create(['model' => 'Duster']);

        $this->actingAs($this->admin)->getJson('/api/admin/cars?q=renault&sort=price_per_day&direction=desc')
            ->assertOk()
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('data.0.id', $kangoo->id)
            ->assertJsonPath('data.1.id', $clio->id);

        $this->actingAs($this->admin)->getJson('/api/admin/cars?q=22222')->assertJsonPath('data.0.id', $clio->id)->assertJsonPath('meta.total', 1);
        $this->actingAs($this->admin)->getJson('/api/admin/cars?status=maintenance')->assertJsonPath('meta.total', 1);
        $this->actingAs($this->admin)->getJson("/api/admin/cars?brand={$this->renault->id}&deleted=with")->assertJsonPath('meta.total', 3);
        $this->actingAs($this->admin)->getJson('/api/admin/cars?deleted=only')
            ->assertJsonPath('meta.total', 1)
            ->assertJsonPath('data.0.is_deleted', true);
    }

    public function test_removing_a_car_is_blocked_by_upcoming_or_current_reservations(): void
    {
        $car = Car::factory()->create();
        $reservation = Reservation::factory()->for($car)->between('2026-12-10 10:00', '2026-12-12 10:00')->confirmed()->create();
        Reservation::factory()->for($car)->between('2026-11-01 10:00', '2026-11-03 10:00')->completed()->create();

        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/cars/{$car->id}")
            ->assertConflict()
            ->assertJsonPath('code', 'car_has_reservations')
            ->assertJsonPath('message', "Impossible de retirer cette voiture : elle a une réservation à venir ou en cours ({$reservation->reference}). Annulez-la ou attendez qu’elle soit terminée.")
            ->assertJsonPath('reservations.0.reference', $reservation->reference);

        $this->assertNotSoftDeleted($car);
    }

    public function test_removes_and_restores_a_car(): void
    {
        $car = Car::factory()->create();
        Reservation::factory()->for($car)->between('2026-11-01 10:00', '2026-11-03 10:00')->completed()->create();

        $this->actingAs($this->admin)->deleteJson("/api/admin/cars/{$car->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Voiture retirée de la flotte.');
        $this->assertSoftDeleted($car);
        $this->getJson("/api/cars/{$car->slug}")->assertNotFound();

        $this->actingAs($this->admin)->getJson("/api/admin/cars/{$car->id}")->assertOk()->assertJsonPath('data.is_deleted', true);

        $this->actingAs($this->admin)->postJson("/api/admin/cars/{$car->id}/restore")
            ->assertOk()
            ->assertJsonPath('data.is_deleted', false);
        $this->assertNotSoftDeleted($car);
    }

    public function test_status_change_lists_the_affected_reservations_and_needs_force(): void
    {
        $car = Car::factory()->create();
        $pending = Reservation::factory()->for($car)->between('2026-12-05 10:00', '2026-12-07 10:00')->pending()->create();
        $confirmed = Reservation::factory()->for($car)->between('2026-12-10 10:00', '2026-12-12 10:00')->confirmed()->create();
        Reservation::factory()->for($car)->between('2026-12-20 10:00', '2026-12-22 10:00')->cancelled()->create();

        $this->actingAs($this->admin)->getJson("/api/admin/cars/{$car->id}/status-conflicts")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.reference', $pending->reference);

        $this->actingAs($this->admin)
            ->patchJson("/api/admin/cars/{$car->id}/status", ['status' => 'maintenance'])
            ->assertConflict()
            ->assertJsonPath('code', 'status_conflicts')
            ->assertJsonPath('message', '2 réservations à venir ou en cours concernent cette voiture. Vérifiez-les avant de changer le statut.')
            ->assertJsonPath('reservations.1.reference', $confirmed->reference);
        $this->assertSame(CarStatus::Available, $car->refresh()->status);

        $this->actingAs($this->admin)
            ->patchJson("/api/admin/cars/{$car->id}/status", ['status' => 'maintenance', 'force' => true])
            ->assertOk()
            ->assertJsonPath('data.status', 'maintenance')
            ->assertJsonCount(2, 'affected_reservations');
        $this->assertSame(CarStatus::Maintenance, $car->refresh()->status);
        $this->getJson("/api/cars/{$car->slug}")->assertNotFound();

        $this->actingAs($this->admin)
            ->patchJson("/api/admin/cars/{$car->id}/status", ['status' => 'available'])
            ->assertOk()
            ->assertJsonPath('data.status', 'available');
        $this->getJson("/api/cars/{$car->slug}")->assertOk();
    }
}
