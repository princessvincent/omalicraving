<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Feeds the seller's moderation queue. */
class ReviewAdminResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product' => $this->product_id,
            'product_name' => $this->product?->name,
            'customer_name' => $this->customer_name,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'approved' => (bool) $this->approved,
            'created_at' => optional($this->created_at)->toJSON(),
        ];
    }
}
