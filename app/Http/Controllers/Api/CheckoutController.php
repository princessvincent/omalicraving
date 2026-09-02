<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Jobs\SendOrderNotificationJob;
use App\Models\CustomerProfile;
use App\Models\Order;
use App\Models\Product;
use App\Services\PaystackException;
use App\Services\PaystackService;
use App\Services\StripeCheckoutService;
use App\Services\StripeException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class CheckoutController extends Controller
{
    private function checkoutRules(): array
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.id' => ['required', 'integer'],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:99'],
            'name' => ['required', 'string', 'max:200'],
            'email' => ['required', 'email'],
            'phone' => ['required', 'string', 'max:40'],
            'address' => ['required', 'string', 'max:2000'],
        ];
    }

    private function generateReference(): string
    {
        return 'CRV-'.time().'-'.Str::lower(Str::random(6));
    }

    /**
     * Shared by every checkout entry point (Paystack, Stripe, ...): looks up
     * real prices server-side and creates the pending Order + OrderItems.
     * The client sends product ids + quantities only — never a price, never
     * a total — so there is nothing for a tampered frontend to lie about
     * here. Returns [Order|null, JsonResponse|null].
     */
    private function buildOrder(array $data, string $provider)
    {
        $lineItems = [];
        $subtotal = 0;

        foreach ($data['items'] as $entry) {
            $product = Product::where('id', $entry['id'])->where('active', true)->first();
            if (! $product) {
                return [null, response()->json(['error' => "Product {$entry['id']} is no longer available"], 400)];
            }
            $qty = (int) $entry['qty'];
            $lineItems[] = ['product' => $product, 'name' => $product->name, 'price' => $product->price, 'qty' => $qty];
            $subtotal += $product->price * $qty;
        }

        $deliveryFee = (int) config('store.delivery_fee');
        $total = $subtotal + $deliveryFee;
        $reference = $this->generateReference();
        $user = Auth::guard('api')->user();

        $order = DB::transaction(function () use ($lineItems, $subtotal, $deliveryFee, $total, $reference, $provider, $data, $user) {
            $order = Order::create([
                'reference' => $reference,
                'user_id' => $user?->id,
                'customer_name' => trim($data['name']),
                'customer_email' => trim($data['email']),
                'customer_phone' => trim($data['phone']),
                'customer_address' => trim($data['address']),
                'subtotal' => $subtotal,
                'delivery_fee' => $deliveryFee,
                'total' => $total,
                'status' => Order::STATUS_PENDING,
                'payment_provider' => $provider,
            ]);

            foreach ($lineItems as $li) {
                $order->items()->create([
                    'product_id' => $li['product']->id,
                    'name' => $li['name'],
                    'price' => $li['price'],
                    'qty' => $li['qty'],
                ]);
            }

            if ($order->user_id) {
                // She's logged in and just typed a delivery address — save
                // it so it's already there next time, regardless of whether
                // this particular payment goes through.
                $profile = CustomerProfile::firstOrCreate(['user_id' => $order->user_id]);
                $profile->name = $order->customer_name ?: $profile->name;
                $profile->phone = $order->customer_phone;
                $profile->address = $order->customer_address;
                $profile->save();
            }

            return $order;
        });

        return [$order, null];
    }

    /**
     * Starts a Paystack-backed order. Open to guests, but a valid token (if
     * the buyer is logged in) still links the order to her account.
     */
    public function initPaystack(Request $request)
    {
        $data = $request->validate($this->checkoutRules());

        [$order, $error] = $this->buildOrder($data, Order::PROVIDER_PAYSTACK);
        if ($error) {
            return $error;
        }

        return response()->json([
            'reference' => $order->reference,
            'email' => $order->customer_email,
            'amount' => $order->total,
            'amountKobo' => $order->total * 100,
            'currency' => config('store.currency'),
            'currencySymbol' => config('store.currency_symbol'),
            'publicKey' => config('services.paystack.public'),
        ]);
    }

    /**
     * Starts a Stripe-backed order. Hands back a Stripe Checkout Session URL
     * instead of a Paystack popup key — the customer is redirected to
     * Stripe's own hosted payment page, so this backend never touches card
     * details.
     */
    public function initStripe(Request $request, StripeCheckoutService $stripe)
    {
        $data = $request->validate($this->checkoutRules());

        [$order, $error] = $this->buildOrder($data, Order::PROVIDER_STRIPE);
        if ($error) {
            return $error;
        }

        $siteUrl = rtrim((string) config('store.site_url'), '/');
        $successUrl = "{$siteUrl}/?stripe_ref={$order->reference}";
        $cancelUrl = "{$siteUrl}/?stripe_cancel={$order->reference}";

        try {
            $session = $stripe->createCheckoutSession($order, $successUrl, $cancelUrl);
        } catch (StripeException $e) {
            return response()->json(['error' => $e->getMessage()], 400);
        }

        $order->stripe_session_id = $session->id;
        $order->save();

        return response()->json(['reference' => $order->reference, 'sessionUrl' => $session->url]);
    }

    /**
     * Single source of truth for "is this order really paid" — used by both
     * the frontend-triggered confirm endpoint and the Paystack webhook, so
     * there is exactly one code path that can ever flip an order to paid.
     * Returns [bool success, string error].
     */
    private function markPaidIfVerifiedPaystack(Order $order, array $verified): array
    {
        if (($verified['status'] ?? null) !== 'success') {
            return [false, 'Payment was not successful'];
        }

        if (($verified['amount'] ?? null) !== $order->total * 100) {
            // Someone paid a different amount than what this order actually
            // costs. Never mark paid — this is exactly the "bypass"
            // scenario to block.
            return [false, 'Amount paid does not match the order total'];
        }

        $paystackCurrency = $verified['currency'] ?? null;
        if ($paystackCurrency && $paystackCurrency !== config('store.currency')) {
            return [false, 'Payment currency does not match'];
        }

        $order->status = Order::STATUS_PAID;
        $order->paid_at = now();
        $order->payment_verified_payload = $verified;
        $order->save();

        return [true, ''];
    }

    private function markPaidIfVerifiedStripe(Order $order, \Stripe\Checkout\Session $session): array
    {
        if ($session->payment_status !== 'paid') {
            return [false, 'Payment was not successful'];
        }

        if ($session->amount_total !== $order->total * 100) {
            return [false, 'Amount paid does not match the order total'];
        }

        if ($session->currency && strtoupper($session->currency) !== strtoupper((string) config('services.stripe.currency'))) {
            return [false, 'Payment currency does not match'];
        }

        $order->status = Order::STATUS_PAID;
        $order->paid_at = now();
        $order->payment_verified_payload = [
            'stripe_session_id' => $session->id,
            'payment_status' => $session->payment_status,
            'amount_total' => $session->amount_total,
            'currency' => $session->currency,
        ];
        $order->save();

        return [true, ''];
    }

    /**
     * Locks the order row, verifies with Paystack, and marks it paid — all
     * inside one transaction so two near-simultaneous calls (e.g. the
     * browser's confirm AND the webhook firing at the same time) can't both
     * process the same order. Returns [Order|null, string|null error].
     */
    private function confirmAndNotifyPaystack(string $reference, PaystackService $paystack): array
    {
        $result = DB::transaction(function () use ($reference, $paystack) {
            $order = Order::withoutGlobalScopes()->where('reference', $reference)->lockForUpdate()->first();
            if (! $order) {
                return [null, 'Order not found'];
            }

            if ($order->status === Order::STATUS_PAID) {
                return [$order, null]; // already handled — idempotent no-op
            }

            try {
                $verified = $paystack->verifyTransaction($reference);
            } catch (PaystackException $e) {
                return [null, $e->getMessage()];
            }

            [$ok, $err] = $this->markPaidIfVerifiedPaystack($order, $verified);
            if (! $ok) {
                $order->status = Order::STATUS_FAILED;
                $order->save();

                return [null, $err];
            }

            return [$order, null];
        });

        // Outside the transaction/lock on purpose: emailing must never hold
        // a DB lock open or delay this response.
        if ($result[0] !== null && $result[0]->status === Order::STATUS_PAID && ! $result[0]->notified) {
            SendOrderNotificationJob::dispatch($result[0])->afterResponse();
        }

        return $result;
    }

    private function confirmAndNotifyStripe(string $reference, StripeCheckoutService $stripe): array
    {
        $result = DB::transaction(function () use ($reference, $stripe) {
            $order = Order::withoutGlobalScopes()->where('reference', $reference)->lockForUpdate()->first();
            if (! $order) {
                return [null, 'Order not found'];
            }

            if ($order->status === Order::STATUS_PAID) {
                return [$order, null];
            }

            if (! $order->stripe_session_id) {
                return [null, 'This order has no Stripe session to confirm'];
            }

            try {
                $session = $stripe->retrieveSession($order->stripe_session_id);
            } catch (StripeException $e) {
                return [null, $e->getMessage()];
            }

            [$ok, $err] = $this->markPaidIfVerifiedStripe($order, $session);
            if (! $ok) {
                $order->status = Order::STATUS_FAILED;
                $order->save();

                return [null, $err];
            }

            return [$order, null];
        });

        if ($result[0] !== null && $result[0]->status === Order::STATUS_PAID && ! $result[0]->notified) {
            SendOrderNotificationJob::dispatch($result[0])->afterResponse();
        }

        return $result;
    }

    public function confirmPaystack(string $reference, PaystackService $paystack)
    {
        [$order, $error] = $this->confirmAndNotifyPaystack($reference, $paystack);
        if ($error) {
            return response()->json(['error' => $error], 400);
        }

        return response()->json(['status' => $order->status, 'order' => (new OrderResource($order))->resolve()]);
    }

    public function confirmStripe(string $reference, StripeCheckoutService $stripe)
    {
        [$order, $error] = $this->confirmAndNotifyStripe($reference, $stripe);
        if ($error) {
            return response()->json(['error' => $error], 400);
        }

        return response()->json(['status' => $order->status, 'order' => (new OrderResource($order))->resolve()]);
    }

    /**
     * Authoritative, server-to-server confirmation. Configure this URL in
     * the Paystack dashboard (Settings -> API Keys & Webhooks) so an order
     * still gets marked paid and the owner still gets notified even if the
     * customer closes their browser right after paying, before the
     * frontend gets a chance to call /confirm.
     */
    public function paystackWebhook(Request $request, PaystackService $paystack)
    {
        $signature = (string) $request->header('x-paystack-signature', '');
        $secret = (string) config('services.paystack.secret');
        $expected = hash_hmac('sha512', $request->getContent(), $secret);

        if (! $secret || ! hash_equals($expected, $signature)) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        $event = $request->all();
        if (($event['event'] ?? null) === 'charge.success') {
            $reference = $event['data']['reference'] ?? null;
            if ($reference) {
                $this->confirmAndNotifyPaystack($reference, $paystack);
            }
        }

        return response()->json(['received' => true]);
    }

    /**
     * Stripe counterpart of the webhook above.
     */
    public function stripeWebhook(Request $request, StripeCheckoutService $stripe)
    {
        $sigHeader = (string) $request->header('stripe-signature', '');

        try {
            $event = $stripe->constructWebhookEvent($request->getContent(), $sigHeader);
        } catch (StripeException $e) {
            return response()->json(['error' => $e->getMessage()], 401);
        }

        if ($event->type === 'checkout.session.completed') {
            $session = $event->data->object;
            $reference = $session->client_reference_id ?? ($session->metadata->reference ?? null);
            if ($reference) {
                $this->confirmAndNotifyStripe($reference, $stripe);
            }
        }

        return response()->json(['received' => true]);
    }
}
