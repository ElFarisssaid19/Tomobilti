<?php

namespace Database\Factories;

use App\Enums\ExtraPricing;
use App\Models\Extra;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Extra>
 */
class ExtraFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = Str::ucfirst(fake()->unique()->words(2, true));

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'description' => fake()->sentence(),
            'icon' => 'plus',
            'price' => fake()->numberBetween(2, 15) * 10,
            'pricing' => ExtraPricing::PerDay,
            'max_quantity' => 1,
            'is_active' => true,
        ];
    }

    public function perRental(): static
    {
        return $this->state(fn (array $attributes) => [
            'pricing' => ExtraPricing::PerRental,
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
