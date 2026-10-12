<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReservationRequest;
use App\Http\Requests\UpdateReservationRequest;
use App\Http\Resources\ReservationResource;
use App\Models\Reservation;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReservationController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $reservations = Reservation::query()
            ->with('diningTable')
            ->when($request->filled('date'), fn ($q) => $q->whereDate('date', $request->date('date')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('dining_table_id'), fn ($q) => $q->where('dining_table_id', $request->integer('dining_table_id')))
            ->orderBy('date')->orderBy('time')
            ->paginate(50);

        return ReservationResource::collection($reservations);
    }

    public function show(Reservation $reservation): ReservationResource
    {
        return new ReservationResource($reservation->load('diningTable'));
    }

    public function store(StoreReservationRequest $request, ReservationService $reservations): JsonResponse
    {
        $data = $request->validated();

        $this->guardAgainstDoubleBooking($reservations, $data['dining_table_id'] ?? null, $data['date'], $data['time']);

        $reservation = Reservation::create($data)->refresh(); // pick up DB defaults

        return (new ReservationResource($reservation->load('diningTable')))->response()->setStatusCode(201);
    }

    public function update(UpdateReservationRequest $request, Reservation $reservation, ReservationService $reservations): ReservationResource
    {
        $data = $request->validated();

        // Re-check the 2-hour block whenever date / time / table changes.
        if (array_intersect_key($data, array_flip(['date', 'time', 'dining_table_id']))) {
            $this->guardAgainstDoubleBooking(
                $reservations,
                array_key_exists('dining_table_id', $data) ? $data['dining_table_id'] : $reservation->dining_table_id,
                $data['date'] ?? $reservation->date->toDateString(),
                $data['time'] ?? $reservation->time->format('H:i'),
                $reservation->id,
            );
        }

        $reservation->update($data);

        return new ReservationResource($reservation->fresh()->load('diningTable'));
    }

    public function destroy(Reservation $reservation): JsonResponse
    {
        $reservation->delete();

        return response()->json(null, 204);
    }

    protected function guardAgainstDoubleBooking(
        ReservationService $reservations,
        ?int $diningTableId,
        string $date,
        string $time,
        ?int $ignoreId = null,
    ): void {
        if ($diningTableId && $reservations->isTableDoubleBooked($diningTableId, $date, $time, $ignoreId)) {
            abort(422, 'This table is already booked for the requested time (2-hour blocks).');
        }
    }
}
