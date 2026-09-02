<?php

namespace App\Jobs;

use App\Mail\NewOrderNotification;
use App\Models\Order;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Fires the notification email — dispatched with ->afterResponse() (see
 * CheckoutController) so a slow or misconfigured mail server can never
 * delay the customer's checkout response. Marks the order `notified` only
 * after a real send succeeds. Deliberately NOT a queued job: this app is
 * meant to run on shared hosting with no queue worker process available,
 * and ->afterResponse() already gets the "don't block the response" benefit
 * without needing one — it runs once, right after the HTTP response has
 * been sent, in the same PHP-FPM request lifecycle.
 */
class SendOrderNotificationJob
{
    use Dispatchable;

    public function __construct(public Order $order)
    {
    }

    public function handle(): void
    {
        $to = config('store.notify_email') ?: config('mail.from.address');

        if (! $to) {
            return;
        }

        try {
            Mail::to($to)->send(new NewOrderNotification($this->order));
            $this->order->forceFill(['notified' => true])->save();
        } catch (\Throwable $e) {
            Log::error("Order {$this->order->reference}: payment confirmed but the notification email failed to send.", [
                'exception' => $e,
            ]);
        }
    }
}
