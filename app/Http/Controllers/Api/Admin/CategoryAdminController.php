<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CategoryAdminController extends Controller
{
    /** Where a category actually gets created — a deliberate step before it
     * ever shows up in the product form's dropdown. */
    public function index()
    {
        return CategoryResource::collection(Category::all());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', Rule::unique('categories', 'name')],
        ]);

        $name = trim($data['name']);
        if ($name === '') {
            return response()->json(['error' => 'Category name is required.'], 422);
        }

        $category = Category::create(['name' => $name]);

        return (new CategoryResource($category))->response()->setStatusCode(201);
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return response()->noContent();
    }
}
