<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class MenuSeeder extends Seeder
{
    public function run(): void
    {
        // [category, [name, description, price MAD, available]]
        $menu = [
            'Starters' => [
                ['Harira', 'Traditional Moroccan tomato & chickpea soup with fresh herbs', 25, true],
                ['Briouates (4 pcs)', 'Crispy pastries stuffed with spiced minced beef', 35, true],
                ['Moroccan Salad Trio', 'Taktouka, zaalouk & carrot salad with cumin', 30, true],
                ['Calamari Fritti', 'Golden fried calamari with garlic aioli', 55, true],
            ],
            'Moroccan Classics' => [
                ['Chicken Tajine', 'Slow-cooked chicken with preserved lemon & olives', 65, true],
                ['Beef Tajine with Prunes', 'Tender beef, caramelized prunes & toasted almonds', 75, true],
                ['Couscous Royal', 'Fluffy couscous, seven vegetables, lamb & merguez', 70, true],
                ['Couscous Tfaya', 'Sweet caramelized onions & raisins over couscous', 60, false],
                ['Pastilla au Poulet', 'Flaky pastry, chicken, almonds & cinnamon', 55, true],
            ],
            'Grill & International' => [
                ['Margherita Pizza', 'San Marzano tomato, fior di latte, basil', 60, true],
                ['Pizza 4 Fromages', 'Mozzarella, gorgonzola, parmesan & goat cheese', 75, true],
                ['Mixed Grill', 'Skewered chicken, beef & kefta with grilled vegetables', 95, true],
                ['Spaghetti Bolognese', 'Slow-simmered beef ragù, parmesan shavings', 55, true],
            ],
            'Desserts & Drinks' => [
                ['Msemen with Honey', 'Flaky Moroccan flatbread, honey & soft cheese', 28, true],
                ['Chocolate Fondant', 'Warm dark chocolate cake, vanilla ice cream', 45, true],
                ['Mint Tea (Atay)', 'Fresh mint, gunpowder green tea', 15, true],
                ['Avocado Smoothie', 'Avocado, milk, almonds & a touch of honey', 30, true],
            ],
        ];

        foreach ($menu as $categoryName => $items) {
            $category = Category::create(['name' => $categoryName]);

            foreach ($items as [$name, $description, $price, $available]) {
                $category->items()->create([
                    'name' => $name,
                    'description' => $description,
                    'price' => $price,
                    'available' => $available,
                ]);
            }
        }
    }
}
