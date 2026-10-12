<?php

namespace Tests\Feature;

use App\Models\DiningTable;
use App\Models\Order;
use App\Models\Reservation;
use Tests\TestCase;
use Tests\Traits\WithUsers;

class DashboardTest extends TestCase
{
    use WithUsers;

    public function test_dashboard_numbers(): void
    {
        $staff = $this->staff();
        $table = DiningTable::create(['number' => 1, 'seats' => 4, 'status' => DiningTable::STATUS_OCCUPIED]);
        DiningTable::create(['number' => 2, 'seats' => 2, 'status' => DiningTable::STATUS_FREE]);

        // Paid today → counts toward today's revenue.
        Order::create([
            'dining_table_id' => $table->id, 'user_id' => $staff->id,
            'status' => Order::STATUS_PAID, 'total' => 120,
            'created_at' => now(), 'paid_at' => now(),
        ]);

        // Paid yesterday → must NOT count toward today's revenue.
        $yesterday = Order::create([
            'dining_table_id' => $table->id, 'user_id' => $staff->id,
            'status' => Order::STATUS_PAID, 'total' => 500, 'paid_at' => now()->subDay(),
        ]);
        $yesterday->forceFill(['created_at' => now()->subDay(), 'updated_at' => now()->subDay()])->save();

        // Active orders (not paid / cancelled).
        Order::create([
            'dining_table_id' => $table->id, 'user_id' => $staff->id,
            'status' => Order::STATUS_PREPARING,
        ]);
        Order::create([
            'dining_table_id' => $table->id, 'user_id' => $staff->id,
            'status' => Order::STATUS_CANCELLED,
        ]);

        // Reservations: two today, one tomorrow.
        Reservation::create([
            'customer_name' => 'A', 'date' => today(), 'time' => '13:00', 'party_size' => 2,
        ]);
        Reservation::create([
            'customer_name' => 'B', 'date' => today(), 'time' => '20:00', 'party_size' => 4,
        ]);
        Reservation::create([
            'customer_name' => 'C', 'date' => today()->addDay(), 'time' => '13:00', 'party_size' => 2,
        ]);

        $this->actingAsStaff()->getJson('/api/dashboard')
            ->assertOk()
            ->assertJsonPath('today_revenue', 120)
            ->assertJsonPath('active_orders_count', 1)
            ->assertJsonPath('occupied_tables_count', 1)
            ->assertJsonPath('today_reservations_count', 2);
    }

    public function test_dashboard_requires_authentication(): void
    {
        $this->getJson('/api/dashboard')->assertUnauthorized();
    }
}
