<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A customer's saved account details — created on registration. Holds
        // the delivery address/phone she can reuse at checkout instead of
        // typing it every time, plus her cart (synced across devices).
        Schema::create('customer_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('name', 200)->default('');
            $table->string('phone', 40)->default('');
            $table->text('address')->default('');
            // {"<product_id>": qty, ...} — mirrors the shape the frontend
            // already keeps in localStorage, so syncing is a straight
            // read/write, no reshaping.
            $table->json('cart_items')->nullable();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_profiles');
    }
};
