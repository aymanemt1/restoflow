<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    public const STATUS_PENDING = 'pending';
    public const STATUS_PREPARING = 'preparing';
    public const STATUS_SERVED = 'served';
    public const STATUS_PAID = 'paid';
    public const STATUS_CANCELLED = 'cancelled';

    /** Allowed status transitions. */
    public const TRANSITIONS = [
        self::STATUS_PENDING => [self::STATUS_PREPARING, self::STATUS_CANCELLED],
        self::STATUS_PREPARING => [self::STATUS_SERVED, self::STATUS_CANCELLED],
        self::STATUS_SERVED => [self::STATUS_PAID, self::STATUS_CANCELLED],
        self::STATUS_PAID => [],
        self::STATUS_CANCELLED => [],
    ];

    protected $fillable = [
        'dining_table_id',
        'user_id',
        'status',
        'total',
        'notes',
        'paid_at',
    ];

    protected function casts(): array
    {
        return [
            'total' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    public function diningTable(): BelongsTo
    {
        return $this->belongsTo(DiningTable::class);
    }

    /** Staff member who took the order. */
    public function staff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function canTransitionTo(string $status): bool
    {
        return in_array($status, self::TRANSITIONS[$this->status] ?? [], true);
    }

    public function isOpen(): bool
    {
        return ! in_array($this->status, [self::STATUS_PAID, self::STATUS_CANCELLED], true);
    }

    /** Recomputes the total from the order lines (unit price × qty). */
    public function computeTotal(): string
    {
        $total = $this->items->sum(fn (OrderItem $item) => $item->qty * $item->unit_price);

        return number_format($total, 2, '.', '');
    }
}
