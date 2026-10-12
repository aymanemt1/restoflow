<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Demo accounts (password: "password")
        User::create([
            'name' => 'Admin',
            'email' => 'admin@resto.test',
            'password' => 'password',
            'role' => User::ROLE_ADMIN,
        ]);

        User::create([
            'name' => 'Staff',
            'email' => 'staff@resto.test',
            'password' => 'password',
            'role' => User::ROLE_STAFF,
        ]);

        $this->call([
            DiningTableSeeder::class,
            MenuSeeder::class,
            SampleDataSeeder::class,
        ]);
    }
}
