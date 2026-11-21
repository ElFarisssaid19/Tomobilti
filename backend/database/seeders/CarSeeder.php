<?php

namespace Database\Seeders;

use App\Enums\CarStatus;
use App\Enums\FuelType;
use App\Enums\Transmission;
use App\Models\Brand;
use App\Models\Car;
use App\Models\Category;
use App\Models\Location;
use Database\Factories\CarFactory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * The demo fleet: 32 cars with realistic specs and MAD prices, each with a generated
 * SVG placeholder image on the public disk (real photos come with the admin, Phase 5).
 */
class CarSeeder extends Seeder
{
    /**
     * Folder of the generated placeholders on the "public" disk.
     */
    public const PLACEHOLDER_DIRECTORY = 'cars/placeholders';

    /**
     * [brand, model, category slug, year, transmission, fuel, seats, doors, luggage,
     *  price per day (MAD), deposit (MAD), color, featured, status]
     *
     * @var list<array{0: string, 1: string, 2: string, 3: int, 4: Transmission, 5: FuelType, 6: int, 7: int, 8: int, 9: int, 10: int, 11: string, 12?: bool, 13?: CarStatus}>
     */
    private const FLEET = [
        ['Dacia', 'Logan', 'economique', 2024, Transmission::Manual, FuelType::Diesel, 5, 4, 2, 250, 5000, 'Blanc'],
        ['Dacia', 'Logan', 'economique', 2023, Transmission::Manual, FuelType::Diesel, 5, 4, 2, 250, 5000, 'Gris platine', false, CarStatus::Maintenance],
        ['Dacia', 'Sandero', 'economique', 2024, Transmission::Manual, FuelType::Petrol, 5, 5, 2, 260, 5000, 'Bleu'],
        ['Dacia', 'Sandero Stepway', 'economique', 2025, Transmission::Manual, FuelType::Diesel, 5, 5, 2, 290, 6000, 'Orange'],
        ['Fiat', 'Tipo', 'economique', 2023, Transmission::Manual, FuelType::Diesel, 5, 4, 3, 280, 6000, 'Blanc'],
        ['Hyundai', 'i10', 'economique', 2024, Transmission::Manual, FuelType::Petrol, 4, 5, 1, 230, 4000, 'Rouge'],
        ['Kia', 'Picanto', 'economique', 2024, Transmission::Automatic, FuelType::Petrol, 4, 5, 1, 260, 4000, 'Blanc'],
        ['Renault', 'Clio 5', 'compacte', 2024, Transmission::Manual, FuelType::Diesel, 5, 5, 2, 300, 6000, 'Gris'],
        ['Renault', 'Clio 5', 'compacte', 2025, Transmission::Automatic, FuelType::Petrol, 5, 5, 2, 330, 6000, 'Bleu', true],
        ['Peugeot', '208', 'compacte', 2024, Transmission::Manual, FuelType::Diesel, 5, 5, 2, 320, 6000, 'Noir'],
        ['Peugeot', '208', 'compacte', 2025, Transmission::Automatic, FuelType::Petrol, 5, 5, 2, 350, 7000, 'Blanc nacré', true],
        ['Citroën', 'C3', 'compacte', 2024, Transmission::Manual, FuelType::Diesel, 5, 5, 2, 300, 6000, 'Rouge'],
        ['Seat', 'Ibiza', 'compacte', 2023, Transmission::Manual, FuelType::Petrol, 5, 5, 2, 300, 6000, 'Blanc'],
        ['Volkswagen', 'Polo', 'compacte', 2024, Transmission::Automatic, FuelType::Petrol, 5, 5, 2, 380, 7000, 'Gris'],
        ['Peugeot', '301', 'berline', 2024, Transmission::Manual, FuelType::Diesel, 5, 4, 3, 350, 7000, 'Blanc'],
        ['Skoda', 'Octavia', 'berline', 2024, Transmission::Automatic, FuelType::Diesel, 5, 4, 3, 550, 10000, 'Noir'],
        ['Volkswagen', 'Passat', 'berline', 2023, Transmission::Automatic, FuelType::Diesel, 5, 4, 3, 650, 12000, 'Gris anthracite', false, CarStatus::Maintenance],
        ['Toyota', 'Corolla Hybride', 'berline', 2025, Transmission::Automatic, FuelType::Hybrid, 5, 4, 3, 600, 10000, 'Blanc'],
        ['Dacia', 'Duster', 'suv', 2024, Transmission::Manual, FuelType::Diesel, 5, 5, 3, 450, 8000, 'Gris', true],
        ['Dacia', 'Duster', 'suv', 2025, Transmission::Automatic, FuelType::Diesel, 5, 5, 3, 480, 8000, 'Beige sable'],
        ['Hyundai', 'Tucson', 'suv', 2024, Transmission::Automatic, FuelType::Diesel, 5, 5, 3, 700, 12000, 'Noir', true],
        ['Kia', 'Sportage', 'suv', 2024, Transmission::Automatic, FuelType::Hybrid, 5, 5, 3, 750, 12000, 'Blanc'],
        ['Peugeot', '3008', 'suv', 2025, Transmission::Automatic, FuelType::Diesel, 5, 5, 3, 800, 15000, 'Gris'],
        ['Toyota', 'Land Cruiser Prado', 'suv', 2023, Transmission::Automatic, FuelType::Diesel, 7, 5, 4, 1500, 25000, 'Blanc'],
        ['Dacia', 'Jogger', 'familiale', 2024, Transmission::Manual, FuelType::Diesel, 7, 5, 2, 450, 8000, 'Gris'],
        ['Peugeot', 'Rifter', 'familiale', 2024, Transmission::Manual, FuelType::Diesel, 7, 5, 3, 500, 8000, 'Blanc'],
        ['Volkswagen', 'Touran', 'familiale', 2023, Transmission::Automatic, FuelType::Diesel, 7, 5, 2, 650, 12000, 'Bleu'],
        ['Mercedes-Benz', 'Classe C', 'luxe', 2024, Transmission::Automatic, FuelType::Diesel, 5, 4, 3, 1200, 25000, 'Noir', true],
        ['BMW', 'Série 5', 'luxe', 2024, Transmission::Automatic, FuelType::Diesel, 5, 4, 3, 1600, 30000, 'Noir saphir'],
        ['Range Rover', 'Evoque', 'luxe', 2024, Transmission::Automatic, FuelType::Petrol, 5, 5, 3, 1800, 35000, 'Blanc', true],
        ['Renault', 'Kangoo Van', 'utilitaire', 2023, Transmission::Manual, FuelType::Diesel, 2, 4, 6, 400, 8000, 'Blanc'],
        ['Fiat', 'Ducato', 'utilitaire', 2023, Transmission::Manual, FuelType::Diesel, 3, 4, 10, 650, 10000, 'Blanc'],
    ];

