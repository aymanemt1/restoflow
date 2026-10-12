<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\DiningTable;
use App\Models\MenuItem;
use App\Models\Order;
use Tests\TestCase;
use Tests\Traits\WithUsers;

class OrderTest extends TestCase
{
    use WithUsers;

    protected function setUp(): void
    {
        parent::setUp();

        $category = Category::create(['name' => 'Starters']);
        $this->tajine = MenuItem::create([
            'name' => 'Chicken Tajine', 'price' => 65,
            'category_id' => $category->id, 'available' => true,
        ]);
        $this->harira = MenuItem::create([
            'name' => 'Harira', 'price' => 25,
            'category_id' => $category->id, 'available' => true,
        ]);
        $this->soldOut = MenuItem::create([
            'name' => 'Sold Out Dish', 'price' => 10,
            'category_id' => $category->id, 'available' => false,
        ]);
        $this->table = DiningTable::create(['number' => 1, 'seats' => 4]);
    }

    public function test_full_order_lifecycle(): void
    {
        // 1. Create order on a free table → table becomes occupied.
        $order = $this->actingAsStaff()->postJson('/api/orders', [
            'dining_table_id' => $this->table->id,
            'items' => [
                ['menu_item_id' => $this->tajine->id, 'qty' => 2],
            ],
        ])->assertCreated()->json('data');

        $this->assertSame('pending', $order['status']);
        $this->assertSame('65.00', (string) $order['items'][0]['unit_price']); // price snapshot
        $this->assertSame(DiningTable::STATUS_OCCUPIED, $this->table->fresh()->status);

        // 2. Add items while the order is open.
        $this->actingAsStaff()->postJson("/api/orders/{$order['id']}/items", [
            'items' => [['menu_item_id' => $this->harira->id, 'qty' => 1]],
        ])->assertOk()->assertJsonCount(2, 'data.items');

        // 3. Walk the status flow.
        $this->actingAsStaff()->patchJson("/api/orders/{$order['id']}/status", ['status' => 'preparing'])
            ->assertOk()->assertJsonPath('data.status', 'preparing');
        $this->actingAsStaff()->patchJson("/api/orders/{$order['id']}/status", ['status' => 'served'])
            ->assertOk()->assertJsonPath('data.status', 'served');

        // 4. Paying computes & stores the total: 2×65 + 1×25 = 155.
        $this->actingAsStaff()->patchJson("/api/orders/{$order['id']}/status", ['status' => 'paid'])
            ->assertOk()
            ->assertJsonPath('data.status', 'paid')
            ->assertJsonPath('data.total', '155.00');

        $this->assertNotNull(Order::find($order['id'])->paid_at);

        // 5. The table is freed again.
        $this->assertSame(DiningTable::STATUS_FREE, $this->table->fresh()->status);
    }

    public function test_invalid_status_transitions_are_rejected(): void
    {
        $staff = $this->staff();
        $order = Order::create([
            'dining_table_id' => $this->table->id,
            'user_id' => $staff->id,
            'status' => Order::STATUS_PENDING,
        ]);

        // pending → paid skips preparing/served: rejected.
        $this->actingAs($staff, 'sanctum')
            ->patchJson("/api/orders/{$order->id}/status", ['status' => 'paid'])
            ->assertUnprocessable()
            ->assertJsonPath('allowed', ['preparing', 'cancelled']);

        $this->assertSame(Order::STATUS_PENDING, $order->fresh()->status);
    }

    public function test_terminal_orders_cannot_move_again(): void
    {
        $staff = $this->staff();
        $order = Order::create([
            'dining_table_id' => $this->table->id,
            'user_id' => $staff->id,
            'status' => Order::STATUS_PAID,
            'total' => 100,
        ]);

        $this->actingAs($staff, 'sanctum')
            ->patchJson("/api/orders/{$order->id}/status", ['status' => 'served'])
            ->assertUnprocessable();
    }

    public function test_cannot_add_items_to_paid_or_cancelled_orders(): void
    {
        $staff = $this->staff();
        $paid = Order::create([
            'dining_table_id' => $this->table->id,
            'user_id' => $staff->id,
            'status' => Order::STATUS_PAID,
        ]);

        $this->actingAs($staff, 'sanctum')->postJson("/api/orders/{$paid->id}/items", [
            'items' => [['menu_item_id' => $this->harira->id, 'qty' => 1]],
        ])->assertUnprocessable();

        // Cancelling an order also frees its table.
        $open = Order::create([
            'dining_table_id' => $this->table->id,
            'user_id' => $staff->id,
            'status' => Order::STATUS_PREPARING,
        ]);
        $this->table->update(['status' => DiningTable::STATUS_OCCUPIED]);

        $this->actingAs($staff, 'sanctum')
            ->patchJson("/api/orders/{$open->id}/status", ['status' => 'cancelled'])
            ->assertOk();

        $this->assertSame(DiningTable::STATUS_FREE, $this->table->fresh()->status);
    }

    public function test_paid_total_uses_price_snapshot_not_current_menu_price(): void
    {
        $staff = $this->staff();
        $order = Order::create([
            'dining_table_id' => $this->table->id,
            'user_id' => $staff->id,
            'status' => Order::STATUS_SERVED,
        ]);
        $order->items()->create([
            'menu_item_id' => $this->tajine->id, 'qty' => 1, 'unit_price' => 65,
        ]);

        // Menu price changes after the order was taken...
        $this->tajine->update(['price' => 80]);

        $this->actingAs($staff, 'sanctum')
            ->patchJson("/api/orders/{$order->id}/status", ['status' => 'paid'])
            ->assertOk()
            ->assertJsonPath('data.total', '65.00'); // ...but the snapshot wins
    }

    public function test_cannot_order_unavailable_items(): void
    {
        $this->actingAsStaff()->postJson('/api/orders', [
            'dining_table_id' => $this->table->id,
            'items' => [['menu_item_id' => $this->soldOut->id, 'qty' => 1]],
        ])->assertUnprocessable();
    }

    public function test_table_stays_occupied_while_another_order_is_open(): void
    {
        $staff = $this->staff();
        $this->table->update(['status' => DiningTable::STATUS_OCCUPIED]);

        $first = Order::create(['dining_table_id' => $this->table->id, 'user_id' => $staff->id, 'status' => 'preparing']);
        $second = Order::create(['dining_table_id' => $this->table->id, 'user_id' => $staff->id, 'status' => 'served']);

        // Paying the second order must NOT free the table — the first is still open.
        $this->actingAs($staff, 'sanctum')
            ->patchJson("/api/orders/{$second->id}/status", ['status' => 'paid'])
            ->assertOk();
        $this->assertSame(DiningTable::STATUS_OCCUPIED, $this->table->fresh()->status);

        // Cancelling the last open order frees it.
        $this->actingAs($staff, 'sanctum')
            ->patchJson("/api/orders/{$first->id}/status", ['status' => 'cancelled'])
            ->assertOk();
        $this->assertSame(DiningTable::STATUS_FREE, $this->table->fresh()->status);
    }
}
