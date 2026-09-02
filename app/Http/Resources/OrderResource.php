<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'customer_name' => $this->customer_name,
            'customer_email' => $this->customer_email,
            'customer_phone' => $this->customer_phone,
            'customer_address' => $this->customer_address,
            'subtotal' => $this->subtotal,
            'delivery_fee' => $this->delivery_fee,
            'total' => $this->total,
            'status' => $this->status,
            'payment_provider' => $this->payment_provider,
            'notified' => (bool) $this->notified,
            'created_at' => optional($this->created_at)->toJSON(),
            'paid_at' => optional($this->paid_at)->toJSON(),
            'items' => $this->items->map(fn ($item) => [
                'name' => $item->name,
                'price' => $item->price,
                'qty' => $item->qty,
            ])->all(),
        ];
    }
}
