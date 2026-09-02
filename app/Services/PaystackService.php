<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * Server-to-server Paystack verification.
 *
 * This is the crux of "no way to bypass paying": the frontend can *tell* us
 * a payment succeeded, but we never take its word for it. We ask Paystack
 * directly, using the secret key (never exposed to the browser), and only
 * trust what Paystack itself says.
 */
class PaystackService
{
    /** @return array<string, mixed> */
    public function verifyTransaction(string $reference): array
    {
        $secret = (string) config('services.paystack.secret');

        if (! $secret || str_starts_with($secret, 'sk_test_xxxx') || str_contains($secret, 'xxxx')) {
            throw new PaystackException(
                'PAYSTACK_SECRET_KEY is not configured in .env — add your Paystack secret key.'
            );
        }

        try {
            $response = Http::withToken($secret)
                ->timeout(15)
                ->get("https://api.paystack.co/transaction/verify/".rawurlencode($reference));
        } catch (\Throwable $e) {
            throw new PaystackException("Could not reach Paystack: {$e->getMessage()}");
        }

        $payload = $response->json() ?? [];

        if (! $response->successful()) {
            throw new PaystackException($payload['message'] ?? 'Paystack verification request failed');
        }

        return $payload['data']; // {status: 'success'|..., amount (kobo), currency, reference, ...}
    }
}
