<?php

namespace Database\Factories;

use App\Enums\LocationType;
use App\Models\Location;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Location>
 */
class LocationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $city = fake()->randomElement(UserFactory::CITIES);
        $name = "{$city} ".Str::ucfirst(fake()->unique()->word());

        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'type' => LocationType::Agency,
            'city' => $city,
            'address' => fake()->numberBetween(1, 250).', '.fake()->randomElement(UserFactory::STREETS).", {$city}",
            'phone' => '+2125'.fake()->numerify('########'),
            'opening_hours' => 'Lun – Sam, 08:30 – 19:30',
            'is_active' => true,
        ];
    }

    /**
     * Airport desk.
     */
    public function airport(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => LocationType::Airport,
            'opening_hours' => 'Tous les jours, 07:00 – 23:00',
        ]);
    }

    /**
     * Location closed to new bookings.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
