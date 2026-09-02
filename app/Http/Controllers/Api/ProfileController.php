<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CustomerProfile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * A logged-in customer's own saved details — read on her Account page,
 * written either from there or automatically after a checkout she was
 * logged in for (see CheckoutController::buildOrder).
 */
class ProfileController extends Controller
{
    private function profile(): CustomerProfile
    {
        return CustomerProfile::firstOrCreate(['user_id' => Auth::guard('api')->id()]);
    }

    public function show()
    {
        $user = Auth::guard('api')->user();
        $profile = $this->profile();

        return response()->json([
            'name' => $profile->name,
            'email' => $user->email,
            'phone' => $profile->phone,
            'address' => $profile->address,
            'is_staff' => (bool) $user->is_staff,
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:200'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:40'],
            'address' => ['sometimes', 'nullable', 'string'],
        ]);

        $profile = $this->profile();

        if (array_key_exists('name', $data)) {
            $profile->name = trim($data['name']);
        }
        if (array_key_exists('phone', $data)) {
            $profile->phone = $data['phone'] ?? '';
        }
        if (array_key_exists('address', $data)) {
            $profile->address = $data['address'] ?? '';
        }
        $profile->save();

        return $this->show();
    }
}
