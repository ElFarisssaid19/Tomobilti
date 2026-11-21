<?php

namespace Database\Factories;

use App\Enums\CarStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Models\Brand;
use App\Models\Car;
use App\Models\Category;
use App\Models\Location;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Car>
 */
class CarFactory extends Factory
{
    /**
     * Latin letters used on Moroccan plates for the Arabic letter (أ ب د ه و).
     *
     * @var list<string>
     */
    public const PLATE_LETTERS = ['A', 'B', 'D', 'H', 'W'];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $model = fake()->randomElement(['Logan', 'Sandero', 'Clio', '208', 'Duster', 'Tucson', 'Octavia']);
        $year = fake()->numberBetween(2021, 2025);

        return [
            'brand_id' => Brand::factory(),
            'category_id' => Category::factory(),
            'location_id' => Location::factory(),
            'model' => $model,
            'slug' => Str::slug("{$model} {$year}").'-'.fake()->unique()->numberBetween(1, 999999),
            'year' => $year,
            'plate_number' => static::plateNumber(),
            'color' => fake()->randomElement(['Blanc', 'Gris', 'Noir', 'Bleu', 'Rouge']),
            'transmission' => fake()->randomElement(Transmission::cases()),
            'fuel' => fake()->randomElement([FuelType::Diesel, FuelType::Petrol]),
            'seats' => 5,
            'doors' => fake()->randomElement([4, 5]),
            'luggage' => fake()->numberBetween(1, 4),
            'air_conditioning' => true,
            'mileage' => fake()->numberBetween(5000, 120000),
            'price_per_day' => fake()->numberBetween(5, 24) * 50,
            'deposit_amount' => fake()->numberBetween(5, 30) * 1000,
            'status' => CarStatus::Available,
            'description' => fake()->sentence(),
            'is_featured' => false,
        ];
    }

    /**
     * A unique Moroccan plate number such as "12345-A-6".
     */
    public static function plateNumber(): string
    {
        return sprintf(
            '%05d-%s-%d',
            fake()->unique()->numberBetween(1, 99999),
            fake()->randomElement(self::PLATE_LETTERS),
            fake()->numberBetween(1, 89),
        );
    }

    public function maintenance(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CarStatus::Maintenance,
        ]);
    }

    public function outOfService(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => CarStatus::OutOfService,
        ]);
    }

    public function featured(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_featured' => true,
        ]);
    }
}
