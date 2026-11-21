<?php

namespace Database\Seeders;

use App\Enums\LocationType;
use App\Models\Location;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    /**
     * Pick-up / return points of the agency.
     *
     * @var list<array{name: string, slug: string, type: LocationType, city: string, address: string, phone: string, opening_hours: string}>
     */
    public const LOCATIONS = [
        [
            'name' => 'Marrakech Aéroport Menara',
            'slug' => 'marrakech-aeroport-menara',
            'type' => LocationType::Airport,
            'city' => 'Marrakech',
            'address' => 'Aéroport Marrakech Menara, Terminal 1, 40000 Marrakech',
            'phone' => '+212524000101',
            'opening_hours' => 'Tous les jours, 07:00 – 23:00',
        ],
        [
            'name' => 'Marrakech Guéliz',
            'slug' => 'marrakech-gueliz',
            'type' => LocationType::Agency,
            'city' => 'Marrakech',
            'address' => '112, Avenue Mohammed V, Guéliz, 40000 Marrakech',
            'phone' => '+212524000102',
            'opening_hours' => 'Lun – Sam, 08:30 – 19:30',
        ],
        [
            'name' => 'Casablanca Aéroport Mohammed V',
            'slug' => 'casablanca-aeroport-mohammed-v',
            'type' => LocationType::Airport,
            'city' => 'Casablanca',
            'address' => 'Aéroport Mohammed V, Terminal 1, 27000 Nouaceur',
            'phone' => '+212522000103',
            'opening_hours' => '24h/24, 7j/7',
        ],
        [
            'name' => 'Casablanca Maârif',
            'slug' => 'casablanca-maarif',
            'type' => LocationType::Agency,
            'city' => 'Casablanca',
            'address' => '45, Boulevard Zerktouni, Maârif, 20330 Casablanca',
            'phone' => '+212522000104',
            'opening_hours' => 'Lun – Sam, 08:30 – 19:30',
        ],
        [
            'name' => 'Agadir Al Massira',
            'slug' => 'agadir-al-massira',
            'type' => LocationType::Airport,
            'city' => 'Agadir',
            'address' => 'Aéroport Agadir Al Massira, 80000 Agadir',
            'phone' => '+212528000105',
            'opening_hours' => 'Tous les jours, 07:00 – 23:00',
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (self::LOCATIONS as $location) {
            Location::create([...$location, 'is_active' => true]);
        }
    }
}
