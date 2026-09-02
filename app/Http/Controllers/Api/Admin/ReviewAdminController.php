<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewAdminResource;
use App\Models\Review;

class ReviewAdminController extends Controller
{
    /**
     * The seller's moderation queue — pending reviews first (oldest first,
     * so nothing waits forever), then everything already decided.
     */
    public function index()
    {
        $reviews = Review::withoutGlobalScopes()
            ->with('product')
            ->orderBy('approved')
            ->orderBy('created_at')
            ->get();

        return ReviewAdminResource::collection($reviews);
    }

    public function approve(Review $review)
    {
        $review->approved = true;
        $review->save();

        return new ReviewAdminResource($review);
    }

    /** Also how a pending review gets rejected — there is no separate
     * "rejected" state to show the customer, so it's just deleted. */
    public function destroy(Review $review)
    {
        $review->delete();

        return response()->noContent();
    }
}
