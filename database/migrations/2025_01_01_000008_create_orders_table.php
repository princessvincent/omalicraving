<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('reference', 64)->unique();
            // Set only when the buyer was logged in at checkout — guest
            // checkout (the default) leaves this null. Never required.
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('customer_name', 200);
            $table->string('customer_email');
            $table->string('customer_phone', 40);
            $table->text('customer_address');

            $table->unsignedInteger('subtotal');
            $table->unsignedInteger('delivery_fee')->default(0);
            $table->unsignedInteger('total');

            $table->string('status', 10)->default('pending'); // pending|paid|failed
            $table->string('payment_provider', 10)->default('paystack'); // paystack|stripe
            $table->string('stripe_session_id', 200)->default('');
            $table->boolean('notified')->default(false);
            // Raw payload from whichever gateway confirmed payment — kept for
            // support/debugging, never shown to the customer.
            $table->json('payment_verified_payload')->nullable();

            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('paid_at')->nullable();

            $table->index(['status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
