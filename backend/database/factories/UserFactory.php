<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Moroccan customers: names, +212 mobile numbers, cities, CIN and driving licence.
 *
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * @var list<string>
     */
    public const FIRST_NAMES = [
        'Youssef', 'Mohamed', 'Amine', 'Omar', 'Hamza', 'Mehdi', 'Karim', 'Anas', 'Ayoub', 'Rachid',
        'Hicham', 'Yassine', 'Othmane', 'Ilyas', 'Reda', 'Soufiane', 'Fatima Zahra', 'Khadija', 'Salma',
        'Imane', 'Meryem', 'Sara', 'Nadia', 'Houda', 'Hajar', 'Kawtar', 'Leïla', 'Zineb', 'Asmae', 'Ghita',
        'Yasmine', 'Julien', 'Camille', 'Thomas', 'Claire', 'Nicolas', 'Sophie',
    ];

    /**
     * @var list<string>
     */
    public const LAST_NAMES = [
        'El Amrani', 'Benali', 'Alaoui', 'Bennani', 'Tazi', 'Chraibi', 'Idrissi', 'Berrada', 'El Fassi',
        'Lahlou', 'Ouazzani', 'Saidi', 'Bennis', 'Kettani', 'Sefrioui', 'El Khatib', 'Ziani', 'Mansouri',
        'Haddad', 'Bouzid', 'Naciri', 'Tahiri', 'Filali', 'Lamrani', 'Martin', 'Dubois', 'Moreau', 'Lefebvre',
    ];

    /**
     * @var list<string>
     */
    public const CITIES = [
        'Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kénitra',
        'Tétouan', 'El Jadida', 'Essaouira', 'Mohammedia', 'Safi',
    ];

    /**
     * @var list<string>
     */
    public const STREETS = [
        'Avenue Mohammed V', 'Boulevard Zerktouni', 'Rue Ibn Battouta', 'Avenue Hassan II', 'Boulevard Anfa',
        'Rue de Fès', 'Avenue des FAR', 'Rue Moulay Ismail', 'Boulevard Abdelmoumen', 'Rue Allal Ben Abdellah',
    ];

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $firstName = fake()->randomElement(self::FIRST_NAMES);
        $lastName = fake()->randomElement(self::LAST_NAMES);
        $birthDate = fake()->dateTimeBetween('-62 years', '-23 years');
        $licenseIssuedAt = fake()->dateTimeBetween(
            (clone $birthDate)->modify('+18 years'),
            '-'.User::MIN_LICENSE_YEARS.' years',
        );

        return [
            'name' => "{$firstName} {$lastName}",
            'email' => sprintf(
                '%s.%s%d@example.com',
                Str::slug($firstName, ''),
                Str::slug($lastName, ''),
                fake()->unique()->numberBetween(1, 9999),
            ),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'role' => UserRole::Client,
            'phone' => '+212'.fake()->randomElement(['6', '7']).fake()->numerify('########'),
            'city' => fake()->randomElement(self::CITIES),
            'address' => fake()->numberBetween(1, 250).', '.fake()->randomElement(self::STREETS),
            'birth_date' => $birthDate,
            'cin' => Str::upper(fake()->unique()->bothify(fake()->randomElement(['??', '?']).'######')),
            'driving_license_number' => fake()->numerify('##/######'),
            'driving_license_issued_at' => $licenseIssuedAt,
            'is_active' => true,
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Agency staff account (no customer profile).
     */
    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'role' => UserRole::Admin,
            'cin' => null,
            'birth_date' => null,
            'driving_license_number' => null,
            'driving_license_issued_at' => null,
        ]);
    }

    /**
     * Customer who has held a licence for less than MIN_LICENSE_YEARS.
     */
    public function withRecentLicense(): static
    {
        return $this->state(fn (array $attributes) => [
            'driving_license_issued_at' => now()->subMonths(fake()->numberBetween(1, User::MIN_LICENSE_YEARS * 12 - 1)),
        ]);
    }

    /**
     * Customer who has not provided a driving licence yet.
     */
    public function withoutLicense(): static
    {
        return $this->state(fn (array $attributes) => [
            'driving_license_number' => null,
            'driving_license_issued_at' => null,
        ]);
    }

    /**
     * Disabled account.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
