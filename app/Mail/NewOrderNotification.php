<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

/**
 * Emails the business owner the moment an order is confirmed paid. Content
 * mirrors the old shop/emails.py exactly. Dispatched with
 * ->send()->afterResponse() from CheckoutController — see the note there
 * on why that (and not a queue worker) is the right call on shared hosting.
 */
class NewOrderNotification extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order)
    {
        $this->order->loadMissing('items');
    }

    public function build(): self
    {
        $money = fn ($amount) => config('store.currency_symbol').number_format($amount);
        $digitsOnly = preg_replace('/\D/', '', $this->order->customer_phone ?? '') ?? '';

        $itemRows = $this->order->items->map(
            fn ($i) => '<tr><td style="padding:4px 8px 4px 0">'.e($i->name).' × '.$i->qty.'</td>'
                .'<td style="padding:4px 0;text-align:right">'.$money($i->price * $i->qty).'</td></tr>'
        )->implode('');

        $itemLines = $this->order->items->map(
            fn ($i) => "- {$i->name} x{$i->qty} (".$money($i->price * $i->qty).')'
        )->implode("\n");

        $order = $this->order;

        $html = <<<HTML
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <h2 style="margin:0 0 4px">New order received</h2>
          <p style="color:#555;margin:0 0 16px">Reference: <b>{$order->reference}</b></p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px">{$itemRows}</table>
          <p style="border-top:1px solid #ddd;padding-top:8px">
            <b>Subtotal:</b> {$money($order->subtotal)}<br>
            <b>Delivery:</b> {$money($order->delivery_fee)}<br>
            <b>Total paid:</b> {$money($order->total)}
          </p>
          <h3 style="margin:16px 0 4px">Customer</h3>
          <p style="margin:0">
            Name: {$order->customer_name}<br>
            Email: {$order->customer_email}<br>
            Phone/WhatsApp: {$order->customer_phone}<br>
            Address: {$order->customer_address}
          </p>
          <p style="margin-top:20px">
            <a href="https://wa.me/{$digitsOnly}"
               style="background:#25D366;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold">
               Message customer on WhatsApp
            </a>
          </p>
        </div>
        HTML;

        $text = "New order received\nReference: {$order->reference}\n\n{$itemLines}\n\n"
            ."Subtotal: {$money($order->subtotal)}\nDelivery: {$money($order->delivery_fee)}\n"
            ."Total paid: {$money($order->total)}\n\nCustomer: {$order->customer_name}\n"
            ."Email: {$order->customer_email}\nPhone/WhatsApp: {$order->customer_phone}\n"
            ."Address: {$order->customer_address}";

        return $this
            ->subject("New order {$order->reference} — {$money($order->total)}")
            ->html($html)
            ->text('mail.plain', ['text' => $text]);
    }
}
