<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductAdminResource;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductAdminController extends Controller
{
    private const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

    private array $rules = [
        'name' => ['required', 'string', 'max:200'],
        'category' => ['sometimes', 'nullable', 'string', 'max:100'],
        'price' => ['required', 'integer', 'min:1'],
        'description' => ['sometimes', 'nullable', 'string'],
        'active' => ['sometimes'],
    ];

    public function index()
    {
        return ProductAdminResource::collection(Product::with('extraImages')->get());
    }

    /** New products always start visible, regardless of what the client sends. */
    public function store(Request $request)
    {
        $data = $request->validate($this->rules + [
            'image' => ['sometimes', 'nullable', 'file', 'image', 'max:'.(self::MAX_IMAGE_BYTES / 1024)],
        ]);

        $product = new Product([
            'name' => trim($data['name']),
            'category' => trim($data['category'] ?? '') ?: 'General',
            'price' => $data['price'],
            'description' => trim($data['description'] ?? ''),
            'active' => true,
        ]);

        if ($request->hasFile('image')) {
            $product->image = $request->file('image')->store('products', 'public');
        }

        $product->save();

        return (new ProductAdminResource($product->load('extraImages')))->response()->setStatusCode(201);
    }

    public function show(Product $product)
    {
        return new ProductAdminResource($product->load('extraImages'));
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:200'],
            'category' => ['sometimes', 'nullable', 'string', 'max:100'],
            'price' => ['sometimes', 'integer', 'min:1'],
            'description' => ['sometimes', 'nullable', 'string'],
            'active' => ['sometimes'],
            'image' => ['sometimes', 'nullable', 'file', 'image', 'max:'.(self::MAX_IMAGE_BYTES / 1024)],
        ]);

        if (array_key_exists('name', $data)) {
            $name = trim($data['name']);
            if ($name === '') {
                return response()->json(['error' => 'name: Name is required.'], 422);
            }
            $product->name = $name;
        }
        if (array_key_exists('category', $data)) {
            $product->category = trim((string) $data['category']) ?: 'General';
        }
        if (array_key_exists('price', $data)) {
            $product->price = $data['price'];
        }
        if (array_key_exists('description', $data)) {
            $product->description = $data['description'] ?? '';
        }
        if ($request->has('active')) {
            $product->active = filter_var($request->input('active'), FILTER_VALIDATE_BOOLEAN);
        }

        if ($request->hasFile('image')) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $product->image = $request->file('image')->store('products', 'public');
        }

        $product->save();

        return new ProductAdminResource($product->load('extraImages'));
    }

    public function destroy(Product $product)
    {
        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }
        foreach ($product->extraImages as $img) {
            Storage::disk('public')->delete($img->image);
        }
        $product->delete();

        return response()->noContent();
    }
}
