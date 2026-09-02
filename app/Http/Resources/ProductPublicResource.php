<?php

namespace App\Http\Resources;

use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** What customers see on the storefront grid — no internal fields. */
class ProductPublicResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'category' => $this->category,
            'price' => $this->price,
            'description' => $this->description,
            'image' => Media::url($this->image),
        ];
    }
}
