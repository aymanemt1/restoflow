<?php

namespace Database\Seeders;

use App\Models\DiningTable;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Seeder;

class SampleDataSeeder extends Seeder
{
    public function run(): void
    {
        $staff = User::where('role', User::ROLE_STAFF)->firstOrFail();
        $tables = DiningTable::orderBy('number')->get();
        $items = MenuItem::available()->get()->keyBy('name');

        // A paid lunch order (total already snapshotted).
        $this->makeOrder($staff, $tables[0], Order::STATUS_PAID, [
            [$items['Harira']->id, 2],
            [$items['Chicken Tajine']->id, 2],
            [$items['Mint Tea (Atay)']->id, 2],
        ]);

        // A currently-served order (table stays occupied).
        $this->makeOrder($staff, $tables[2], Order::STATUS_SERVED, [
            [$items['Couscous Royal']->id, 3],
            [$items['Avocado Smoothie']->id, 3],
        ]);

        // A preparing order (table stays occupied).
        $this->makeOrder($staff, $tables[4], Order::STATUS_PREPARING, [
            [$items['Margherita Pizza']->id, 1],
            [$items['Mixed Grill']->id, 2],
        ]);

        // Reservations: one for today, one tomorrow.
        Reservation::create([
            'customer_name' => 'Salma El Fassi',
            'phone' => '+212 6 61 22 33 44',
            'date' => today(),
            'time' => '20:00',
            'party_size' => 4,
            'dining_table_id' => $tables[5]->id,
            'status' => Reservation::STATUS_CONFIRMED,
        ]);

        Reservation::create([
            'customer_name' => 'Youssef Benali',
            'phone' => '+212 6 62 55 66 77',
            'date' => today()->addDay(),
            'time' => '13:30',
            'party_size' => 2,
            'dining_table_id' => $tables[1]->id,
            'status' => Reservation::STATUS_PENDING,
        ]);

        Reservation::create([
            'customer_name' => 'Sara Mansouri',
            'phone' => '+212 6 63 88 99 00',
            'date' => today()->addDay(),
            'time' => '19:30',
            'party_size' => 6,
            'dining_table_id' => null,
            'status' => Reservation::STATUS_PENDING,
        ]);
    }

    /** Build an order with price snapshots; occupied/paid states stay consistent. */
    protected function makeOrder(User $staff, DiningTable $table, string $status, array $lines): Order
    {
        $order = Order::create([
            'dining_table_id' => $table->id,
            'user_id' => $staff->id,
            'status' => $status,
            'paid_at' => $status === Order::STATUS_PAID ? now() : null,
        ]);

        foreach ($lines as [$menuItemId, $qty]) {
            $menuItem = MenuItem::find($menuItemId);
            $order->items()->create([
                'menu_item_id' => $menuItem->id,
                'qty' => $qty,
                'unit_price' => $menuItem->price,
            ]);
        }

        if ($status === Order::STATUS_PAID) {
            $order->update(['total' => $order->computeTotal()]);
        } else {
            $table->update(['status' => DiningTable::STATUS_OCCUPIED]);
        }

        return $order;
    }
}