    /**
     * French selling point per category, used in the description.
     *
     * @var array<string, string>
     */
    private const PITCHES = [
        'economique' => 'Idéale pour la ville et les petits budgets.',
        'compacte' => 'Agile en ville et confortable sur route.',
        'berline' => 'Confort et espace pour vos trajets professionnels.',
        'suv' => 'Parfait pour les routes de l’Atlas et les longs trajets.',
        'familiale' => 'Spacieux pour toute la famille et ses bagages.',
        'luxe' => 'Prestige et confort haut de gamme pour vos grandes occasions.',
        'utilitaire' => 'Pratique pour vos déménagements et transports de marchandises.',
    ];

    /**
     * Placeholder tint per category: [main color, light background].
     *
     * @var array<string, array{0: string, 1: string}>
     */
    private const TINTS = [
        'economique' => ['#16a34a', '#dcfce7'],
        'compacte' => ['#0284c7', '#e0f2fe'],
        'berline' => ['#4f46e5', '#e0e7ff'],
        'suv' => ['#d97706', '#fef3c7'],
        'familiale' => ['#0d9488', '#ccfbf1'],
        'luxe' => ['#1e293b', '#e2e8f0'],
        'utilitaire' => ['#64748b', '#f1f5f9'],
    ];

    /**
     * Prefecture code painted on plates, per city of the home location.
     *
     * @var array<string, int>
     */
    private const PLATE_REGION_CODES = [
        'Marrakech' => 40,
        'Casablanca' => 6,
        'Agadir' => 33,
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $disk = Storage::disk('public');
        $disk->deleteDirectory(self::PLACEHOLDER_DIRECTORY);

        $brands = Brand::pluck('id', 'name');
        $categories = Category::all()->keyBy('slug');
        $locations = Location::orderBy('id')->get()->values();

        foreach (self::FLEET as $index => $spec) {
            [$brand, $model, $categorySlug, $year, $transmission, $fuel, $seats, $doors, $luggage, $price, $deposit, $color] = $spec;
            $category = $categories[$categorySlug];
            $location = $locations[$index % $locations->count()];
            $slug = Str::slug("{$brand} {$model} {$year}");

            $car = Car::create([
                'brand_id' => $brands[$brand],
                'category_id' => $category->id,
                'location_id' => $location->id,
                'model' => $model,
                'slug' => $slug,
                'year' => $year,
                'plate_number' => sprintf(
                    '%05d-%s-%d',
                    fake()->unique()->numberBetween(10000, 99999),
                    fake()->randomElement(CarFactory::PLATE_LETTERS),
                    self::PLATE_REGION_CODES[$location->city],
                ),
                'color' => $color,
                'transmission' => $transmission,
                'fuel' => $fuel,
                'seats' => $seats,
                'doors' => $doors,
                'luggage' => $luggage,
                'air_conditioning' => true,
                'mileage' => (2026 - $year) * 22000 + fake()->numberBetween(3000, 18000),
                'price_per_day' => $price,
                'deposit_amount' => $deposit,
                'status' => $spec[13] ?? CarStatus::Available,
                'description' => sprintf(
                    '%s %s %d, boîte %s, %s, %d places. %s',
                    $brand,
                    $model,
                    $year,
                    Str::lower($transmission->label()),
                    Str::lower($fuel->label()),
                    $seats,
                    self::PITCHES[$categorySlug],
                ),
                'is_featured' => $spec[12] ?? false,
            ]);

            $path = self::PLACEHOLDER_DIRECTORY."/{$slug}.svg";
            $disk->put($path, $this->placeholderSvg("{$brand} {$model}", $category->name, self::TINTS[$categorySlug]));

            $car->images()->create([
                'path' => $path,
                'alt' => "{$brand} {$model} {$year}",
                'is_primary' => true,
                'sort_order' => 0,
            ]);
        }
    }

