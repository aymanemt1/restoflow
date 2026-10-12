<?php

namespace Tests\Feature;

use App\Models\DiningTable;
use App\Models\Order;
use Tests\TestCase;
use Tests\Traits\WithUsers;

class DiningTableTest extends TestCase
{
    use WithUsers;

    public function test_table_crud(): void
    {
        $table = $this->actingAsStaff()->postJson('/api/tables', [
            'number' => 1, 'label' => 'Terrace', 'seats' => 4,
        ])->assertCreated()->json('data');

        $this->assertSame('free', $table['status']); // default status
        $this->assertSame(1, $table['number']);

        $this->actingAsStaff()->getJson("/api/tables/{$table['id']}")
            ->assertOk()
            ->assertJsonPath('data.label', 'Terrace');

        $this->actingAsStaff()->patchJson("/api/tables/{$table['id']}", ['status' => 'reserved'])
            ->assertOk()
            ->assertJsonPath('data.status', 'reserved');

        $this->actingAsStaff()->getJson('/api/tables?status=reserved')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAsStaff()->deleteJson("/api/tables/{$table['id']}")->assertNoContent();
        $this->assertDatabaseMissing('dining_tables', ['id' => $table['id']]);
    }

    public function test_table_validation(): void
    {
        DiningTable::create(['number' => 1, 'seats' => 2]);

        $this->actingAsStaff()->postJson('/api/tables', [
            'number' => 1, // duplicate
            'seats' => 2,
            'status' => 'dirty', // invalid
        ])->assertUnprocessable()->assertJsonValidationErrors(['number', 'status']);
    }

    public function test_cannot_delete_table_with_active_orders(): void
    {
        $staff = $this->staff();
        $table = DiningTable::create(['number' => 1, 'seats' => 2]);

        Order::create([
            'dining_table_id' => $table->id,
            'user_id' => $staff->id,
            'status' => Order::STATUS_PREPARING,
        ]);

        $this->actingAs($staff, 'sanctum')
            ->deleteJson("/api/tables/{$table->id}")
            ->assertStatus(422);
    }
}
