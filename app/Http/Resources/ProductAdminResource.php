<?php

namespace App\Http\Resources;

use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductAdminResource extends JsonResource
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
            'extra_images' => $this->extraImages->map(fn ($img) => [
                'id' => $img->id,
                'image' => Media::url($img->image),
            ])->all(),
            'active' => (bool) $this->active,
            'created_at' => optional($this->created_at)->toJSON(),
        ];
    }
}
