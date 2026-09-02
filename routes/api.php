<?php

use App\Http\Controllers\Api\Admin\AboutAdminController;
use App\Http\Controllers\Api\Admin\CategoryAdminController;
use App\Http\Controllers\Api\Admin\OrderAdminController;
use App\Http\Controllers\Api\Admin\ProductAdminController;
use App\Http\Controllers\Api\Admin\ProductImageAdminController;
use App\Http\Controllers\Api\Admin\ReviewAdminController;
use App\Http\Controllers\Api\AboutController;
use App\Http\Controllers\Api\AccountCartController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\ReviewController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API routes
|--------------------------------------------------------------------------
|
| Same paths as the old Django backend's shop/urls.py, on purpose — the
| React frontend (src/api.js) talks to these exact URLs and needed no
| changes at all when the backend moved to Laravel.
|
*/

// ---- Public storefront ----
Route::get('products/', [ProductController::class, 'index']);
Route::get('products/{slug}/', [ProductController::class, 'show']);
Route::get('products/{slug}/reviews/', [ReviewController::class, 'index']);
Route::post('products/{slug}/reviews/', [ReviewController::class, 'store'])
    ->middleware('throttle:review');
Route::get('categories/', [CategoryController::class, 'index']);
Route::get('about/', [AboutController::class, 'show']);

// ---- Checkout — Paystack ----
Route::post('orders/init/', [CheckoutController::class, 'initPaystack'])
    ->middleware('throttle:checkout');
Route::post('orders/{reference}/confirm/', [CheckoutController::class, 'confirmPaystack']);
Route::post('payments/webhook/', [CheckoutController::class, 'paystackWebhook']);

// ---- Checkout — Stripe ----
Route::post('orders/init-stripe/', [CheckoutController::class, 'initStripe'])
    ->middleware('throttle:checkout');
Route::post('orders/{reference}/confirm-stripe/', [CheckoutController::class, 'confirmStripe']);
Route::post('payments/webhook-stripe/', [CheckoutController::class, 'stripeWebhook']);

// ---- Auth — one login for everyone (customer or seller) ----
Route::post('auth/register/', [AuthController::class, 'register'])->middleware('throttle:login');
Route::post('auth/login/', [AuthController::class, 'login'])->middleware('throttle:login');
Route::post('auth/logout/', [AuthController::class, 'logout'])->middleware('auth.api');
Route::get('auth/session/', [AuthController::class, 'session'])->middleware('auth.api');
Route::get('auth/profile/', [ProfileController::class, 'show'])->middleware('auth.api');
Route::patch('auth/profile/', [ProfileController::class, 'update'])->middleware('auth.api');
Route::get('auth/cart/', [AccountCartController::class, 'show'])->middleware('auth.api');
Route::put('auth/cart/', [AccountCartController::class, 'update'])->middleware('auth.api');

// ---- Admin — every route below additionally requires is_staff ----
Route::middleware('admin.staff')->group(function () {
    Route::get('admin/orders/', [OrderAdminController::class, 'index']);

    Route::get('admin/products/', [ProductAdminController::class, 'index']);
    Route::post('admin/products/', [ProductAdminController::class, 'store']);
    Route::get('admin/products/{product}/', [ProductAdminController::class, 'show']);
    Route::match(['put', 'patch'], 'admin/products/{product}/', [ProductAdminController::class, 'update']);
    Route::delete('admin/products/{product}/', [ProductAdminController::class, 'destroy']);

    Route::get('admin/categories/', [CategoryAdminController::class, 'index']);
    Route::post('admin/categories/', [CategoryAdminController::class, 'store']);
    Route::delete('admin/categories/{category}/', [CategoryAdminController::class, 'destroy']);

    Route::get('admin/products/{product}/images/', [ProductImageAdminController::class, 'index']);
    Route::post('admin/products/{product}/images/', [ProductImageAdminController::class, 'store']);
    Route::delete('admin/product-images/{productImage}/', [ProductImageAdminController::class, 'destroy']);

    Route::get('admin/reviews/', [ReviewAdminController::class, 'index']);
    Route::post('admin/reviews/{review}/approve/', [ReviewAdminController::class, 'approve']);
    Route::delete('admin/reviews/{review}/', [ReviewAdminController::class, 'destroy']);

    Route::get('admin/about/', [AboutAdminController::class, 'show']);
    Route::match(['put', 'patch'], 'admin/about/', [AboutAdminController::class, 'update']);
});
