<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductDetailPublicResource;
use App\Http\Resources\ProductPublicResource;
use App\Models\Product;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /** What customers see on the storefront — active products only. */
    public function index()
    {
        return ProductPublicResource::collection(Product::where('active', true)->get());
    }

    /**
     * A single product's own page — full description, gallery photos, and
     * approved reviews. Looked up by slug so the URL is a clean, shareable
     * /product/<slug>/ link rather than a bare numeric id.
     */
    public function show(Request $request, string $slug)
    {
        $product = Product::where('active', true)
            ->where('slug', $slug)
            ->with(['extraImages', 'approvedReviews'])
            ->firstOrFail();

        return new ProductDetailPublicResource($product);
    }
}
