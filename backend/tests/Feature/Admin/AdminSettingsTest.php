<?php

namespace Tests\Feature\Admin;

use App\Models\Brand;
use App\Models\Car;
use App\Models\Category;
use App\Models\Extra;
use App\Models\Location;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSettingsTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->admin()->create();
    }

    public function test_category_crud_with_a_generated_slug(): void
    {
        Category::factory()->create(['name' => 'SUV', 'slug' => 'suv', 'sort_order' => 5]);

        $id = $this->actingAs($this->admin)
            ->postJson('/api/admin/categories', ['name' => 'SUV premium', 'description' => 'Grands SUV.', 'icon' => 'mountain', 'sort_order' => 4])
            ->assertCreated()
            ->assertJsonPath('message', 'Catégorie ajoutée.')
            ->assertJsonPath('data.slug', 'suv-premium')
            ->json('data.id');

        $this->actingAs($this->admin)
            ->putJson("/api/admin/categories/{$id}", ['name' => 'SUV haut de gamme', 'icon' => 'Mountain!', 'sort_order' => 4])
            ->assertUnprocessable()
            ->assertJsonPath('errors.icon.0', 'Saisissez un nom d’icône lucide en minuscules, par exemple car-front.');

        $this->actingAs($this->admin)
            ->putJson("/api/admin/categories/{$id}", ['name' => 'SUV haut de gamme', 'icon' => 'car-front', 'sort_order' => 2])
            ->assertOk()
            ->assertJsonPath('data.name', 'SUV haut de gamme')
            ->assertJsonPath('data.slug', 'suv-premium');

        $this->actingAs($this->admin)->postJson('/api/admin/categories', ['name' => 'SUV', 'sort_order' => 1])->assertJsonValidationErrors('name');

        $this->actingAs($this->admin)->getJson('/api/admin/categories')
            ->assertOk()
            ->assertJsonPath('data.0.name', 'SUV haut de gamme')
            ->assertJsonPath('data.0.cars_count', 0);

        $this->actingAs($this->admin)->deleteJson("/api/admin/categories/{$id}")->assertOk()->assertJsonPath('message', 'Catégorie supprimée.');
        $this->assertDatabaseMissing('categories', ['id' => $id]);
    }

    public function test_a_category_or_brand_used_by_a_car_cannot_be_deleted_even_a_removed_one(): void
    {
        $car = Car::factory()->create();
        $car->delete();

        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/categories/{$car->category_id}")
            ->assertConflict()
            ->assertExactJson(['message' => 'Cette catégorie est utilisée par une voiture. Changez sa catégorie avant de la supprimer.', 'code' => 'in_use']);

        Car::factory()->count(2)->for($car->brand)->create();

        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/brands/{$car->brand_id}")
            ->assertConflict()
            ->assertJsonPath('message', 'Cette marque est utilisée par 3 voitures. Changez leur marque avant de la supprimer.');

        $this->assertModelExists($car->category);
        $this->assertModelExists($car->brand);
    }

    public function test_brand_crud(): void
    {
        $id = $this->actingAs($this->admin)->postJson('/api/admin/brands', ['name' => 'Škoda'])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'skoda')
            ->json('data.id');

        $this->actingAs($this->admin)->putJson("/api/admin/brands/{$id}", ['name' => 'Skoda'])->assertOk()->assertJsonPath('data.name', 'Skoda');
        $this->actingAs($this->admin)->deleteJson("/api/admin/brands/{$id}")->assertOk();
        $this->assertDatabaseMissing('brands', ['id' => $id]);
    }

    public function test_location_crud_normalizes_the_phone(): void
    {
        $payload = [
            'name' => 'Rabat Agdal', 'type' => 'agency', 'city' => 'Rabat', 'address' => '12, Avenue de France',
            'phone' => '05 37 00 00 00', 'opening_hours' => 'Lun – Sam, 08:30 – 19:30', 'is_active' => true,
        ];

        $id = $this->actingAs($this->admin)->postJson('/api/admin/locations', $payload)
            ->assertCreated()
            ->assertJsonPath('data.phone', '+212537000000')
            ->assertJsonPath('data.slug', 'rabat-agdal')
            ->json('data.id');

        $this->actingAs($this->admin)->putJson("/api/admin/locations/{$id}", [...$payload, 'phone' => '123'])->assertJsonValidationErrors('phone');
        $this->actingAs($this->admin)->putJson("/api/admin/locations/{$id}", [...$payload, 'is_active' => false])->assertOk()->assertJsonPath('data.is_active', false);
        $this->getJson('/api/locations')->assertJsonMissing(['slug' => 'rabat-agdal']);

        $this->actingAs($this->admin)->deleteJson("/api/admin/locations/{$id}")->assertOk();
    }

    public function test_a_location_with_cars_or_reservations_must_be_deactivated_instead(): void
    {
        $withCar = Car::factory()->create()->location;
        $returnOnly = Location::factory()->create();
        Reservation::factory()->create(['return_location_id' => $returnOnly->id]);

        foreach ([$withCar, $returnOnly] as $location) {
            $this->actingAs($this->admin)
                ->deleteJson("/api/admin/locations/{$location->id}")
                ->assertConflict()
                ->assertJsonPath('message', 'Cette agence est utilisée par des voitures ou des réservations : désactivez-la plutôt.');
        }
    }

    public function test_extra_crud_and_booked_extras_cannot_be_deleted(): void
    {
        $payload = ['name' => 'Chaînes neige', 'description' => 'Pour l’Atlas.', 'icon' => 'mountain', 'price' => '40', 'pricing' => 'per_day', 'max_quantity' => 1, 'is_active' => true];

        $id = $this->actingAs($this->admin)->postJson('/api/admin/extras', $payload)
            ->assertCreated()
            ->assertJsonPath('data.slug', 'chaines-neige')
            ->assertJsonPath('data.price', '40.00')
            ->json('data.id');

        $this->actingAs($this->admin)->putJson("/api/admin/extras/{$id}", [...$payload, 'max_quantity' => 0])->assertJsonValidationErrors('max_quantity');
        $this->actingAs($this->admin)->deleteJson("/api/admin/extras/{$id}")->assertOk();

        $booked = Extra::factory()->create();
        $reservation = Reservation::factory()->create();
        $reservation->extras()->attach($booked->id, ['quantity' => 1, 'unit_price' => $booked->price, 'pricing' => $booked->pricing, 'total' => $booked->price]);

        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/extras/{$booked->id}")
            ->assertConflict()
            ->assertJsonPath('message', 'Cette option a déjà été réservée : désactivez-la plutôt.');

        $this->actingAs($this->admin)->getJson('/api/admin/extras')->assertJsonPath('data.0.reservations_count', 1);
    }

    public function test_settings_are_found_by_id(): void
    {
        $brand = Brand::factory()->create(['slug' => 'dacia']);

        $this->actingAs($this->admin)->putJson('/api/admin/brands/dacia', ['name' => 'Dacia'])->assertNotFound();
        $this->actingAs($this->admin)->putJson("/api/admin/brands/{$brand->id}", ['name' => 'Dacia'])->assertOk();
    }
}
