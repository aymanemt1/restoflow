<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReservationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_name' => $this->customer_name,
            'phone' => $this->phone,
            'date' => $this->date?->toDateString(),   // YYYY-MM-DD
            'time' => $this->time?->format('H:i'),      // HH:MM
            'party_size' => $this->party_size,
            'dining_table_id' => $this->dining_table_id,
            'dining_table' => new DiningTableResource($this->whenLoaded('diningTable')),
            'status' => $this->status,
        ];
    }
}