    /**
     * Side view of a car tinted with the category color, with the model name.
     *
     * @param  array{0: string, 1: string}  $tint
     */
    private function placeholderSvg(string $title, string $category, array $tint): string
    {
        [$color, $background] = $tint;
        $title = htmlspecialchars($title, ENT_XML1);
        $category = htmlspecialchars($category, ENT_XML1);

        return <<<SVG
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500" role="img" aria-label="{$title}">
              <defs>
                <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stop-color="{$background}"/>
                  <stop offset="1" stop-color="#ffffff"/>
                </linearGradient>
              </defs>
              <rect width="800" height="500" fill="url(#bg)"/>
              <ellipse cx="400" cy="338" rx="300" ry="16" fill="#0f172a" opacity="0.08"/>
              <path fill="{$color}" d="M118 296c0-24 16-38 44-43l92-14 70-56c14-11 32-17 52-17h132c22 0 41 7 56 20l66 55 52 9c30 5 46 21 46 45v24c0 9-7 15-16 15H134c-9 0-16-6-16-15z"/>
              <path fill="#ffffff" opacity="0.85" d="M338 190c9-8 21-12 34-12h52v62H282z"/>
              <path fill="#ffffff" opacity="0.85" d="M440 178h64c14 0 27 5 38 14l56 48H440z"/>
              <rect x="430" y="178" width="10" height="62" fill="{$color}"/>
              <rect x="640" y="268" width="34" height="12" rx="6" fill="#fde68a"/>
              <rect x="124" y="268" width="26" height="12" rx="6" fill="#fca5a5"/>
              <circle cx="240" cy="330" r="44" fill="#1e293b"/>
              <circle cx="240" cy="330" r="19" fill="#cbd5e1"/>
              <circle cx="568" cy="330" r="44" fill="#1e293b"/>
              <circle cx="568" cy="330" r="19" fill="#cbd5e1"/>
              <text x="400" y="420" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="40" font-weight="700" fill="#0f172a">{$title}</text>
              <text x="400" y="458" text-anchor="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="22" fill="{$color}">{$category} · Tomobilti</text>
            </svg>
            SVG;
    }
}
