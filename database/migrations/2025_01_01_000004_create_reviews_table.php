<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A customer's rating + comment on a product. Never shown on the site
        // until the seller approves it from the admin dashboard — keeps spam
        // and fake reviews off without needing a customer account system.
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('customer_name', 200);
            $table->unsignedTinyInteger('rating'); // 1-5, enforced in the FormRequest
            $table->text('comment')->default('');
            $table->boolean('approved')->default(false);
            $table->timestamp('created_at')->useCurrent();

            $table->index(['approved']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
