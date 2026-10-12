<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;
use Tests\Traits\WithUsers;

class StaffTest extends TestCase
{
    use WithUsers;

    public function test_admin_can_manage_staff(): void
    {
        $this->actingAsAdmin()->getJson('/api/admin/staff')->assertOk();

        $user = $this->actingAsAdmin()->postJson('/api/admin/staff', [
            'name' => 'Karim',
            'email' => 'karim@resto.test',
            'password' => 'password',
            'role' => 'staff',
        ])->assertCreated()->json('data');

        $this->assertSame('staff', $user['role']);
        $this->assertArrayNotHasKey('password', $user);

        $this->actingAsAdmin()->patchJson("/api/admin/staff/{$user['id']}", ['role' => 'admin'])
            ->assertOk()
            ->assertJsonPath('data.role', 'admin');

        $this->actingAsAdmin()->deleteJson("/api/admin/staff/{$user['id']}")->assertNoContent();
        $this->assertDatabaseMissing('users', ['id' => $user['id']]);
    }

    public function test_staff_cannot_access_admin_routes(): void
    {
        $this->actingAsStaff()->getJson('/api/admin/staff')->assertForbidden();
        $this->actingAsStaff()->postJson('/api/admin/staff', [
            'name' => 'Sneaky', 'email' => 'sneaky@test.com',
            'password' => 'password', 'role' => 'admin',
        ])->assertForbidden();
    }

    public function test_admin_cannot_delete_their_own_account(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/admin/staff/{$admin->id}")
            ->assertUnprocessable();

        $this->assertDatabaseHas('users', ['id' => $admin->id]);
    }

    public function test_staff_role_is_validated(): void
    {
        $this->actingAsAdmin()->postJson('/api/admin/staff', [
            'name' => 'Karim',
            'email' => 'karim@resto.test',
            'password' => 'password',
            'role' => 'superadmin', // not a real role
        ])->assertUnprocessable()->assertJsonValidationErrors('role');
    }
}
