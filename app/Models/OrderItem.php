<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['order_id', 'product_id', 'name', 'price', 'qty'])]
class OrderItem extends Model
{
    public $timestamps = false;

    protected $casts = [
        'price' => 'integer',
        'qty' => 'integer',
    ];

    // NOT appended to JSON output — the API's OrderItemSerializer equivalent
    // only ever exposes name/price/qty (see Http/Resources/OrderResource).
    // The accessor below stays available for server-side use only (emails).

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function subtotal(): \Illuminate\Database\Eloquent\Casts\Attribute
    {
        return \Illuminate\Database\Eloquent\Casts\Attribute::make(
            get: fn () => $this->price * $this->qty,
        );
    }
}
