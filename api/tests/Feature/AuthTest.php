<?php

namespace Tests\Feature;

use Tests\TestCase;
use Tests\Traits\WithUsers;

class AuthTest extends TestCase
{
    use WithUsers;

    public function test_user_can_register_and_receives_staff_role(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'New Hire',
            'email' => 'hire@resto.test',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.email', 'hire@resto.test')
            ->assertJsonPath('user.role', 'staff') // registration can never grant admin
            ->assertJsonStructure(['token']);

        $this->assertDatabaseHas('users', ['email' => 'hire@resto.test', 'role' => 'staff']);
    }

    public function test_login_returns_token_and_me_profile(): void
    {
        $this->staff();

        $login = $this->postJson('/api/login', [
            'email' => 'staff@resto.test',
            'password' => 'password',
        ]);
        $login->assertOk()->assertJsonStructure(['user', 'token']);
        $token = $login->json('token');
        $this->assertNotEmpty($token);

        $this->withToken($token)->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'staff@resto.test')
            ->assertJsonPath('data.role', 'staff');
    }

    public function test_logout_revokes_the_current_token(): void
    {
        // Token minted directly (no login request) so no session auth bleeds in.
        $token = $this->staff()->createToken('api')->plainTextToken;

        $this->withToken($token)->getJson('/api/me')->assertOk();
        $this->withToken($token)->postJson('/api/logout')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);

        // The auth guard caches the resolved user per request cycle in tests —
        // drop it so the deleted token is actually re-validated.
        $this->app['auth']->forgetGuards();
        $this->withToken($token)->getJson('/api/me')->assertUnauthorized();
    }

    public function test_login_rejects_bad_credentials(): void
    {
        $this->staff();

        $this->postJson('/api/login', [
            'email' => 'staff@resto.test',
            'password' => 'wrong-password',
        ])->assertUnauthorized();
    }

    public function test_register_validates_input(): void
    {
        $this->staff();

        $this->postJson('/api/register', [
            'name' => 'Dup',
            'email' => 'staff@resto.test', // already taken
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');

        $this->postJson('/api/register', [])->assertUnprocessable();
    }
}
