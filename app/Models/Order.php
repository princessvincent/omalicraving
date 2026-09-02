<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'reference', 'user_id', 'customer_name', 'customer_email', 'customer_phone',
    'customer_address', 'subtotal', 'delivery_fee', 'total', 'status',
    'payment_provider', 'stripe_session_id', 'notified', 'payment_verified_payload', 'paid_at',
])]
class Order extends Model
{
    const UPDATED_AT = null;

    public const STATUS_PENDING = 'pending';
    public const STATUS_PAID = 'paid';
    public const STATUS_FAILED = 'failed';

    public const PROVIDER_PAYSTACK = 'paystack';
    public const PROVIDER_STRIPE = 'stripe';

    protected $casts = [
        'subtotal' => 'integer',
        'delivery_fee' => 'integer',
        'total' => 'integer',
        'notified' => 'boolean',
        'payment_verified_payload' => 'array',
        'created_at' => 'datetime',
        'paid_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope('order', fn ($q) => $q->orderByDesc('created_at'));
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
