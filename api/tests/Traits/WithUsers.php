<?php

namespace Tests\Traits;

use App\Models\User;

/** Creates demo users and returns Sanctum tokens for API calls. */
trait WithUsers
{
    protected function admin(): User
    {
        return User::firstOrCreate(
            ['email' => 'admin@resto.test'],
            ['name' => 'Admin', 'password' => 'password', 'role' => User::ROLE_ADMIN],
        );
    }

    protected function staff(): User
    {
        return User::firstOrCreate(
            ['email' => 'staff@resto.test'],
            ['name' => 'Staff', 'password' => 'password', 'role' => User::ROLE_STAFF],
        );
    }

    protected function actingAsAdmin()
    {
        return $this->actingAs($this->admin(), 'sanctum');
    }

    protected function actingAsStaff()
    {
        return $this->actingAs($this->staff(), 'sanctum');
    }
}
