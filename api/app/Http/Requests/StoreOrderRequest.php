<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'dining_table_id' => ['required', 'integer', 'exists:dining_tables,id'],
            'notes' => ['nullable', 'string'],
            // Optional initial order lines — validated here, priced server-side.
            'items' => ['sometimes', 'array', 'min:1'],
            'items.*.menu_item_id' => ['required_with:items', 'integer', 'exists:menu_items,id'],
            'items.*.qty' => ['required_with:items', 'integer', 'min:1'],
        ];
    }
}
