<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'menu_item_id' => $this->menu_item_id,
            'menu_item' => new MenuItemResource($this->whenLoaded('menuItem')),
            'qty' => $this->qty,
            'unit_price' => $this->unit_price, // snapshot of the menu price at order time
            'line_total' => number_format($this->qty * $this->unit_price, 2, '.', ''),
        ];
    }
}
