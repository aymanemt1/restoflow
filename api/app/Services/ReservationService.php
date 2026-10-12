<?php

namespace App\Services;

use App\Models\Reservation;
use Carbon\Carbon;

/**
 * Prevents double-booking a table: every reservation holds its table
 * for a fixed 2-hour block starting at the reservation time.
 */
class ReservationService
{
    /**
     * Check whether the [start, start + 2h) block overlaps an existing
     * non-cancelled reservation for the same table on the same date.
     */
    public function isTableDoubleBooked(
        int $diningTableId,
        string $date,
        string $time,
        ?int $ignoreReservationId = null,
    ): bool {
        $start = Carbon::parse("$date $time");
        $end = $start->copy()->addHours(Reservation::BLOCK_HOURS);

        $query = Reservation::query()
            ->where('dining_table_id', $diningTableId)
            ->whereDate('date', $start->toDateString())
            ->where('status', '!=', Reservation::STATUS_CANCELLED)
            // Overlap: existing.start < new.end AND existing.end > new.start
            ->whereTime('time', '<', $end->format('H:i:s'))
            ->whereRaw("time(time, '+".Reservation::BLOCK_HOURS." hours') > ?", [$start->format('H:i:s')]);

        if ($ignoreReservationId) {
            $query->where('id', '!=', $ignoreReservationId);
        }

        return $query->exists();
    }
}
