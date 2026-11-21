<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Demo data for Tomobilti (Moroccan car rental agency).
 *
 * Faker uses a fixed seed, so `php artisan migrate:fresh --seed` produces the same
 * data on every run. Dates are relative to the day you seed, so there are always
 * past, current and upcoming reservations.
 *
 * Model events stay enabled: they generate reservation references and invoice numbers.
 */
class DatabaseSeeder extends Seeder
{
    /**
     * Fixed Faker seed for reproducible demo data.
     */
    public const FAKER_SEED = 2026;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        fake()->seed(self::FAKER_SEED);

        $this->call([
            UserSeeder::class,
            CategorySeeder::class,
            BrandSeeder::class,
            LocationSeeder::class,
            CarSeeder::class,
            ExtraSeeder::class,
            ReservationSeeder::class,
        ]);
    }
}
