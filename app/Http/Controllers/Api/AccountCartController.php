<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * The logged-in customer's cart, so it follows her to a new device — guests
 * keep using localStorage only, this is additive, not a replacement.
 */
class AccountCartController extends Controller
{
    public function show()
    {
        $profile = CustomerProfile::firstOrCreate(['user_id' => Auth::guard('api')->id()]);

        return response()->json(['items' => $profile->cart_items ?: (object) []]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'items' => ['sometimes', 'array'],
            'items.*' => ['integer', 'min:1', 'max:99'],
        ]);

        $profile = CustomerProfile::firstOrCreate(['user_id' => Auth::guard('api')->id()]);
        $profile->cart_items = $data['items'] ?? [];
        $profile->save();

        return response()->json(['items' => $profile->cart_items ?: (object) []]);
    }
}
