<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Product;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    /** GET: the approved reviews for one product. */
    public function index(string $slug)
    {
        $product = Product::where('slug', $slug)->where('active', true)->firstOrFail();

        return ReviewResource::collection($product->approvedReviews()->get());
    }

    /**
     * POST: a customer submitting a new review — always created unapproved,
     * regardless of anything the client sends, so there is exactly one
     * place a review can ever become visible (the seller's approve action).
     */
    public function store(Request $request, string $slug)
    {
        $product = Product::where('slug', $slug)->where('active', true)->firstOrFail();

        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:200'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string'],
        ]);

        $product->reviews()->create([
            'customer_name' => trim($data['customer_name']),
            'rating' => $data['rating'],
            'comment' => trim($data['comment'] ?? ''),
            'approved' => false,
        ]);

        return response()->json([
            'ok' => true,
            'message' => "Thanks! Your review will show once we've checked it.",
        ], 201);
    }
}
