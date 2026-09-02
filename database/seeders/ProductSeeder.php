<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

/** Seeds a starter catalogue of Nigerian foodstuffs (skips if products already exist). */
class ProductSeeder extends Seeder
{
    private const SEED = [
        ['Garri (Yellow, 2kg)', 'Grains & Swallow', 4500,
            'Premium fermented cassava granules, Ijebu-style. Great for eba, or soak it cold with sugar and groundnuts for an instant taste of home.'],
        ['Garri (White, 2kg)', 'Grains & Swallow', 4000,
            'Classic white garri, finely sifted and ready for eba, fufu blends, or a quick soak.'],
        ['Dried Stockfish, Whole (500g)', 'Proteins', 18000,
            'Deep, savoury flavour for egusi, okro, and banga soups — the stockfish every Nigerian pot needs.'],
        ['Stockfish Head (per piece)', 'Proteins', 6000,
            'Sold individually. The classic soup-pot centrepiece for a rich, smoky broth.'],
        ['Egusi, Ground (1kg)', 'Soup Ingredients', 5500,
            'Cleaned and ground melon seeds, ready straight into the pot for a proper egusi soup.'],
        ['Crayfish, Ground (500g)', 'Soup Ingredients', 7000,
            'Smoked and finely ground — the finishing touch for soups, stews, and jollof rice.'],
        ['Ogbono Seeds (500g)', 'Soup Ingredients', 6500,
            'Whole wild mango seeds for a proper draw soup, milled fresh at home or blended on request.'],
        ['Palm Oil (1L)', 'Oils & Spices', 3500,
            'Unrefined red palm oil, bottled fresh. Essential for banga, efo riro, and stews.'],
        ['Uziza & Ehuru Spice Mix (150g)', 'Oils & Spices', 2500,
            'Dried uziza seed and ehuru blend for pepper soup and traditional broths.'],
        ['Panla Fish, Dried (1kg)', 'Proteins', 9000,
            'Sun-dried panla, whole — soaks up beautifully in efo riro and ogbono soup.'],
    ];

    public function run(): void
    {
        if (Product::query()->exists()) {
            $this->command?->warn('Products already exist — skipping seed.');

            return;
        }

        // One create() per product (not insert()), so Product::booted()'s
        // slug generation actually runs for each row.
        foreach (self::SEED as [$name, $category, $price, $description]) {
            Product::create([
                'name' => $name,
                'category' => $category,
                'price' => $price,
                'description' => $description,
            ]);
        }

        $this->command?->info('Seeded '.count(self::SEED).' starter products.');
    }
}
