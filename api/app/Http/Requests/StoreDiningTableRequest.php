<?php

namespace App\Http\Requests;

use App\Models\DiningTable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDiningTableRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'number' => ['required', 'integer', 'min:1', 'unique:dining_tables,number'],
            'label' => ['nullable', 'string', 'max:255'],
            'seats' => ['required', 'integer', 'min:1', 'max:30'],
            'status' => ['sometimes', Rule::in([DiningTable::STATUS_FREE, DiningTable::STATUS_OCCUPIED, DiningTable::STATUS_RESERVED])],
        ];
    }
}
