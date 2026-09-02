<?php

namespace App\Http\Resources;

use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AboutResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'heading' => $this->heading,
            'subheading' => $this->subheading,
            'bio' => $this->bio,
            'years_experience' => $this->years_experience,
            'photo' => Media::url($this->photo),
            'updated_at' => optional($this->updated_at)->toJSON(),
        ];
    }
}
