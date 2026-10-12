<?php

namespace App\Http\Requests;

use App\Models\Order;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrderStatusRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    Order::STATUS_PENDING,
                    Order::STATUS_PREPARING,
                    Order::STATUS_SERVED,
                    Order::STATUS_PAID,
                    Order::STATUS_CANCELLED,
                ]),
            ],
        ];
    }
}
