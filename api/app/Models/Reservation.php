<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_CONFIRMED = 'confirmed';
    public const STATUS_SEATED = 'seated';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_NO_SHOW = 'no_show';

    /** How long (in hours) a reservation holds its table. */
    public const BLOCK_HOURS = 2;

    protected $fillable = [
        'customer_name',
        'phone',
        'date',
        'time',
        'party_size',
        'dining_table_id',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'time' => 'datetime',
            'party_size' => 'integer',
        ];
    }

    public function diningTable(): BelongsTo
    {
        return $this->belongsTo(DiningTable::class);
    }
}
