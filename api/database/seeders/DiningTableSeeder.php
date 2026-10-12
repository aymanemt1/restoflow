<?php

namespace Database\Seeders;

use App\Models\DiningTable;
use Illuminate\Database\Seeder;

class DiningTableSeeder extends Seeder
{
    public function run(): void
    {
        $tables = [
            ['number' => 1, 'label' => 'Window', 'seats' => 2],
            ['number' => 2, 'label' => 'Window', 'seats' => 2],
            ['number' => 3, 'label' => 'Center', 'seats' => 4],
            ['number' => 4, 'label' => 'Center', 'seats' => 4],
            ['number' => 5, 'label' => 'Terrace', 'seats' => 4],
            ['number' => 6, 'label' => 'Terrace', 'seats' => 6],
            ['number' => 7, 'label' => 'Family Room', 'seats' => 8],
            ['number' => 8, 'label' => 'VIP Corner', 'seats' => 6],
        ];

        foreach ($tables as $table) {
            DiningTable::create($table);
        }
    }
}
