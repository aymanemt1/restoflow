<?php

namespace App\Http\Requests;

use App\Models\DiningTable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDiningTableRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'number' => ['sometimes', 'required', 'integer', 'min:1', 'unique:dining_tables,number,'.$this->route('dining_table')->id],
            'label' => ['nullable', 'string', 'max:255'],
            'seats' => ['sometimes', 'required', 'integer', 'min:1', 'max:30'],
            'status' => ['sometimes', Rule::in([DiningTable::STATUS_FREE, DiningTable::STATUS_OCCUPIED, DiningTable::STATUS_RESERVED])],
        ];
    }
}
