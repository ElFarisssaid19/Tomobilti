<?php

namespace Tests\Feature\Catalog;

use App\Enums\CarStatus;
use App\Models\Car;
use App\Models\Category;
use App\Models\Location;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class CatalogCacheTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_filters_are_cached_until_the_agency_changes_a_car(): void
    {
        $category = Category::factory()->create(['slug' => 'suv']);
        $cars = Car::factory()->for($category)->count(2)->create();

        $this->getJson('/api/catalog/filters')->assertJsonPath('data.categories.0.cars_count', 2);

        // Plain JSON data is cached (a database or Redis store serializes it), no objects.
        $cached = Cache::get('catalog:filters');
        $this->assertSame(json_decode(json_encode($cached), true), $cached);

        // A write that fires no model event (mass update) does not reach the cached answer.
        Car::query()->whereKey($cars[0]->id)->update(['status' => CarStatus::Maintenance]);
        $this->getJson('/api/catalog/filters')->assertJsonPath('data.categories.0.cars_count', 2);

        // Plain JSON data is cached (a database or Redis store serializes it), no objects.
        $cached = Cache::get('catalog:filters');
        $this->assertSame(json_decode(json_encode($cached), true), $cached);

        // The admin changing a car's status clears it.
        $this->actingAs(User::factory()->admin()->create())
            ->patchJson("/api/admin/cars/{$cars[1]->id}/status", ['status' => 'maintenance', 'force' => true])
            ->assertOk();
        $this->getJson('/api/catalog/filters')->assertJsonPath('data.categories.0.cars_count', 0);
    }

    public function test_categories_and_agencies_are_refreshed_after_a_change(): void
    {
        $category = Category::factory()->create(['name' => 'SUV']);
        $agency = Location::factory()->create(['name' => 'Guéliz']);

        $this->getJson('/api/categories')->assertJsonPath('data.0.name', 'SUV');
        $this->getJson('/api/locations')->assertJsonPath('data.0.name', 'Guéliz');

        $category->update(['name' => 'Tout-terrain']);
        $agency->update(['is_active' => false]);

        $this->getJson('/api/categories')->assertJsonPath('data.0.name', 'Tout-terrain');
        $this->getJson('/api/locations')->assertJsonCount(0, 'data');
    }
}
