<?php

namespace Tests\Feature\Catalog;

use App\Models\Car;
use App\Models\CarImage;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CarShowTest extends TestCase
{
    use RefreshDatabase;

    public function test_shows_an_available_car_with_every_photo_and_its_credits(): void
    {
        $car = Car::factory()->create(['slug' => 'dacia-logan-2024', 'deposit_amount' => 5000, 'description' => 'Idéale pour la ville.']);
        CarImage::factory()->for($car)->create(['path' => 'cars/dacia-logan-2024/02-arriere-1600.webp', 'sort_order' => 1]);
        CarImage::factory()->primary()->for($car)->create([
            'path' => 'cars/dacia-logan-2024/01-avant-1600.webp',
            'alt' => 'Dacia Logan 2024, vue avant',
            'author' => 'ROCostiTheBunnyCZ',
            'license' => 'CC BY-SA 4.0',
            'source_url' => 'https://commons.wikimedia.org/wiki/File:Dacia_Logan.jpg',
        ]);

        $this->getJson('/api/cars/dacia-logan-2024')
            ->assertOk()
            ->assertJsonPath('data.slug', 'dacia-logan-2024')
            ->assertJsonPath('data.deposit_amount', '5000.00')
            ->assertJsonPath('data.description', 'Idéale pour la ville.')
            ->assertJsonPath('data.location.opening_hours', $car->location->opening_hours)
            ->assertJsonCount(2, 'data.images')
            ->assertJsonPath('data.images.0.url', 'http://localhost:8000/storage/cars/dacia-logan-2024/01-avant-1600.webp')
            ->assertJsonPath('data.images.0.thumbnail_url', 'http://localhost:8000/storage/cars/dacia-logan-2024/01-avant-800.webp')
            ->assertJsonPath('data.images.0.alt', 'Dacia Logan 2024, vue avant')
            ->assertJsonPath('data.images.0.author', 'ROCostiTheBunnyCZ')
            ->assertJsonPath('data.images.0.license', 'CC BY-SA 4.0')
            ->assertJsonPath('data.images.0.license_url', 'https://creativecommons.org/licenses/by-sa/4.0/')
            ->assertJsonPath('data.images.0.source_url', 'https://commons.wikimedia.org/wiki/File:Dacia_Logan.jpg')
            ->assertJsonMissingPath('data.plate_number');
    }

    public function test_lists_four_available_cars_of_the_same_category_closest_in_price(): void
    {
        $suv = Category::factory()->create();
        $car = Car::factory()->for($suv)->create(['slug' => 'duster', 'price_per_day' => 500]);
        foreach ([450 => 'a-450', 560 => 'a-560', 700 => 'a-700', 290 => 'a-290', 1500 => 'a-1500'] as $price => $slug) {
            Car::factory()->for($suv)->create(['slug' => $slug, 'price_per_day' => $price]);
        }
        Car::factory()->for($suv)->maintenance()->create(['slug' => 'en-maintenance', 'price_per_day' => 500]);
        Car::factory()->create(['slug' => 'autre-categorie', 'price_per_day' => 500]);

        $response = $this->getJson('/api/cars/duster')->assertOk();

        $this->assertSame(['a-450', 'a-560', 'a-700', 'a-290'], array_column($response->json('similar'), 'slug'));
        $this->assertNotContains($car->slug, array_column($response->json('similar'), 'slug'));
    }

    public function test_cars_in_maintenance_out_of_service_or_removed_answer_404(): void
    {
        Car::factory()->maintenance()->create(['slug' => 'en-maintenance']);
        Car::factory()->outOfService()->create(['slug' => 'hors-service']);
        Car::factory()->create(['slug' => 'supprimee'])->delete();

        foreach (['en-maintenance', 'hors-service', 'supprimee', 'inconnue'] as $slug) {
            $this->getJson("/api/cars/{$slug}")
                ->assertNotFound()
                ->assertJsonPath('message', 'Ressource introuvable.');
        }
    }

    public function test_featured_lists_the_available_featured_cars_cheapest_first(): void
    {
        Car::factory()->featured()->create(['slug' => 'luxe', 'price_per_day' => 1800]);
        Car::factory()->featured()->create(['slug' => 'citadine', 'price_per_day' => 230]);
        Car::factory()->featured()->maintenance()->create(['slug' => 'en-maintenance']);
        Car::factory()->create(['slug' => 'pas-a-la-une']);

        $response = $this->getJson('/api/cars/featured')->assertOk();

        $this->assertSame(['citadine', 'luxe'], array_column($response->json('data'), 'slug'));
    }
}
