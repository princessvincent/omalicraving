<?php

namespace App\Console\Commands;

use App\Models\CustomerProfile;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

/**
 * The seller's own admin account — there's no separate "admin sign up"
 * flow (one login serves both customers and the seller, see AuthController
 * — a user just needs is_staff=true). This is the Laravel equivalent of
 * Django's `createsuperuser`: run once to create (or promote) the seller's
 * account.
 *
 *   php artisan app:make-admin owner@example.com "a strong password" "Shop Owner"
 */
class MakeAdminCommand extends Command
{
    protected $signature = 'app:make-admin {email} {password} {name=Shop Owner}';

    protected $description = 'Create (or promote) the seller/admin account used to sign in to /admin';

    public function handle(): int
    {
        $email = strtolower(trim((string) $this->argument('email')));
        $password = (string) $this->argument('password');
        $name = (string) $this->argument('name');

        $validator = Validator::make(compact('email', 'password'), [
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }

            return self::FAILURE;
        }

        $user = User::where('email', $email)->first();

        if ($user) {
            $user->forceFill(['is_staff' => true, 'password' => Hash::make($password)])->save();
            $this->info("Existing account {$email} is now an admin, and its password was reset.");
        } else {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'is_staff' => true,
            ]);
            $this->info("Admin account created: {$email}");
        }

        CustomerProfile::firstOrCreate(['user_id' => $user->id], ['name' => $name]);

        return self::SUCCESS;
    }
}
