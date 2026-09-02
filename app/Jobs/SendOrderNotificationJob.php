<?php

namespace App\Jobs;

use App\Mail\NewOrderNotification;
use App\Mail\OrderReceivedConfirmation;
use App\Models\Order;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Fires both post-payment emails — dispatched with ->afterResponse() (see
 * CheckoutController) so a slow or misconfigured mail server can never
 * delay the customer's checkout response. Marks the order `notified` only
 * after the admin email succeeds (that flag is what stops this job being
 * dispatched again for the same order — see CheckoutController). The
 * customer's own confirmation is sent alongside it, best-effort, with its
 * own independent try/catch so a failure on one side never blocks the
 * other. Deliberately NOT a queued job: this app is meant to run on shared
 * hosting with no queue worker process available, and ->afterResponse()
 * already gets the "don't block the response" benefit without needing one.
 */
class SendOrderNotificationJob
{
    use Dispatchable;

    public function __construct(public Order $order)
    {
    }

    public function handle(): void
    {
        $adminTo = config('store.notify_email') ?: config('mail.from.address');

        if ($adminTo) {
            try {
                Mail::to($adminTo)->send(new NewOrderNotification($this->order));
                $this->order->forceFill(['notified' => true])->save();
            } catch (\Throwable $e) {
                Log::error("Order {$this->order->reference}: payment confirmed but the admin notification email failed to send.", [
                    'exception' => $e,
                ]);
            }
        }

        if ($this->order->customer_email) {
            try {
                Mail::to($this->order->customer_email)->send(new OrderReceivedConfirmation($this->order));
            } catch (\Throwable $e) {
                Log::error("Order {$this->order->reference}: payment confirmed but the customer's order-received email failed to send.", [
                    'exception' => $e,
                ]);
            }
        }
    }
}
