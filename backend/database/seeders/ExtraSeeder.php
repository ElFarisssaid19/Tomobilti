<?php

namespace Database\Seeders;

use App\Enums\ExtraPricing;
use App\Models\Extra;
use Illuminate\Database\Seeder;

class ExtraSeeder extends Seeder
{
    /**
     * Rental add-ons with prices in MAD. The icon is a lucide-react icon name.
     *
     * @var list<array{name: string, slug: string, icon: string, price: string, pricing: ExtraPricing, max_quantity: int, description: string}>
     */
    public const EXTRAS = [
        ['name' => 'GPS', 'slug' => 'gps', 'icon' => 'navigation', 'price' => '50.00', 'pricing' => ExtraPricing::PerDay, 'max_quantity' => 1, 'description' => 'Navigateur GPS avec les cartes du Maroc à jour.'],
        ['name' => 'Siège bébé', 'slug' => 'siege-bebe', 'icon' => 'baby', 'price' => '40.00', 'pricing' => ExtraPricing::PerDay, 'max_quantity' => 2, 'description' => 'Siège auto pour bébé (0 à 13 kg), installé avant votre arrivée.'],
        ['name' => 'Siège rehausseur', 'slug' => 'siege-rehausseur', 'icon' => 'armchair', 'price' => '30.00', 'pricing' => ExtraPricing::PerDay, 'max_quantity' => 2, 'description' => 'Rehausseur pour enfant de 4 à 10 ans.'],
        ['name' => 'Conducteur supplémentaire', 'slug' => 'conducteur-supplementaire', 'icon' => 'user-plus', 'price' => '150.00', 'pricing' => ExtraPricing::PerRental, 'max_quantity' => 2, 'description' => 'Un second conducteur autorisé (permis de plus de 2 ans requis).'],
        ['name' => 'Assurance tous risques', 'slug' => 'assurance-tous-risques', 'icon' => 'shield-check', 'price' => '120.00', 'pricing' => ExtraPricing::PerDay, 'max_quantity' => 1, 'description' => 'Franchise ramenée à 0 DH en cas de dommage au véhicule.'],
        ['name' => 'Wi-Fi mobile', 'slug' => 'wifi-mobile', 'icon' => 'wifi', 'price' => '60.00', 'pricing' => ExtraPricing::PerDay, 'max_quantity' => 1, 'description' => 'Routeur 4G avec données illimitées pour rester connecté sur la route.'],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        foreach (self::EXTRAS as $extra) {
            Extra::create([...$extra, 'is_active' => true]);
        }
    }
}
