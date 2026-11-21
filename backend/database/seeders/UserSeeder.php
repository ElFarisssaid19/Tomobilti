<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Demo accounts (password "password", development only) and 25 Moroccan customers.
 */
class UserSeeder extends Seeder
{
    public const ADMIN_EMAIL = 'admin@tomobilti.ma';

    public const CLIENT_EMAIL = 'client@tomobilti.ma';

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::factory()->admin()->create([
            'name' => 'Admin Tomobilti',
            'email' => self::ADMIN_EMAIL,
            'phone' => '+212522000100',
            'city' => 'Casablanca',
            'address' => '45, Boulevard Zerktouni, Maârif',
        ]);

        User::factory()->create([
            'name' => 'Salma Bennani',
            'email' => self::CLIENT_EMAIL,
            'phone' => '+212661234567',
            'city' => 'Casablanca',
            'address' => '18, Rue Ibn Battouta, Gauthier',
            'birth_date' => '1992-04-17',
            'cin' => 'BE123456',
            'driving_license_number' => '12/345678',
            'driving_license_issued_at' => '2012-09-03',
        ]);

        User::factory()->count(20)->create();
        User::factory()->count(3)->withRecentLicense()->create();
        User::factory()->withoutLicense()->create();
        User::factory()->inactive()->create();
    }
}
