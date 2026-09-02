<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['product_id', 'customer_name', 'rating', 'comment', 'approved'])]
class Review extends Model
{
    const UPDATED_AT = null;

    protected $casts = [
        'rating' => 'integer',
        'approved' => 'boolean',
        'created_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope('order', fn ($q) => $q->orderByDesc('created_at'));
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
