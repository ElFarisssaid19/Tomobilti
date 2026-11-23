<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Demo accounts and 25 Moroccan customers, all with the password DEMO_PASSWORD
 * (development only). Not "password": Chrome flags it as leaked and its warning
 * blocks clicks during browser checks.
 */
class UserSeeder extends Seeder
{
    public const ADMIN_EMAIL = 'admin@tomobilti.ma';

    public const CLIENT_EMAIL = 'client@tomobilti.ma';

    public const DEMO_PASSWORD = 'Tomobilti2026!';

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Hashed once and shared: hashing 27 times would slow the seed down.
        $password = Hash::make(self::DEMO_PASSWORD);

        User::factory()->admin()->create([
            'password' => $password,
            'name' => 'Admin Tomobilti',
            'email' => self::ADMIN_EMAIL,
            'phone' => '+212522000100',
            'city' => 'Casablanca',
            'address' => '45, Boulevard Zerktouni, Maârif',
        ]);

        User::factory()->create([
            'password' => $password,
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

        User::factory()->count(20)->create(['password' => $password]);
        User::factory()->count(3)->withRecentLicense()->create(['password' => $password]);
        User::factory()->withoutLicense()->create(['password' => $password]);
        User::factory()->inactive()->create(['password' => $password]);
    }
}
