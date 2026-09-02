<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable(['name', 'category', 'price', 'description', 'image', 'active'])]
class Product extends Model
{
    const UPDATED_AT = null;

    protected $casts = [
        'price' => 'integer',
        'active' => 'boolean',
        'created_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope('order', fn ($q) => $q->orderByDesc('created_at'));

        static::creating(function (Product $product) {
            if (! $product->slug) {
                $product->slug = static::uniqueSlugFor($product->name);
            }
        });
    }

    public static function uniqueSlugFor(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $base = $base !== '' ? substr($base, 0, 200) : 'product';
        $slug = $base;
        $n = 2;

        while (
            static::withoutGlobalScopes()
                ->where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->whereKeyNot($ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$n}";
            $n++;
        }

        return $slug;
    }

    public function extraImages(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('created_at');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function approvedReviews(): HasMany
    {
        return $this->reviews()->where('approved', true);
    }
}
