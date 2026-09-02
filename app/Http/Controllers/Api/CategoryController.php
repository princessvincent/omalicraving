<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;

class CategoryController extends Controller
{
    /**
     * The current picklist of category names — used by the "Add product"
     * form so the seller picks an existing category instead of retyping one.
     */
    public function index()
    {
        return CategoryResource::collection(Category::all());
    }
}
