<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DiningTableResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'number' => $this->number,
            'label' => $this->label,
            'seats' => $this->seats,
            'status' => $this->status,
            'active_orders_count' => $this->whenCounted('active_orders_count'),
        ];
    }
}
