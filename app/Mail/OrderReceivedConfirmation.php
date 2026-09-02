<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * Sent to the CUSTOMER the moment her order is confirmed paid — a simple
 * "we got it" receipt. Sibling of NewOrderNotification (which goes to the
 * seller instead); both are dispatched together from
 * SendOrderNotificationJob so they go out at the same time, right after
 * payment is verified.
 */
class OrderReceivedConfirmation extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order)
    {
        $this->order->loadMissing('items');
    }

    public function build(): self
    {
        $money = fn ($amount) => config('store.currency_symbol').number_format($amount);

        $itemRows = $this->order->items->map(
            fn ($i) => '<tr><td style="padding:4px 8px 4px 0">'.e($i->name).' × '.$i->qty.'</td>'
                .'<td style="padding:4px 0;text-align:right">'.$money($i->price * $i->qty).'</td></tr>'
        )->implode('');

        $itemLines = $this->order->items->map(
            fn ($i) => "- {$i->name} x{$i->qty} (".$money($i->price * $i->qty).')'
        )->implode("\n");

        $order = $this->order;
        $firstName = trim(explode(' ', trim($order->customer_name))[0] ?? '') ?: 'there';

        $html = <<<HTML
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="margin:0 0 4px">Thanks, {$firstName} — your order is in! 🎉</h2>
          <p style="color:#555;margin:0 0 16px">
            We've received your order and payment. Reference: <b>{$order->reference}</b>
          </p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px">{$itemRows}</table>
          <p style="border-top:1px solid #ddd;padding-top:8px">
            <b>Subtotal:</b> {$money($order->subtotal)}<br>
            <b>Delivery:</b> {$money($order->delivery_fee)}<br>
            <b>Total paid:</b> {$money($order->total)}
          </p>
          <h3 style="margin:16px 0 4px">Delivering to</h3>
          <p style="margin:0">
            {$order->customer_name}<br>
            {$order->customer_address}<br>
            {$order->customer_phone}
          </p>
          <p style="margin-top:20px;color:#555">
            We'll be in touch shortly to arrange delivery. If anything about
            your order looks wrong, just reply to this email.
          </p>
        </div>
        HTML;

        $text = "Thanks, {$firstName} — your order is in!\nReference: {$order->reference}\n\n{$itemLines}\n\n"
            ."Subtotal: {$money($order->subtotal)}\nDelivery: {$money($order->delivery_fee)}\n"
            ."Total paid: {$money($order->total)}\n\nDelivering to:\n{$order->customer_name}\n"
            ."{$order->customer_address}\n{$order->customer_phone}\n\n"
            ."We'll be in touch shortly to arrange delivery.";

        return $this
            ->subject("We've received your order {$order->reference}")
            ->html($html)
            ->text('mail.plain', ['text' => $text]);
    }
}
