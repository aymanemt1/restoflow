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
     * non-cancelled reservation for the same table.
     *
     * Blocks are compared as real timestamps so a hold that crosses
     * midnight still conflicts with a booking on the next calendar day.
     */
    public function isTableDoubleBooked(
        int $diningTableId,
        string $date,
        string $time,
        ?int $ignoreReservationId = null,
    ): bool {
        $start = Carbon::parse("$date $time");
        $end = $start->copy()->addHours(Reservation::BLOCK_HOURS);

        // Dates are stored as datetimes, so compare the calendar day (not the
        // raw string). Include the previous day: a block can start that evening.
        $query = Reservation::query()
            ->where('dining_table_id', $diningTableId)
            ->where('status', '!=', Reservation::STATUS_CANCELLED)
            ->whereDate('date', '>=', $start->copy()->subHours(Reservation::BLOCK_HOURS)->toDateString())
            ->whereDate('date', '<=', $end->toDateString());

        if ($ignoreReservationId) {
            $query->where('id', '!=', $ignoreReservationId);
        }

        return $query->get()->contains(function (Reservation $existing) use ($start, $end) {
            $existingStart = Carbon::parse(
                $existing->date->toDateString().' '.$existing->time->format('H:i:s')
            );
            $existingEnd = $existingStart->copy()->addHours(Reservation::BLOCK_HOURS);

            // Overlap: existing.start < new.end AND existing.end > new.start
            return $existingStart->lt($end) && $existingEnd->gt($start);
        });
    }
}
