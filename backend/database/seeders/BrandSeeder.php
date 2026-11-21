<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BrandSeeder extends Seeder
{
    /**
     * Brands commonly rented in Morocco.
     *
     * @var list<string>
     */
    public const BRANDS = [
        'Dacia', 'Renault', 'Peugeot', 'Citroën', 'Hyundai', 'Kia', 'Toyota',
        'Volkswagen', 'Fiat', 'Skoda', 'Seat', 'Mercedes-Benz', 'BMW', 'Range Rover',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (self::BRANDS as $name) {
            Brand::create(['name' => $name, 'slug' => Str::slug($name)]);
        }
    }
}
