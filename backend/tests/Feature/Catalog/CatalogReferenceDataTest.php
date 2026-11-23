<?php

namespace Tests\Feature\Catalog;

use App\Models\Brand;
use App\Models\Car;
use App\Models\Category;
use App\Models\Extra;
use App\Models\Location;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogReferenceDataTest extends TestCase
{
    use RefreshDatabase;

    public function test_filters_lists_the_options_with_counts_of_available_cars(): void
    {
        $suv = Category::factory()->create(['name' => 'SUV', 'slug' => 'suv', 'sort_order' => 2]);
        $eco = Category::factory()->create(['name' => 'Économique', 'slug' => 'economique', 'sort_order' => 1]);
        $dacia = Brand::factory()->create(['name' => 'Dacia', 'slug' => 'dacia']);
        $bmw = Brand::factory()->create(['name' => 'BMW', 'slug' => 'bmw']);
        $gueliz = Location::factory()->create(['slug' => 'marrakech-gueliz']);
        Location::factory()->inactive()->create(['slug' => 'fermee']);

        Car::factory()->for($suv)->for($dacia)->for($gueliz)->create(['price_per_day' => 449.50, 'seats' => 5]);
        Car::factory()->for($suv)->for($dacia)->for($gueliz)->create(['price_per_day' => 700, 'seats' => 7]);
        Car::factory()->for($suv)->for($bmw)->for($gueliz)->maintenance()->create(['price_per_day' => 2500, 'seats' => 5]);

        $this->getJson('/api/catalog/filters')
            ->assertOk()
            ->assertJsonPath('data.categories.0.slug', 'economique')
            ->assertJsonPath('data.categories.0.cars_count', 0)
            ->assertJsonPath('data.categories.1.slug', 'suv')
            ->assertJsonPath('data.categories.1.cars_count', 2)
            ->assertJsonPath('data.brands', fn (array $brands) => array_column($brands, 'slug') === ['dacia'] && $brands[0]['cars_count'] === 2)
            ->assertJsonPath('data.locations', fn (array $locations) => array_column($locations, 'slug') === ['marrakech-gueliz'])
            ->assertJsonPath('data.locations.0.cars_count', 2)
            ->assertJsonPath('data.transmissions', [['value' => 'manual', 'label' => 'Manuelle'], ['value' => 'automatic', 'label' => 'Automatique']])
            ->assertJsonPath('data.fuels.0', ['value' => 'diesel', 'label' => 'Diesel'])
            ->assertJsonPath('data.seats', [5, 7])
            ->assertJsonPath('data.price', ['min' => 449, 'max' => 700]);
    }

    public function test_categories_are_listed_in_display_order_with_available_car_counts(): void
    {
        $suv = Category::factory()->create(['slug' => 'suv', 'sort_order' => 2]);
        Category::factory()->create(['slug' => 'economique', 'sort_order' => 1]);
        Car::factory()->for($suv)->create();
        Car::factory()->for($suv)->maintenance()->create();

        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonPath('data.0.slug', 'economique')
            ->assertJsonPath('data.1.slug', 'suv')
            ->assertJsonPath('data.1.cars_count', 1);
    }

    public function test_locations_lists_the_active_ones_with_their_hours(): void
    {
        Location::factory()->airport()->create(['slug' => 'agadir-al-massira', 'city' => 'Agadir']);
        Location::factory()->inactive()->create(['slug' => 'fermee']);

        $this->getJson('/api/locations')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', 'agadir-al-massira')
            ->assertJsonPath('data.0.type_label', 'Aéroport')
            ->assertJsonPath('data.0.opening_hours', 'Tous les jours, 07:00 – 23:00');
    }

    public function test_extras_lists_the_active_ones(): void
    {
        Extra::factory()->create(['slug' => 'gps', 'price' => 50]);
        Extra::factory()->perRental()->create(['slug' => 'conducteur-supplementaire', 'price' => 150]);
        Extra::factory()->inactive()->create(['slug' => 'ancien']);

        $this->getJson('/api/extras')
            ->assertOk()
            ->assertJsonPath('data', fn (array $extras) => array_column($extras, 'slug') === ['gps', 'conducteur-supplementaire'])
            ->assertJsonPath('data.1.pricing_label', 'Par location')
            ->assertJsonPath('data.0.price', '50.00');
    }

    public function test_catalog_endpoints_allow_60_requests_per_minute(): void
    {
        for ($request = 1; $request <= 60; $request++) {
            $this->getJson('/api/categories')->assertOk();
        }

        $this->getJson('/api/categories')
            ->assertTooManyRequests()
            ->assertJsonPath('message', 'Trop de requêtes. Veuillez réessayer dans quelques instants.');
    }
}
