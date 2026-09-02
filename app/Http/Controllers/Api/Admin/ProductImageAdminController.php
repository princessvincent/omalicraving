<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Extra gallery photos for one product — separate from its cover photo,
 * which is uploaded straight onto the product itself.
 */
class ProductImageAdminController extends Controller
{
    public function index(Product $product)
    {
        return $product->extraImages->map(fn ($img) => [
            'id' => $img->id,
            'image' => Media::url($img->image),
        ]);
    }

    public function store(Request $request, Product $product)
    {
        $data = $request->validate([
            'image' => ['required', 'file', 'image', 'max:5120'],
        ]);

        $path = $request->file('image')->store('products/gallery', 'public');
        $image = $product->extraImages()->create(['image' => $path]);

        return response()->json(['id' => $image->id, 'image' => Media::url($image->image)], 201);
    }

    public function destroy(ProductImage $productImage)
    {
        Storage::disk('public')->delete($productImage->image);
        $productImage->delete();

        return response()->noContent();
    }
}
