<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * A customer's saved account details — created on registration. Holds the
 * delivery address/phone she can reuse at checkout instead of typing it
 * every time, plus her cart (logged-in customers see the same cart on any
 * device, not just the one it was built on).
 */
#[Fillable(['user_id', 'name', 'phone', 'address', 'cart_items'])]
class CustomerProfile extends Model
{
    const CREATED_AT = null;

    protected $casts = [
        'cart_items' => 'array',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
