<?php

namespace Tests\Feature;

use App\Models\DiningTable;
use App\Models\Reservation;
use Tests\TestCase;
use Tests\Traits\WithUsers;

class ReservationTest extends TestCase
{
    use WithUsers;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tableA = DiningTable::create(['number' => 1, 'seats' => 4]);
        $this->tableB = DiningTable::create(['number' => 2, 'seats' => 4]);
        $this->tomorrow = now()->addDay()->toDateString();
    }

    public function test_reservation_crud(): void
    {
        $reservation = $this->actingAsStaff()->postJson('/api/reservations', [
            'customer_name' => 'Salma El Fassi',
            'phone' => '+212 661-223344',
            'date' => $this->tomorrow,
            'time' => '20:00',
            'party_size' => 4,
            'dining_table_id' => $this->tableA->id,
        ])->assertCreated()->json('data');

        $this->assertSame('pending', $reservation['status']);
        $this->assertSame($this->tomorrow, $reservation['date']);

        $this->actingAsStaff()->patchJson("/api/reservations/{$reservation['id']}", ['status' => 'confirmed'])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');

        $this->actingAsStaff()->getJson("/api/reservations?date={$this->tomorrow}")
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAsStaff()->deleteJson("/api/reservations/{$reservation['id']}")->assertNoContent();
    }

    public function test_overlapping_reservation_for_same_table_is_rejected(): void
    {
        Reservation::create([
            'customer_name' => 'First', 'date' => $this->tomorrow, 'time' => '19:00',
            'party_size' => 2, 'dining_table_id' => $this->tableA->id,
            'status' => Reservation::STATUS_CONFIRMED,
        ]);

        // 20:00 is inside the 19:00–21:00 block.
        $this->actingAsStaff()->postJson('/api/reservations', [
            'customer_name' => 'Clash',
            'date' => $this->tomorrow,
            'time' => '20:00',
            'party_size' => 2,
            'dining_table_id' => $this->tableA->id,
        ])->assertUnprocessable();

        // 18:00 overlaps the other way (18:00–20:00 vs 19:00–21:00).
        $this->actingAsStaff()->postJson('/api/reservations', [
            'customer_name' => 'Clash 2',
            'date' => $this->tomorrow,
            'time' => '18:00',
            'party_size' => 2,
            'dining_table_id' => $this->tableA->id,
        ])->assertUnprocessable();

        // 21:00 is exactly the end of the block — no overlap.
        $this->actingAsStaff()->postJson('/api/reservations', [
            'customer_name' => 'After',
            'date' => $this->tomorrow,
            'time' => '21:00',
            'party_size' => 2,
            'dining_table_id' => $this->tableA->id,
        ])->assertCreated();

        // Same slot on a different table is fine.
        $this->actingAsStaff()->postJson('/api/reservations', [
            'customer_name' => 'Other Table',
            'date' => $this->tomorrow,
            'time' => '20:00',
            'party_size' => 2,
            'dining_table_id' => $this->tableB->id,
        ])->assertCreated();

        // No table assigned → no conflict possible.
        $this->actingAsStaff()->postJson('/api/reservations', [
            'customer_name' => 'Walk In',
            'date' => $this->tomorrow,
            'time' => '20:00',
            'party_size' => 2,
        ])->assertCreated();
    }

    public function test_cancelled_reservations_dont_block_the_table(): void
    {
        Reservation::create([
            'customer_name' => 'Cancelled', 'date' => $this->tomorrow, 'time' => '19:00',
            'party_size' => 2, 'dining_table_id' => $this->tableA->id,
            'status' => Reservation::STATUS_CANCELLED,
        ]);

        $this->actingAsStaff()->postJson('/api/reservations', [
            'customer_name' => 'New Guest',
            'date' => $this->tomorrow,
            'time' => '19:30',
            'party_size' => 2,
            'dining_table_id' => $this->tableA->id,
        ])->assertCreated();
    }

    public function test_updating_into_an_overlapping_slot_is_rejected(): void
    {
        $first = Reservation::create([
            'customer_name' => 'First', 'date' => $this->tomorrow, 'time' => '19:00',
            'party_size' => 2, 'dining_table_id' => $this->tableA->id,
            'status' => Reservation::STATUS_CONFIRMED,
        ]);
        $second = Reservation::create([
            'customer_name' => 'Second', 'date' => $this->tomorrow, 'time' => '21:00',
            'party_size' => 2, 'dining_table_id' => $this->tableA->id,
            'status' => Reservation::STATUS_PENDING,
        ]);

        $this->actingAsStaff()->patchJson("/api/reservations/{$second->id}", ['time' => '20:00'])
            ->assertUnprocessable();

        // ...but keeping its own slot is fine.
        $this->actingAsStaff()->patchJson("/api/reservations/{$first->id}", ['party_size' => 3])
            ->assertOk();
    }

    public function test_reservation_validation(): void
    {
        $this->actingAsStaff()->postJson('/api/reservations', [
            'customer_name' => 'Time Traveler',
            'date' => now()->subDay()->toDateString(), // past
            'time' => '25:00', // invalid
            'party_size' => 0,
        ])->assertUnprocessable()->assertJsonValidationErrors(['date', 'time', 'party_size']);
    }
}
