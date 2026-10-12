<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\MenuItem;
use App\Models\User;
use Tests\TestCase;
use Tests\Traits\WithUsers;

class MenuTest extends TestCase
{
    use WithUsers;

    public function test_guests_cannot_access_the_api(): void
    {
        $this->getJson('/api/menu-items')->assertUnauthorized();
        $this->getJson('/api/categories')->assertUnauthorized();
    }

    public function test_authenticated_users_can_browse_and_filter_the_menu(): void
    {
        $category = Category::create(['name' => 'Starters']);
        MenuItem::create(['name' => 'Harira', 'price' => 25, 'category_id' => $category->id, 'available' => true]);
        MenuItem::create(['name' => 'Secret Dish', 'price' => 99, 'category_id' => $category->id, 'available' => false]);

        $this->actingAsStaff()->getJson('/api/menu-items')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->actingAsStaff()->getJson('/api/menu-items?available=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonFragment(['name' => 'Harira']);

        $this->actingAsStaff()->getJson('/api/categories')
            ->assertOk()
            ->assertJsonFragment(['name' => 'Starters']);
    }

    public function test_staff_can_manage_the_menu(): void
    {
        // Create
        $category = $this->actingAsStaff()->postJson('/api/categories', ['name' => 'Grill'])
            ->assertCreated()
            ->json('data');

        $item = $this->actingAs($this->admin(), 'sanctum')->postJson('/api/menu-items', [
            'name' => 'Mixed Grill',
            'description' => 'Skewered meats',
            'price' => 95,
            'category_id' => $category['id'],
        ])->assertCreated()->json('data');

        $this->assertSame('95.00', (string) $item['price']);

        // Update
        $this->actingAsStaff()->patchJson("/api/menu-items/{$item['id']}", ['available' => false])
            ->assertOk()
            ->assertJsonPath('data.available', false);

        // Delete category cascades its items
        $this->actingAsStaff()->deleteJson("/api/categories/{$category['id']}")->assertNoContent();
        $this->assertDatabaseMissing('menu_items', ['id' => $item['id']]);
    }

    public function test_menu_writes_require_staff_role(): void
    {
        $outsider = User::create([
            'name' => 'Outsider', 'email' => 'outsider@test.com',
            'password' => 'password', 'role' => 'customer',
        ]);

        $this->actingAs($outsider, 'sanctum')
            ->postJson('/api/categories', ['name' => 'Nope'])
            ->assertForbidden();
    }

    public function test_menu_validation(): void
    {
        $this->actingAsStaff()->postJson('/api/menu-items', [
            'name' => 'No Price',
            'category_id' => 999,
        ])->assertUnprocessable()->assertJsonValidationErrors(['price', 'category_id']);
    }
}
