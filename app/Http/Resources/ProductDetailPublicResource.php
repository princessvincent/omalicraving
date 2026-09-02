<?php

namespace App\Http\Resources;

use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * A single product's own page — full description, every gallery photo, and
 * the current approved-review rating summary.
 */
class ProductDetailPublicResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $reviews = $this->relationLoaded('approvedReviews') ? $this->approvedReviews : $this->approvedReviews()->get();

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'category' => $this->category,
            'price' => $this->price,
            'description' => $this->description,
            'image' => Media::url($this->image),
            'extra_images' => $this->extraImages->map(fn ($img) => [
                'id' => $img->id,
                'image' => Media::url($img->image),
            ])->all(),
            'reviews' => ReviewResource::collection($reviews)->resolve(),
            'rating_avg' => $reviews->count() ? round($reviews->avg('rating'), 1) : null,
            'rating_count' => $reviews->count(),
        ];
    }
}
