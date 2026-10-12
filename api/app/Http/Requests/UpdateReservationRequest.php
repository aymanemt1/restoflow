<?php

namespace App\Http\Requests;

use App\Models\Reservation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReservationRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'customer_name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'date' => ['sometimes', 'required', 'date', 'after_or_equal:today'],
            'time' => ['sometimes', 'required', 'date_format:H:i'],
            'party_size' => ['sometimes', 'required', 'integer', 'min:1', 'max:30'],
            'dining_table_id' => ['nullable', 'integer', 'exists:dining_tables,id'],
            'status' => [
                'sometimes',
                Rule::in([
                    Reservation::STATUS_PENDING,
                    Reservation::STATUS_CONFIRMED,
                    Reservation::STATUS_SEATED,
                    Reservation::STATUS_CANCELLED,
                    Reservation::STATUS_NO_SHOW,
                ]),
            ],
        ];
    }
}
