<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MenuItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'price' => $this->price, // MAD
            'category_id' => $this->category_id,
            'category' => new CategoryResource($this->whenLoaded('category')),
            'available' => $this->available,
        ];
    }
}
