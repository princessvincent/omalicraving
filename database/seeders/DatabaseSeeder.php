<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database. `php artisan db:seed` (or pass
     * --seed to migrate) seeds the starter catalogue — safe to run more
     * than once, it skips itself once any product already exists.
     */
    public function run(): void
    {
        $this->call(ProductSeeder::class);
    }
}
