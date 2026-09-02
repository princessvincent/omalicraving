<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * A managed list of category names the seller picks from when adding a
 * product, instead of retyping free text (and risking "Proteins" vs
 * "protein" vs "Protiens" splitting one category into three on the
 * storefront).
 */
#[Fillable(['name'])]
class Category extends Model
{
    const UPDATED_AT = null;

    protected $casts = [
        'created_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope('order', fn ($q) => $q->orderBy('name'));
    }
}
