<?php

namespace App\Services;

use App\Models\Order;
use Stripe\Checkout\Session;
use Stripe\Exception\ApiErrorException;
use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;
use Stripe\Webhook;

/**
 * Stripe Checkout — a second payment option alongside Paystack (see
 * PaystackService). Same rule applies here: the frontend never gets to
 * declare a payment successful. We create the Checkout Session server-side
 * with the order's real total, send the customer to Stripe's own hosted
 * payment page, and only ever mark the order paid after asking Stripe
 * itself — either via the webhook or a server-to-server session lookup
 * right after the redirect back (see CheckoutController::confirmStripe).
 */
class StripeCheckoutService
{
    private function client(): StripeClient
    {
        $secret = (string) config('services.stripe.secret');

        if (! $secret || str_contains($secret, 'xxxx')) {
            throw new StripeException('STRIPE_SECRET_KEY is not configured in .env — add your Stripe secret key.');
        }

        return new StripeClient($secret);
    }

    /** Builds a hosted Stripe Checkout Session from the order's own items. */
    public function createCheckoutSession(Order $order, string $successUrl, string $cancelUrl): Session
    {
        $client = $this->client();
        $currency = strtolower((string) config('services.stripe.currency'));

        $lineItems = $order->items->map(fn ($item) => [
            'price_data' => [
                'currency' => $currency,
                'product_data' => ['name' => $item->name],
                'unit_amount' => $item->price * 100,
            ],
            'quantity' => $item->qty,
        ])->all();

        if ($order->delivery_fee) {
            $lineItems[] = [
                'price_data' => [
                    'currency' => $currency,
                    'product_data' => ['name' => 'Delivery fee'],
                    'unit_amount' => $order->delivery_fee * 100,
                ],
                'quantity' => 1,
            ];
        }

        try {
            return $client->checkout->sessions->create([
                'mode' => 'payment',
                'payment_method_types' => ['card'],
                'line_items' => $lineItems,
                'customer_email' => $order->customer_email,
                'client_reference_id' => $order->reference,
                'metadata' => ['reference' => $order->reference],
                'success_url' => $successUrl,
                'cancel_url' => $cancelUrl,
            ]);
        } catch (ApiErrorException $e) {
            throw new StripeException($e->getMessage());
        }
    }

    public function retrieveSession(string $sessionId): Session
    {
        try {
            return $this->client()->checkout->sessions->retrieve($sessionId);
        } catch (ApiErrorException $e) {
            throw new StripeException($e->getMessage());
        }
    }

    public function constructWebhookEvent(string $payload, string $sigHeader): \Stripe\Event
    {
        $this->client(); // validates STRIPE_SECRET_KEY is configured

        $webhookSecret = (string) config('services.stripe.webhook_secret');
        if (! $webhookSecret) {
            throw new StripeException('STRIPE_WEBHOOK_SECRET is not configured in .env');
        }

        try {
            return Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
        } catch (\UnexpectedValueException|SignatureVerificationException $e) {
            throw new StripeException($e->getMessage());
        }
    }
}
