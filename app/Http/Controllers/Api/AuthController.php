<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiToken;
use App\Models\CustomerProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Same shape everywhere a logged-in user's identity is returned
     * (register, login, session) — one login endpoint serves BOTH customers
     * and the seller; `is_staff` is how the frontend tells them apart.
     */
    private function accountPayload(User $user, ?string $token = null): array
    {
        $profile = CustomerProfile::firstOrCreate(['user_id' => $user->id]);

        $data = [
            'email' => $user->email,
            'name' => $profile->name ?: $user->name,
            'phone' => $profile->phone,
            'address' => $profile->address,
            'is_staff' => (bool) $user->is_staff,
        ];

        if ($token !== null) {
            $data['token'] = $token;
        }

        return $data;
    }

    /**
     * Customer sign-up. Guests never need this to check out — it's only
     * for someone who wants her address remembered for next time.
     */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:200'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:40'],
        ]);

        $email = strtolower(trim($data['email']));

        if (User::where('email', $email)->exists()) {
            return response()->json(['error' => 'An account with this email already exists — try logging in instead.'], 422);
        }

        $name = trim($data['name']);
        if ($name === '') {
            return response()->json(['error' => 'Name is required.'], 422);
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($data['password']),
        ]);

        CustomerProfile::create([
            'user_id' => $user->id,
            'name' => $name,
            'phone' => trim($data['phone'] ?? ''),
        ]);

        $token = ApiToken::issueFor($user);

        return response()->json($this->accountPayload($user, $token->token), 201);
    }

    /**
     * The ONE login for the whole site — a customer and the seller both
     * sign in here, with the same form and the same endpoint. What they can
     * then do differs only by `is_staff` in the response: a customer lands
     * on her own account, the seller can also open /admin.
     */
    public function login(Request $request)
    {
        $email = strtolower(trim((string) ($request->input('email') ?? $request->input('username') ?? '')));
        $password = (string) ($request->input('password') ?? '');

        $user = ($email !== '' && $password !== '') ? User::where('email', $email)->first() : null;

        if (! $user || ! Hash::check($password, $user->password)) {
            return response()->json(['error' => 'Incorrect email or password'], 401);
        }

        $token = ApiToken::issueFor($user);

        return response()->json($this->accountPayload($user, $token->token));
    }

    public function logout(Request $request)
    {
        ApiToken::where('user_id', Auth::guard('api')->id())->delete();

        return response()->json(['ok' => true]);
    }

    public function session(Request $request)
    {
        return response()->json($this->accountPayload(Auth::guard('api')->user()));
    }
}
