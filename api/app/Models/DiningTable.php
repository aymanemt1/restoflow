<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DiningTable extends Model
{
    public const STATUS_FREE = 'free';
    public const STATUS_OCCUPIED = 'occupied';
    public const STATUS_RESERVED = 'reserved';

    protected $fillable = [
        'number',
        'label',
        'seats',
        'status',
    ];

    protected function casts(): array
    {
        return ['seats' => 'integer'];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(Reservation::class);
    }

    /** Orders that are still open (not paid, not cancelled). */
    public function activeOrders(): HasMany
    {
        return $this->orders()->whereNotIn('status', [Order::STATUS_PAID, Order::STATUS_CANCELLED]);
    }
}
