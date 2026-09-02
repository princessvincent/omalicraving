<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Approved reviews as shown on a product's page — no `approved` field. */
class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'customer_name' => $this->customer_name,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'created_at' => optional($this->created_at)->toJSON(),
        ];
    }
}
