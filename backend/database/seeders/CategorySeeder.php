<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Catalogue categories. The icon is a lucide-react icon name.
     *
     * @var list<array{name: string, slug: string, icon: string, description: string}>
     */
    public const CATEGORIES = [
        ['name' => 'Économique', 'slug' => 'economique', 'icon' => 'wallet', 'description' => 'Petites voitures sobres et faciles à garer, idéales pour la ville et les petits budgets.'],
        ['name' => 'Compacte', 'slug' => 'compacte', 'icon' => 'car', 'description' => 'Polyvalentes et agiles en ville, confortables sur route.'],
        ['name' => 'Berline', 'slug' => 'berline', 'icon' => 'car-front', 'description' => 'Confort et coffre généreux pour les longs trajets et les déplacements professionnels.'],
        ['name' => 'SUV', 'slug' => 'suv', 'icon' => 'mountain', 'description' => 'Position de conduite haute et robustesse, parfaits pour les routes de l’Atlas.'],
        ['name' => 'Familiale', 'slug' => 'familiale', 'icon' => 'users', 'description' => 'Jusqu’à 7 places et de la place pour les bagages de toute la famille.'],
        ['name' => 'Luxe', 'slug' => 'luxe', 'icon' => 'gem', 'description' => 'Véhicules haut de gamme pour vos événements et voyages d’affaires.'],
        ['name' => 'Utilitaire', 'slug' => 'utilitaire', 'icon' => 'truck', 'description' => 'Fourgonnettes et fourgons pour vos déménagements et transports de marchandises.'],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (self::CATEGORIES as $index => $category) {
            Category::create([...$category, 'sort_order' => $index + 1]);
        }
    }
}
